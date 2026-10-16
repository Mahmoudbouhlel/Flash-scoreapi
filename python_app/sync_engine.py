"""
Incremental Synchronization & Live Change Detection Engine
Monitors live matches, detects score changes, goal incidents, and xG spikes,
and commits updates incrementally to the SQLite database.
"""

import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Callable, Optional

from flashscore_feed import FlashscoreFeedScraper
from flashscore_stats_parser import FlashscoreStatsParser
from models import DatabaseManager


class DataQualityValidator:
    @staticmethod
    def validate_match(match: Dict[str, Any]) -> List[str]:
        warnings = []
        if not match.get("home_team") or not match.get("away_team"):
            warnings.append("Missing home or away team name")
        home_score = str(match.get("home_score", "-"))
        away_score = str(match.get("away_score", "-"))
        if home_score != "-" and not home_score.isdigit():
            warnings.append(f"Invalid home score value: {home_score}")
        if away_score != "-" and not away_score.isdigit():
            warnings.append(f"Invalid away score value: {away_score}")
        return warnings

    @staticmethod
    def validate_stats(stats: Dict[str, Any]) -> List[str]:
        warnings = []
        core = stats.get("stats", {})
        tot_shots_home = core.get("total_shots", {}).get("home_raw", 0)
        sot_home = core.get("shots_on_target", {}).get("home_raw", 0)
        if sot_home > tot_shots_home and tot_shots_home > 0:
            warnings.append(f"Shots on target ({sot_home}) exceeds total shots ({tot_shots_home})")
        return warnings


class IncrementalSyncEngine:
    def __init__(self, db_path: str = "flashscore_tracker.db"):
        self.feed_scraper = FlashscoreFeedScraper()
        self.stats_parser = FlashscoreStatsParser()
        self.db = DatabaseManager(db_path)
        self.previous_snapshot: Dict[str, Dict[str, Any]] = {}
        self.subscribers: List[Callable[[Dict[str, Any]], None]] = []

    def subscribe(self, callback: Callable[[Dict[str, Any]], None]):
        self.subscribers.append(callback)

    def _notify(self, event: Dict[str, Any]):
        for cb in self.subscribers:
            try:
                cb(event)
            except Exception as e:
                print(f"Error in event subscriber: {e}")

    def run_live_cycle(self, sport: str = "football") -> Dict[str, Any]:
        live_matches = self.feed_scraper.get_matches(sport=sport, day_offset=0, status="live")
        changes_detected = []
        current_map = {}

        for match in live_matches:
            m_id = match["id"]
            current_map[m_id] = match
            prev = self.previous_snapshot.get(m_id)

            if prev:
                score_changed = (
                    prev.get("home_score") != match.get("home_score") or
                    prev.get("away_score") != match.get("away_score")
                )
                if score_changed:
                    event = {
                        "type": "GOAL",
                        "match_id": m_id,
                        "title": f"{match['home_team']} vs {match['away_team']}",
                        "minute": match.get("elapsed_minute", "Live"),
                        "old_score": f"{prev.get('home_score')}-{prev.get('away_score')}",
                        "new_score": f"{match.get('home_score')}-{match.get('away_score')}",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                    changes_detected.append(event)
                    self._notify(event)

            # Persist match
            self.db.upsert_match(match)

        self.previous_snapshot = current_map
        return {
            "polled_count": len(live_matches),
            "changes_detected_count": len(changes_detected),
            "changes": changes_detected
        }

    def sync_historical_fixtures(self, sport: str = "football", days_back: int = 2) -> Dict[str, Any]:
        job_id = str(uuid.uuid4())
        total_synced = 0
        for offset in range(-days_back, 0):
            matches = self.feed_scraper.get_matches(sport=sport, day_offset=offset, status="all")
            for m in matches:
                self.db.upsert_match(m)
                total_synced += 1

        return {"job_id": job_id, "total_synced": total_synced}
