"""
Machine Learning Feature Engineering & Dataset Exporter
Extracts predictive features from Flashscore match statistics for training
classification and regression models (scikit-learn, XGBoost, LightGBM, PyTorch).
"""

import csv
import io
import json
from typing import List, Dict, Any, Optional


class MLFeaturePipeline:
    FEATURE_COLUMNS = [
        "match_id",
        "league",
        "home_team",
        "away_team",
        "home_score",
        "away_score",
        "target_outcome",      # HOME_WIN, DRAW, AWAY_WIN
        "target_over_2_5",     # 1 or 0
        "target_btts",         # Both Teams to Score: 1 or 0
        "home_xg",
        "away_xg",
        "xg_difference",
        "home_possession",
        "away_possession",
        "possession_differential",
        "home_total_shots",
        "away_total_shots",
        "home_shots_on_target",
        "away_shots_on_target",
        "shots_on_target_diff",
        "home_shots_inside_box",
        "away_shots_inside_box",
        "home_big_chances",
        "away_big_chances",
        "home_corners",
        "away_corners",
        "home_fouls",
        "away_fouls",
        "home_yellow_cards",
        "away_yellow_cards",
        "home_dangerous_attacks",
        "away_dangerous_attacks"
    ]

    @classmethod
    def transform_match(cls, match: Dict[str, Any], stats: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Engineers normalized feature row from match and statistics objects."""
        try:
            h_score = int(match.get("home_score", 0)) if str(match.get("home_score")).isdigit() else 0
            a_score = int(match.get("away_score", 0)) if str(match.get("away_score")).isdigit() else 0
        except Exception:
            h_score, a_score = 0, 0

        # Outcome targets
        if h_score > a_score:
            outcome = "HOME_WIN"
        elif a_score > h_score:
            outcome = "AWAY_WIN"
        else:
            outcome = "DRAW"

        over_2_5 = 1 if (h_score + a_score) > 2.5 else 0
        btts = 1 if (h_score > 0 and a_score > 0) else 0

        # Extract stats features
        st = stats.get("stats", {}) if stats else {}
        
        def get_val(key: str, side: str, default: float = 0.0) -> float:
            sub = st.get(key, {})
            if isinstance(sub, dict):
                return float(sub.get(f"{side}_raw", sub.get(side, default)) or default)
            return default

        h_xg = get_val("expected_goals", "home", 1.25)
        a_xg = get_val("expected_goals", "away", 0.95)
        h_pos = get_val("ball_possession", "home", 52.0)
        a_pos = get_val("ball_possession", "away", 48.0)
        h_sot = get_val("shots_on_target", "home", 4.0)
        a_sot = get_val("shots_on_target", "away", 3.0)
        h_shots = get_val("total_shots", "home", 11.0)
        a_shots = get_val("total_shots", "away", 8.0)
        h_box = get_val("shots_inside_box", "home", 7.0)
        a_box = get_val("shots_inside_box", "away", 4.0)
        h_big = get_val("big_chances", "home", 2.0)
        a_big = get_val("big_chances", "away", 1.0)
        h_corn = get_val("corner_kicks", "home", 5.0)
        a_corn = get_val("corner_kicks", "away", 3.0)
        h_foul = get_val("fouls", "home", 11.0)
        a_foul = get_val("fouls", "away", 12.0)
        h_yc = get_val("yellow_cards", "home", 1.0)
        a_yc = get_val("yellow_cards", "away", 2.0)
        h_da = get_val("dangerous_attacks", "home", 44.0)
        a_da = get_val("dangerous_attacks", "away", 35.0)

        return {
            "match_id": match.get("id", ""),
            "league": match.get("league", "General"),
            "home_team": match.get("home_team", "Home"),
            "away_team": match.get("away_team", "Away"),
            "home_score": h_score,
            "away_score": a_score,
            "target_outcome": outcome,
            "target_over_2_5": over_2_5,
            "target_btts": btts,
            "home_xg": round(h_xg, 2),
            "away_xg": round(a_xg, 2),
            "xg_difference": round(h_xg - a_xg, 2),
            "home_possession": round(h_pos, 1),
            "away_possession": round(a_pos, 1),
            "possession_differential": round(h_pos - a_pos, 1),
            "home_total_shots": int(h_shots),
            "away_total_shots": int(a_shots),
            "home_shots_on_target": int(h_sot),
            "away_shots_on_target": int(a_sot),
            "shots_on_target_diff": int(h_sot - a_sot),
            "home_shots_inside_box": int(h_box),
            "away_shots_inside_box": int(a_box),
            "home_big_chances": int(h_big),
            "away_big_chances": int(a_big),
            "home_corners": int(h_corn),
            "away_corners": int(a_corn),
            "home_fouls": int(h_foul),
            "away_fouls": int(a_foul),
            "home_yellow_cards": int(h_yc),
            "away_yellow_cards": int(a_yc),
            "home_dangerous_attacks": int(h_da),
            "away_dangerous_attacks": int(a_da)
        }

    @classmethod
    def export_csv(cls, rows: List[Dict[str, Any]]) -> str:
        """Exports dataset to CSV format."""
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=cls.FEATURE_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") for k in cls.FEATURE_COLUMNS})
        return output.getvalue()
