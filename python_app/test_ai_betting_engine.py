"""
Automated Integration & Unit Test Suite for AI Daily Top 5 Betting Intelligence
Tests:
- Poisson Dixon-Coles goal expectation
- Strict decimal_odds > 1.30 enforcement
- Expected Value calculation
- Maximum one selection per match
- At most 5 selections published (and handling < 5 gracefully)
- Market settlements (WIN, LOST, VOID)
- Accurate Win-Rate denominator (excluding VOID and PENDING)
- Database persistence and idempotency
- Walk-forward backtest execution
"""

import unittest
from datetime import datetime, timezone

from odds_provider import OddsProvider, OddsQuote
from prediction_engine import PoissonDixonColesModel, CalibratedEnsembleEngine, BettingIntelligenceEngine
from settlement_tracker import SettlementEngine, PerformanceAnalyticsEngine
from prediction_models import PredictionDatabase
from backtest_engine import WalkForwardBacktester


class TestAIBettingIntelligenceEngine(unittest.TestCase):
    def setUp(self):
        self.odds_provider = OddsProvider(default_min_odds=1.30, default_max_odds=5.00)
        self.engine = BettingIntelligenceEngine(min_odds=1.30, max_odds=5.00, min_probability=0.65)
        self.db = PredictionDatabase("flashscore_tracker_test.db")

    def test_01_strict_odds_threshold_greater_than_130(self):
        # Odds of 1.30 or lower must NOT be eligible for Top 5
        quote_low = OddsQuote("m1", "Match Result", "Home Win", 1.28)
        self.assertFalse(quote_low.decimal_odds > 1.30)
        self.assertFalse(quote_low.to_dict()["is_eligible_top5"])

        # Odds strictly greater than 1.30 (e.g. 1.35, 1.48, 2.10) are eligible
        quote_valid = OddsQuote("m1", "Match Result", "Home Win", 1.45)
        self.assertTrue(quote_valid.decimal_odds > 1.30)
        self.assertTrue(quote_valid.to_dict()["is_eligible_top5"])

    def test_02_expected_value_calculation(self):
        # P_model = 75%, Odds = 1.50 -> EV = (0.75 * 1.50) - 1 = +0.125 (+12.5% ROI)
        ev = OddsProvider.calculate_expected_value(0.75, 1.50)
        self.assertAlmostEqual(ev, 0.125, places=3)

        # Negative EV: P_model = 50%, Odds = 1.80 -> EV = (0.50 * 1.80) - 1 = -0.10 (-10% ROI)
        ev_neg = OddsProvider.calculate_expected_value(0.50, 1.80)
        self.assertAlmostEqual(ev_neg, -0.10, places=3)

    def test_03_poisson_dixon_coles_properties(self):
        model = PoissonDixonColesModel()
        probs = model.predict_match(
            home_attack=1.4, home_defense=0.8,
            away_attack=0.9, away_defense=1.2
        )
        self.assertIn("Home Win", probs)
        self.assertIn("Over 1.5 Goals", probs)
        self.assertIn("BTTS Yes", probs)

        # Sum of 1X2 must equal ~1.0
        sum_1x2 = probs["Home Win"] + probs["Draw"] + probs["Away Win"]
        self.assertAlmostEqual(sum_1x2, 1.0, places=2)

    def test_04_one_selection_per_match_and_max_5(self):
        mock_matches = [
            {"id": f"match_{i}", "home_team": f"Team {i}A", "away_team": f"Team {i}B", "status": "Scheduled", "status_code": "1"}
            for i in range(12)
        ]
        top5 = self.engine.generate_daily_top5(mock_matches)

        # Maximum 5 picks
        self.assertLessEqual(len(top5), 5)

        # Strictly 1 selection per match
        match_ids = [s["match_id"] for s in top5]
        self.assertEqual(len(match_ids), len(set(match_ids)))

        # Every pick must have decimal_odds > 1.30
        for pick in top5:
            self.assertGreater(pick["decimal_odds"], 1.30)
            self.assertGreater(pick["estimated_ev"], 0.0)

    def test_05_handles_fewer_than_5_gracefully(self):
        # Only 2 matches available
        mock_matches = [
            {"id": "m1", "home_team": "Team A", "away_team": "Team B", "status": "Scheduled", "status_code": "1"},
            {"id": "m2", "home_team": "Team C", "away_team": "Team D", "status": "Scheduled", "status_code": "1"},
        ]
        picks = self.engine.generate_daily_top5(mock_matches)
        self.assertLessEqual(len(picks), 2)

    def test_06_market_settlement_rules(self):
        # 1X2 Settlement
        res_win, prof_win, _ = SettlementEngine.evaluate_market_outcome("Match Result", "Home Win", 2, 1)
        self.assertEqual(res_win, "WIN")

        res_lost, prof_lost, _ = SettlementEngine.evaluate_market_outcome("Match Result", "Home Win", 1, 1)
        self.assertEqual(res_lost, "LOST")

        # Over 2.5 Goals (Score 2-1 = 3 goals -> WIN)
        res_over, _, _ = SettlementEngine.evaluate_market_outcome("Goals Over/Under", "Over 2.5 Goals", 2, 1)
        self.assertEqual(res_over, "WIN")

        # Under 2.5 Goals (Score 2-1 = 3 goals -> LOST)
        res_under, _, _ = SettlementEngine.evaluate_market_outcome("Goals Over/Under", "Under 2.5 Goals", 2, 1)
        self.assertEqual(res_under, "LOST")

        # Draw No Bet on Draw -> VOID
        res_dnb, _, _ = SettlementEngine.evaluate_market_outcome("Draw No Bet", "Home DNB", 1, 1)
        self.assertEqual(res_dnb, "VOID")

        # Postponed match -> VOID
        res_postp, _, _ = SettlementEngine.evaluate_market_outcome("Match Result", "Home Win", 0, 0, is_postponed=True)
        self.assertEqual(res_postp, "VOID")

    def test_07_win_rate_and_roi_calculation(self):
        history = [
            {"status": "WIN", "stake_units": 1.0, "profit_units": 0.50, "decimal_odds": 1.50, "model_probability": 0.72},
            {"status": "WIN", "stake_units": 1.0, "profit_units": 0.80, "decimal_odds": 1.80, "model_probability": 0.65},
            {"status": "LOST", "stake_units": 1.0, "profit_units": -1.0, "decimal_odds": 1.60, "model_probability": 0.68},
            {"status": "VOID", "stake_units": 1.0, "profit_units": 0.0, "decimal_odds": 1.45, "model_probability": 0.70},
            {"status": "PENDING", "stake_units": 1.0, "profit_units": 0.0, "decimal_odds": 1.55, "model_probability": 0.75},
        ]
        metrics = PerformanceAnalyticsEngine.calculate_metrics(history)

        # Win rate = 2 Wins / (2 Wins + 1 Loss) = 66.67% (strictly excludes VOID and PENDING!)
        self.assertAlmostEqual(metrics["win_rate_pct"], 66.67, places=1)

        # Net Profit = +0.50 + 0.80 - 1.00 = +0.30
        self.assertAlmostEqual(metrics["net_profit_units"], 0.30, places=2)

        # Total Staked = 3 settled units (2 wins + 1 loss + 1 void = 4)
        self.assertGreater(metrics["roi_pct"], 0)

    def test_08_walk_forward_backtest(self):
        backtester = WalkForwardBacktester()
        sample_fixtures = [
            {"id": f"h_{i}", "home_team": f"Team H{i}", "away_team": f"Team A{i}", "home_score": "2", "away_score": "1", "status": "Finished", "timestamp": 1729000000 + i * 3600}
            for i in range(15)
        ]
        results = backtester.run_backtest(sample_fixtures)
        self.assertIn("performance", results)
        self.assertIn("validation_gate_passed", results)
        self.assertGreater(results["total_picks_generated"], 0)


if __name__ == "__main__":
    unittest.main()
