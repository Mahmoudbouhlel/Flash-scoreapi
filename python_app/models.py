"""
Database Persistence Layer for Flashscore Match Tracker
Uses Python standard library sqlite3 for zero-dependency portability across any environment,
with optional SQLAlchemy compatibility.
"""

import sqlite3
import json
from datetime import datetime
from typing import Dict, Any, List, Optional


class DatabaseManager:
    def __init__(self, db_path: str = "flashscore_tracker.db"):
        self.db_path = db_path
        self._init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        # Matches table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS matches (
                id TEXT PRIMARY KEY,
                sport TEXT DEFAULT 'football',
                league TEXT,
                country TEXT,
                tournament_id TEXT,
                home_team TEXT,
                away_team TEXT,
                home_score TEXT DEFAULT '-',
                away_score TEXT DEFAULT '-',
                status_code TEXT DEFAULT '1',
                status TEXT DEFAULT 'Scheduled',
                elapsed_minute TEXT,
                kickoff_timestamp INTEGER,
                url TEXT,
                last_synced_at TEXT
            )
        """)

        # Match statistics table (20+ metrics)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS match_statistics (
                match_id TEXT PRIMARY KEY,
                home_xg REAL,
                away_xg REAL,
                home_xgot REAL,
                away_xgot REAL,
                home_possession REAL,
                away_possession REAL,
                home_total_shots INTEGER,
                away_total_shots INTEGER,
                home_shots_on_target INTEGER,
                away_shots_on_target INTEGER,
                home_shots_off_target INTEGER,
                away_shots_off_target INTEGER,
                home_blocked_shots INTEGER,
                away_blocked_shots INTEGER,
                home_shots_inside_box INTEGER,
                away_shots_inside_box INTEGER,
                home_shots_outside_box INTEGER,
                away_shots_outside_box INTEGER,
                home_big_chances INTEGER,
                away_big_chances INTEGER,
                home_corner_kicks INTEGER,
                away_corner_kicks INTEGER,
                home_fouls INTEGER,
                away_fouls INTEGER,
                home_yellow_cards INTEGER,
                away_yellow_cards INTEGER,
                home_red_cards INTEGER,
                away_red_cards INTEGER,
                home_offsides INTEGER,
                away_offsides INTEGER,
                home_saves INTEGER,
                away_saves INTEGER,
                home_dangerous_attacks INTEGER,
                away_dangerous_attacks INTEGER,
                raw_payload TEXT,
                updated_at TEXT,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)

        # Match Incidents table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS match_incidents (
                id TEXT PRIMARY KEY,
                match_id TEXT,
                minute TEXT,
                type TEXT,
                team TEXT,
                player TEXT,
                sub_player TEXT,
                score_after TEXT,
                created_at TEXT,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)

        # Sync Jobs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sync_jobs (
                id TEXT PRIMARY KEY,
                job_type TEXT,
                status TEXT,
                matches_synced INTEGER DEFAULT 0,
                errors_count INTEGER DEFAULT 0,
                started_at TEXT,
                completed_at TEXT,
                log_summary TEXT
            )
        """)

        # v2.3 Tracked Matches table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tracked_matches (
                match_id TEXT PRIMARY KEY,
                tracking_mode TEXT DEFAULT 'MANUAL',
                tracking_status TEXT DEFAULT 'ACTIVE',
                analysis_state TEXT DEFAULT 'WAITING_FOR_DATA',
                unmet_conditions TEXT DEFAULT '[]',
                closest_market TEXT DEFAULT '{}',
                last_analyzed_at TEXT,
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)

        # v2.3 Match Clocks table for real-time reconciliation
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS match_clocks (
                match_id TEXT PRIMARY KEY,
                period TEXT DEFAULT 'Scheduled',
                minute INTEGER DEFAULT 0,
                added_time INTEGER DEFAULT 0,
                display_clock TEXT DEFAULT '0''',
                is_running INTEGER DEFAULT 1,
                provider_timestamp INTEGER DEFAULT 0,
                last_sync_timestamp REAL DEFAULT 0,
                data_delay_seconds REAL DEFAULT 0,
                status_state TEXT DEFAULT 'LIVE',
                updated_at TEXT,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)

        # v2.3 Verified Odds Quotes table
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
                observed_at TEXT,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)

        # v3.2 Global Match Analysis table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS global_match_analyses (
                match_id TEXT PRIMARY KEY,
                league TEXT,
                country TEXT,
                home_team TEXT,
                away_team TEXT,
                kickoff_utc TEXT,
                status TEXT,
                home_win_probability REAL,
                away_win_probability REAL,
                draw_probability REAL,
                over_2_5_probability REAL,
                btts_yes_probability REAL,
                home_win_odds REAL,
                away_win_odds REAL,
                over_2_5_odds REAL,
                btts_yes_odds REAL,
                model_name TEXT DEFAULT 'CalibratedEnsemble-v3.2',
                analyzed_at TEXT,
                FOREIGN KEY (match_id) REFERENCES matches(id)
            )
        """)

        # v2.3 Multi-Worker Lock table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS background_workers_lock (
                lock_name TEXT PRIMARY KEY,
                process_pid INTEGER,
                locked_at TEXT,
                last_heartbeat TEXT
            )
        """)

        conn.commit()
        conn.close()

    def upsert_match(self, match: Dict[str, Any]):
        conn = self.get_connection()
        cursor = conn.cursor()
        now_str = datetime.utcnow().isoformat()

        cursor.execute("""
            INSERT INTO matches (
                id, sport, league, country, tournament_id,
                home_team, away_team, home_score, away_score,
                status_code, status, elapsed_minute, kickoff_timestamp,
                url, last_synced_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                home_score = excluded.home_score,
                away_score = excluded.away_score,
                status_code = excluded.status_code,
                status = excluded.status,
                elapsed_minute = excluded.elapsed_minute,
                last_synced_at = excluded.last_synced_at
        """, (
            match.get("id"),
            match.get("sport", "football"),
            match.get("league", ""),
            match.get("country", ""),
            match.get("tournament_id", ""),
            match.get("home_team", ""),
            match.get("away_team", ""),
            match.get("home_score", "-"),
            match.get("away_score", "-"),
            match.get("status_code", "1"),
            match.get("status", "Scheduled"),
            match.get("elapsed_minute"),
            match.get("timestamp"),
            match.get("url", ""),
            now_str
        ))
        conn.commit()
        conn.close()

    def upsert_statistics(self, match_id: str, stats_data: Dict[str, Any]):
        conn = self.get_connection()
        cursor = conn.cursor()
        now_str = datetime.utcnow().isoformat()
        core = stats_data.get("stats", {})

        def g(key: str, side: str, default=None):
            sub = core.get(key, {})
            if isinstance(sub, dict):
                return sub.get(f"{side}_raw", sub.get(side, default))
            return default

        cursor.execute("""
            INSERT INTO match_statistics (
                match_id, home_xg, away_xg, home_xgot, away_xgot,
                home_possession, away_possession, home_total_shots, away_total_shots,
                home_shots_on_target, away_shots_on_target, home_shots_off_target, away_shots_off_target,
                home_blocked_shots, away_blocked_shots, home_shots_inside_box, away_shots_inside_box,
                home_shots_outside_box, away_shots_outside_box, home_big_chances, away_big_chances,
                home_corner_kicks, away_corner_kicks, home_fouls, away_fouls,
                home_yellow_cards, away_yellow_cards, home_red_cards, away_red_cards,
                home_offsides, away_offsides, home_saves, away_saves,
                home_dangerous_attacks, away_dangerous_attacks, raw_payload, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(match_id) DO UPDATE SET
                home_xg = excluded.home_xg,
                away_xg = excluded.away_xg,
                home_possession = excluded.home_possession,
                away_possession = excluded.away_possession,
                home_total_shots = excluded.home_total_shots,
                away_total_shots = excluded.away_total_shots,
                home_shots_on_target = excluded.home_shots_on_target,
                away_shots_on_target = excluded.away_shots_on_target,
                raw_payload = excluded.raw_payload,
                updated_at = excluded.updated_at
        """, (
            match_id,
            g("expected_goals", "home"), g("expected_goals", "away"),
            g("xg_on_target", "home"), g("xg_on_target", "away"),
            g("ball_possession", "home"), g("ball_possession", "away"),
            g("total_shots", "home"), g("total_shots", "away"),
            g("shots_on_target", "home"), g("shots_on_target", "away"),
            g("shots_off_target", "home"), g("shots_off_target", "away"),
            g("blocked_shots", "home"), g("blocked_shots", "away"),
            g("shots_inside_box", "home"), g("shots_inside_box", "away"),
            g("shots_outside_box", "home"), g("shots_outside_box", "away"),
            g("big_chances", "home"), g("big_chances", "away"),
            g("corner_kicks", "home"), g("corner_kicks", "away"),
            g("fouls", "home"), g("fouls", "away"),
            g("yellow_cards", "home"), g("yellow_cards", "away"),
            g("red_cards", "home"), g("red_cards", "away"),
            g("offsides", "home"), g("offsides", "away"),
            g("goalkeeper_saves", "home"), g("goalkeeper_saves", "away"),
            g("dangerous_attacks", "home"), g("dangerous_attacks", "away"),
            json.dumps(stats_data),
            now_str
        ))
        conn.commit()
        conn.close()

    def get_match_with_stats(self, match_id: str) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
        match_row = cursor.fetchone()
        if not match_row:
            conn.close()
            return None

        cursor.execute("SELECT * FROM match_statistics WHERE match_id = ?", (match_id,))
        stats_row = cursor.fetchone()
        conn.close()

        res = dict(match_row)
        if stats_row:
            res["stats"] = dict(stats_row)
            if stats_row["raw_payload"]:
                res["stats_raw"] = json.loads(stats_row["raw_payload"])
        return res

    def upsert_global_analysis(self, analysis: Dict[str, Any]):
        conn = self.get_connection()
        cursor = conn.cursor()
        now_str = datetime.utcnow().isoformat()

        cursor.execute("""
            INSERT INTO global_match_analyses (
                match_id, league, country, home_team, away_team, kickoff_utc, status,
                home_win_probability, away_win_probability, draw_probability,
                over_2_5_probability, btts_yes_probability,
                home_win_odds, away_win_odds, over_2_5_odds, btts_yes_odds,
                model_name, analyzed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(match_id) DO UPDATE SET
                status = excluded.status,
                home_win_probability = excluded.home_win_probability,
                away_win_probability = excluded.away_win_probability,
                draw_probability = excluded.draw_probability,
                over_2_5_probability = excluded.over_2_5_probability,
                btts_yes_probability = excluded.btts_yes_probability,
                home_win_odds = excluded.home_win_odds,
                away_win_odds = excluded.away_win_odds,
                over_2_5_odds = excluded.over_2_5_odds,
                btts_yes_odds = excluded.btts_yes_odds,
                analyzed_at = excluded.analyzed_at
        """, (
            analysis.get("match_id"),
            analysis.get("league", ""),
            analysis.get("country", ""),
            analysis.get("home_team", ""),
            analysis.get("away_team", ""),
            analysis.get("kickoff_utc", ""),
            analysis.get("status", "Scheduled"),
            analysis.get("home_win_probability", 0.0),
            analysis.get("away_win_probability", 0.0),
            analysis.get("draw_probability", 0.0),
            analysis.get("over_2_5_probability", 0.0),
            analysis.get("btts_yes_probability", 0.0),
            analysis.get("home_win_odds", 1.0),
            analysis.get("away_win_odds", 1.0),
            analysis.get("over_2_5_odds", 1.0),
            analysis.get("btts_yes_odds", 1.0),
            analysis.get("model_name", "CalibratedEnsemble-v3.2"),
            now_str
        ))
        conn.commit()
        conn.close()

    def get_all_global_analyses(self) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM global_match_analyses ORDER BY kickoff_utc ASC")
        rows = cursor.fetchall()
        conn.close()
        return [dict(r) for r in rows]

