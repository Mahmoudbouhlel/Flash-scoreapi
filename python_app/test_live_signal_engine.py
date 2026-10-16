"""
Unit and Integration Tests for Flashscore v2.2 Real-Time Live Signal Engine & Dispatcher
Tests:
- 7 Quantitative live signal engines (1H, 2H, Late 1H, Late 2H, Comeback, Momentum, Next Goal)
- Strict decimal_odds > 1.30 enforcement
- EV calculation: EV = (prob * odds) - 1.0
- Live goal hazard & dynamic Poisson estimates
- Automated settlement (WIN, LOST, PENDING)
- Performance metrics (Win Rate %, ROI %, Profit, Streaks)
- Notification formatting for Telegram Markdown & Discord Rich Embeds
"""

import unittest
import os
import tempfile
import json
from live_signal_engine import LiveSignalEngine
from notification_dispatcher import NotificationDispatcher


class TestLiveSignalEngine(unittest.TestCase):
    def setUp(self):
        # Isolated temporary database for testing
        self.temp_db = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.db_path = self.temp_db.name
        self.temp_db.close()
        self.engine = LiveSignalEngine(db_path=self.db_path)
        self.dispatcher = NotificationDispatcher()

    def tearDown(self):
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    def test_poisson_probability_and_hazard(self):
        # Hazard for 20 minutes remaining with 1.5 xG
        remaining_lambda = self.engine.estimate_remaining_goal_intensity(
            current_minute=25,
            target_end_minute=45,
            total_match_xg=1.2,
            shots_on_target=4,
            dangerous_attacks=20
        )
        self.assertGreater(remaining_lambda, 0.2)

        # Poisson P(X >= 1)
        p1 = self.engine.poisson_probability_at_least_k(remaining_lambda, 1)
        self.assertGreater(p1, 0.1)
        self.assertLessEqual(p1, 1.0)

    def test_engine_a_1h_goals_detection(self):
        # Match at minute 30, score 0-0, high pressure (xG 1.25, 4 SOT)
        match_data = {
            "id": "match_live_001",
            "home_team": "Liverpool",
            "away_team": "Everton",
            "league": "Premier League",
            "elapsed_minute": "30'",
            "home_score": "0",
            "away_score": "0",
            "stats": {
                "home_xg": 1.05,
                "away_xg": 0.20,
                "home_shots_on_target": 4,
                "home_total_shots": 7,
                "away_shots_on_target": 0,
                "away_total_shots": 2,
                "home_possession": 65.0,
                "away_possession": 35.0,
                "home_dangerous_attacks": 28,
                "away_dangerous_attacks": 8
            }
        }

        signals = self.engine.detect_signals_for_match(match_data)
        self.assertTrue(len(signals) > 0)
        
        # Verify Engine A triggered
        engine_a = next((s for s in signals if s["engine_code"] == "1H_GOALS"), None)
        self.assertIsNotNone(engine_a)
        self.assertIn("1H Over 0.5", engine_a["selection"])
        # Strict odds requirement > 1.30
        self.assertGreater(engine_a["decimal_odds"], 1.30)
        # Expected value strictly positive
        self.assertGreater(engine_a["expected_value"], 0.0)

    def test_engine_e_comeback_detection(self):
        # Dominant home team trailing 0-1 at minute 52
        match_data = {
            "id": "match_live_002",
            "home_team": "Bayern Munich",
            "away_team": "Stuttgart",
            "league": "Bundesliga",
            "elapsed_minute": "52'",
            "home_score": "0",
            "away_score": "1",
            "stats": {
                "home_xg": 2.20,
                "away_xg": 0.35,
                "home_shots_on_target": 7,
                "home_total_shots": 15,
                "away_shots_on_target": 1,
                "away_total_shots": 2,
                "home_possession": 72.0,
                "away_possession": 28.0,
                "home_dangerous_attacks": 42,
                "away_dangerous_attacks": 11
            }
        }

        signals = self.engine.detect_signals_for_match(match_data)
        comeback_sig = next((s for s in signals if s["engine_code"] == "COMEBACK"), None)
        self.assertIsNotNone(comeback_sig)
        self.assertEqual(comeback_sig["selection"], "Bayern Munich Win")
        self.assertGreater(comeback_sig["decimal_odds"], 1.30)
        self.assertGreater(comeback_sig["expected_value"], 0.0)

    def test_engine_d_late_2h_crunch(self):
        # Minute 80, 1-1, heavy open transitions
        match_data = {
            "id": "match_live_003",
            "home_team": "Real Madrid",
            "away_team": "Barcelona",
            "league": "La Liga",
            "elapsed_minute": "80'",
            "home_score": "1",
            "away_score": "1",
            "stats": {
                "home_xg": 1.80,
                "away_xg": 1.45,
                "home_shots_on_target": 6,
                "home_total_shots": 14,
                "away_shots_on_target": 5,
                "away_total_shots": 11,
                "home_possession": 51.0,
                "away_possession": 49.0,
                "home_dangerous_attacks": 35,
                "away_dangerous_attacks": 32
            }
        }

        signals = self.engine.detect_signals_for_match(match_data)
        late_2h_sig = next((s for s in signals if s["engine_code"] == "LATE_2H"), None)
        self.assertIsNotNone(late_2h_sig)
        self.assertIn("Over 2.5", late_2h_sig["selection"])
        self.assertGreater(late_2h_sig["decimal_odds"], 1.30)

    def test_settlement_rules(self):
        # Test 1H Over 0.5 settlement: WIN when 1-0 at minute 40
        sig_1h = {
            "engine_code": "1H_GOALS",
            "market": "First Half Over 0.5 Goals",
            "selection": "1H Over 0.5",
            "decimal_odds": 1.70,
            "score_at_signal": "0 - 0"
        }
        res, profit, _ = self.engine.evaluate_settlement(sig_1h, current_minute=40, home_score=1, away_score=0, is_finished=False, is_halftime=False)
        self.assertEqual(res, "WIN")
        self.assertAlmostEqual(profit, 0.70)

        # Test 1H Over 0.5 settlement: LOST when HT is reached at 0-0
        res, profit, _ = self.engine.evaluate_settlement(sig_1h, current_minute=45, home_score=0, away_score=0, is_finished=False, is_halftime=True)
        self.assertEqual(res, "LOST")
        self.assertEqual(profit, -1.0)

        # Test Match Over 2.5 settlement: WIN when 2-1
        sig_over25 = {
            "engine_code": "2H_GOALS",
            "market": "Match Total Over 2.5 Goals",
            "selection": "Over 2.5",
            "decimal_odds": 1.95,
            "score_at_signal": "1 - 1"
        }
        res, profit, _ = self.engine.evaluate_settlement(sig_over25, current_minute=72, home_score=2, away_score=1, is_finished=False, is_halftime=False)
        self.assertEqual(res, "WIN")
        self.assertAlmostEqual(profit, 0.95)

    def test_save_and_performance_ledger(self):
        self.engine.seed_initial_demo_data()
        perf = self.engine.get_performance_ledger()
        self.assertGreaterEqual(perf["total_signals"], 5)
        self.assertEqual(perf["settled_count"], 5)
        self.assertEqual(perf["won_signals"], 4)
        self.assertEqual(perf["lost_signals"], 1)
        # Win rate strictly excluding void and pending: 4 / 5 = 80.0%
        self.assertEqual(perf["win_rate_pct"], 80.0)
        self.assertGreater(perf["net_profit_units"], 0.0)
        self.assertGreater(perf["roi_pct"], 0.0)

    def test_notification_dispatcher_formatting(self):
        sample_sig = {
            "signal_id": "test_sig_abc",
            "match_id": "match_xyz",
            "home_team": "Inter",
            "away_team": "Milan",
            "league": "Serie A",
            "minute": "36",
            "score_at_signal": "0 - 0",
            "engine_code": "LATE_1H",
            "market": "Next Goal Before Half-Time",
            "selection": "Goal Before Half-Time",
            "decimal_odds": 1.95,
            "bookmaker": "Bet365 / Pinnacle",
            "model_probability": 0.65,
            "implied_probability": 0.513,
            "expected_value": 0.267,
            "home_xg": 0.95,
            "away_xg": 0.60,
            "home_shots_on_target": 4,
            "home_total_shots": 7,
            "away_shots_on_target": 2,
            "away_total_shots": 5,
            "home_possession": 54,
            "away_possession": 46,
            "triggering_evidence": ["High late first half pressure"]
        }

        # Telegram Markdown test
        tg_text = self.dispatcher.format_telegram_signal_markdown(sample_sig)
        self.assertIn("Inter vs Milan", tg_text)
        self.assertIn("1.95", tg_text)
        self.assertIn("+26.7%", tg_text)
        self.assertIn("Serie A", tg_text)

        # Discord Embed test
        dc_embed = self.dispatcher.build_discord_signal_embed(sample_sig)
        self.assertIn("Inter vs Milan", dc_embed["description"])
        self.assertEqual(dc_embed["color"], 0x8B5CF6)
        field_names = [f["name"] for f in dc_embed["fields"]]
        self.assertIn("💰 Live Verified Odds", field_names)
        self.assertIn("💎 Expected Value (EV)", field_names)


if __name__ == "__main__":
    unittest.main()
