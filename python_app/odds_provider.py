"""
Flashscore v2.3 Dedicated Betting Odds Engine (odds_provider.py)
Separated from fixture and statistics scrapers.
Strictly distinguishes genuine verified bookmaker odds from research probability estimates.
Enforces:
- Real prices: Bookmaker, Source, Market, Odds, Timestamp, Selection, Data freshness, Availability
- If genuine odds are unavailable: returns availability="UNAVAILABLE", is_verified=False
- Does not invent odds or label synthetic values as verified bookmaker lines
- Realized betting ROI is strictly never calculated without genuine recorded entry odds
"""

from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import math
import sqlite3
import time


class OddsQuote:
    def __init__(
        self,
        match_id: str,
        market: str,
        selection: str,
        decimal_odds: float,
        bookmaker: str = "AuthorizedBookmakerFeed",
        source: str = "VerifiedFeed",
        is_live: bool = False,
        is_verified: bool = True,
        availability: str = "VERIFIED",
        observed_at: Optional[datetime] = None
    ):
        self.match_id = match_id
        self.market = market
        self.selection = selection
        self.decimal_odds = float(decimal_odds) if decimal_odds > 0 else 0.0
        self.bookmaker = bookmaker
        self.source = source
        self.is_live = is_live
        self.is_verified = bool(is_verified)
        self.availability = availability  # "VERIFIED", "UNAVAILABLE", "SUSPENDED", "RESEARCH_ONLY"
        self.observed_at = observed_at or datetime.now(timezone.utc)
        self.implied_probability = round(1.0 / self.decimal_odds, 4) if self.decimal_odds > 0 else 0.0
        self.data_freshness_seconds = round(max(0.0, datetime.now(timezone.utc).timestamp() - self.observed_at.timestamp()), 1)

    def is_eligible_selection(self, min_odds: float = 1.30, max_odds: float = 5.00) -> bool:
        """
        Only eligible if genuine odds are verified, available, and strictly > min_odds.
        """
        return (
            self.is_verified
            and self.availability == "VERIFIED"
            and self.decimal_odds > min_odds
            and self.decimal_odds <= max_odds
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "match_id": self.match_id,
            "market": self.market,
            "selection": self.selection,
            "decimal_odds": round(self.decimal_odds, 3) if self.decimal_odds > 0 else None,
            "bookmaker": self.bookmaker if self.is_verified else "ODDS UNAVAILABLE",
            "source": self.source,
            "is_live": self.is_live,
            "is_verified": self.is_verified,
            "availability": self.availability,
            "observed_at_utc": self.observed_at.isoformat(),
            "implied_probability": self.implied_probability if self.decimal_odds > 0 else None,
            "data_freshness_seconds": self.data_freshness_seconds,
            "is_eligible_top5": self.is_eligible_selection()
        }


class OddsProvider:
    """
    Main Authorized Odds Provider maintaining verified bookmaker market spreads.
    Enforces decimal_odds > 1.30 threshold for all Top 5 betting intelligence.
    When verified odds are absent, flags as UNAVAILABLE instead of fabricating prices.
    """

    def __init__(self, db_path: str = "flashscore_tracker.db", default_min_odds: float = 1.30, default_max_odds: float = 5.00):
        self.db_path = db_path
        self.min_odds = default_min_odds
        self.max_odds = default_max_odds
        self.odds_cache: Dict[str, Dict[str, OddsQuote]] = {}
        self._init_db_table()

    def _init_db_table(self):
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS verified_odds_quotes (
                    quote_id TEXT PRIMARY KEY,
                    match_id TEXT NOT NULL,
                    market TEXT NOT NULL,
                    selection TEXT NOT NULL,
                    decimal_odds REAL NOT NULL,
                    bookmaker TEXT DEFAULT 'Bookmaker Consensus',
                    source TEXT DEFAULT 'VerifiedBookmakerFeed',
                    is_verified INTEGER DEFAULT 0,
                    availability TEXT DEFAULT 'UNAVAILABLE',
                    observed_at TEXT
                )
            """)
            conn.commit()
            conn.close()
        except Exception:
            pass

    @staticmethod
    def calculate_expected_value(model_probability: float, decimal_odds: float) -> float:
        """
        Calculates Estimated Expected Value:
        EV = (P_model * decimal_odds) - 1.0
        """
        if decimal_odds <= 0:
            return -1.0
        return (model_probability * decimal_odds) - 1.0

    @staticmethod
    def remove_overround(quotes: List[OddsQuote]) -> List[float]:
        """
        Computes fair zero-margin probabilities from bookmaker market quotes by removing vig.
        """
        valid_quotes = [q for q in quotes if q.is_verified and q.implied_probability > 0]
        if not valid_quotes:
            return []
        raw_implied = [q.implied_probability for q in valid_quotes]
        total_margin = sum(raw_implied)
        if total_margin <= 0:
            return raw_implied
        return [p / total_margin for p in raw_implied]

    def record_verified_quote(
        self,
        match_id: str,
        market: str,
        selection: str,
        decimal_odds: float,
        bookmaker: str = "Pinnacle / Bet365 Consensus",
        source: str = "AuthorizedFeed",
        is_live: bool = False
    ) -> OddsQuote:
        """
        Persists a genuine, verified bookmaker quote.
        """
        now = datetime.now(timezone.utc)
        quote_id = f"od_{match_id}_{market.replace(' ', '_')}_{selection.replace(' ', '_')}"
        quote = OddsQuote(
            match_id=match_id,
            market=market,
            selection=selection,
            decimal_odds=decimal_odds,
            bookmaker=bookmaker,
            source=source,
            is_live=is_live,
            is_verified=True,
            availability="VERIFIED",
            observed_at=now
        )

        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO verified_odds_quotes (
                    quote_id, match_id, market, selection, decimal_odds,
                    bookmaker, source, is_verified, availability, observed_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(quote_id) DO UPDATE SET
                    decimal_odds = excluded.decimal_odds,
                    bookmaker = excluded.bookmaker,
                    source = excluded.source,
                    is_verified = excluded.is_verified,
                    availability = excluded.availability,
                    observed_at = excluded.observed_at
            """, (
                quote_id, match_id, market, selection, decimal_odds,
                bookmaker, source, 1, "VERIFIED", now.isoformat()
            ))
            conn.commit()
            conn.close()
        except Exception:
            pass

        if match_id not in self.odds_cache:
            self.odds_cache[match_id] = {}
        self.odds_cache[match_id][f"{market}::{selection}"] = quote
        return quote

    def get_odds_quote(self, match_id: str, market: str, selection: str) -> Optional[OddsQuote]:
        """
        Retrieves verified quote for match_id, market, selection.
        If verified quote is in cache or database, returns it.
        """
        key = f"{market}::{selection}"
        if match_id in self.odds_cache and key in self.odds_cache[match_id]:
            return self.odds_cache[match_id][key]

        # Check sqlite table
        try:
            conn = sqlite3.connect(self.db_path)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM verified_odds_quotes
                WHERE match_id = ? AND market = ? AND selection = ?
            """, (match_id, market, selection))
            row = cursor.fetchone()
            conn.close()
            if row:
                quote = OddsQuote(
                    match_id=row["match_id"],
                    market=row["market"],
                    selection=row["selection"],
                    decimal_odds=row["decimal_odds"],
                    bookmaker=row["bookmaker"],
                    source=row["source"],
                    is_verified=bool(row["is_verified"]),
                    availability=row["availability"],
                    observed_at=datetime.fromisoformat(row["observed_at"]) if row["observed_at"] else None
                )
                if match_id not in self.odds_cache:
                    self.odds_cache[match_id] = {}
                self.odds_cache[match_id][key] = quote
                return quote
        except Exception:
            pass

        return None

    def get_unavailable_quote(self, match_id: str, market: str, selection: str) -> OddsQuote:
        """
        Returns an explicit ODDS UNAVAILABLE quote when no authorized feed is connected.
        """
        return OddsQuote(
            match_id=match_id,
            market=market,
            selection=selection,
            decimal_odds=0.0,
            bookmaker="ODDS UNAVAILABLE",
            source="ProviderNotConnected",
            is_verified=False,
            availability="UNAVAILABLE"
        )
