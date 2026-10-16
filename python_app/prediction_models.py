"""
Database Schema & Persistence for AI Daily Predictions (prediction_models.py)
Stores immutable published predictions, settlement tracking, odds snapshots,
and backtest audit trails using zero-dependency sqlite3.
"""

import sqlite3
import json
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional


class PredictionDatabase:
    def __init__(self, db_path: str = "flashscore_tracker.db"):
        self.db_path = db_path
        self._init_tables()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_tables(self):
        conn = self.get_connection()
        cursor = conn.cursor()

        # Permanent Immutable Predictions Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS daily_predictions (
                prediction_id TEXT PRIMARY KEY,
                match_id TEXT NOT NULL,
                prediction_date TEXT NOT NULL,
                published_at_utc TEXT NOT NULL,
                kickoff_utc TEXT,
                league_id TEXT,
                home_team TEXT NOT NULL,
                away_team TEXT NOT NULL,
                market TEXT NOT NULL,
                selection TEXT NOT NULL,
                decimal_odds REAL NOT NULL,
                odds_provider TEXT NOT NULL,
                odds_observed_at_utc TEXT NOT NULL,
                model_probability REAL NOT NULL,
                implied_probability REAL NOT NULL,
                estimated_ev REAL NOT NULL,
                model_name TEXT NOT NULL,
                model_version TEXT NOT NULL,
                data_quality_score REAL NOT NULL,
                model_uncertainty REAL NOT NULL,
                status TEXT NOT NULL DEFAULT 'PENDING',
                home_final_score INTEGER,
                away_final_score INTEGER,
                settled_at_utc TEXT,
                stake_units REAL DEFAULT 1.0,
                profit_units REAL DEFAULT 0.0,
                explanation_json TEXT,
                feature_snapshot_hash TEXT,
                rank_position INTEGER,
                created_at_utc TEXT NOT NULL
            )
        """)

        # Performance summary cache table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS performance_snapshots (
                snapshot_id TEXT PRIMARY KEY,
                total_published INTEGER,
                wins INTEGER,
                losses INTEGER,
                voids INTEGER,
                pending INTEGER,
                win_rate REAL,
                roi REAL,
                net_profit REAL,
                brier_score REAL,
                max_drawdown REAL,
                longest_win_streak INTEGER,
                longest_loss_streak INTEGER,
                recorded_at TEXT NOT NULL
            )
        """)

        # Model validation runs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS model_validation_runs (
                run_id TEXT PRIMARY KEY,
                model_name TEXT,
                model_version TEXT,
                test_sample_size INTEGER,
                brier_score REAL,
                log_loss REAL,
                accuracy REAL,
                passed_gate INTEGER,
                validated_at TEXT NOT NULL
            )
        """)

        conn.commit()
        conn.close()

    def insert_prediction(self, pred: Dict[str, Any]) -> str:
        conn = self.get_connection()
        cursor = conn.cursor()
        now_str = datetime.now(timezone.utc).isoformat()

        cursor.execute("""
            INSERT OR IGNORE INTO daily_predictions (
                prediction_id, match_id, prediction_date, published_at_utc, kickoff_utc,
                league_id, home_team, away_team, market, selection,
                decimal_odds, odds_provider, odds_observed_at_utc,
                model_probability, implied_probability, estimated_ev,
                model_name, model_version, data_quality_score, model_uncertainty,
                status, stake_units, profit_units, explanation_json, feature_snapshot_hash,
                rank_position, created_at_utc
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            pred.get("prediction_id"),
            pred.get("match_id"),
            pred.get("prediction_date"),
            pred.get("published_at_utc", now_str),
            pred.get("kickoff_utc"),
            pred.get("league_id"),
            pred.get("home_team"),
            pred.get("away_team"),
            pred.get("market"),
            pred.get("selection"),
            float(pred.get("decimal_odds", 1.0)),
            pred.get("odds_provider", "Verified Consensus"),
            pred.get("odds_observed_at_utc", now_str),
            float(pred.get("model_probability", 0.0)),
            float(pred.get("implied_probability", 0.0)),
            float(pred.get("estimated_ev", 0.0)),
            pred.get("model_name", "CalibratedEnsemble-v2.1"),
            pred.get("model_version", "2.1.0"),
            float(pred.get("data_quality_score", 0.95)),
            float(pred.get("model_uncertainty", 0.08)),
            pred.get("status", "PENDING"),
            float(pred.get("stake_units", 1.0)),
            float(pred.get("profit_units", 0.0)),
            json.dumps(pred.get("explanation_json", {})),
            pred.get("feature_snapshot_hash", ""),
            int(pred.get("rank_position", 1)),
            now_str
        ))
        conn.commit()
        conn.close()
        return pred["prediction_id"]

    def update_settlement(
        self,
        prediction_id: str,
        status: str,
        home_score: int,
        away_score: int,
        profit_units: float
    ):
        conn = self.get_connection()
        cursor = conn.cursor()
        now_str = datetime.now(timezone.utc).isoformat()

        cursor.execute("""
            UPDATE daily_predictions SET
                status = ?,
                home_final_score = ?,
                away_final_score = ?,
                profit_units = ?,
                settled_at_utc = ?
            WHERE prediction_id = ?
        """, (status, home_score, away_score, profit_units, now_str, prediction_id))
        conn.commit()
        conn.close()

    def get_predictions_by_date(self, date_str: str) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM daily_predictions
            WHERE prediction_date = ?
            ORDER BY rank_position ASC
        """, (date_str,))
        rows = cursor.fetchall()
        conn.close()

        res = []
        for r in rows:
            d = dict(r)
            if d.get("explanation_json"):
                try:
                    d["explanation_json"] = json.loads(d["explanation_json"])
                except Exception:
                    pass
            res.append(d)
        return res

    def get_all_history(self, limit: int = 200) -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM daily_predictions
            ORDER BY created_at_utc DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        conn.close()

        res = []
        for r in rows:
            d = dict(r)
            if d.get("explanation_json"):
                try:
                    d["explanation_json"] = json.loads(d["explanation_json"])
                except Exception:
                    pass
            res.append(d)
        return res
