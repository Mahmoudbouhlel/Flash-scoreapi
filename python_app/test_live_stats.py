"""
Automated Integration & Data Quality Tests
Tests feed decoding, statistics extraction, quality bounds, and database models.
"""

import unittest
from flashscore_feed import FlashscoreFeedScraper
from flashscore_stats_parser import FlashscoreStatsParser
from sync_engine import DataQualityValidator
from ml_dataset_pipeline import MLFeaturePipeline


class TestFlashscoreTracker(unittest.TestCase):
    def setUp(self):
        self.feed_scraper = FlashscoreFeedScraper()
        self.stats_parser = FlashscoreStatsParser()

    def test_01_feed_connectivity(self):
        matches = self.feed_scraper.get_matches("football", day_offset=0, status="all")
        self.assertIsInstance(matches, list)
        self.assertGreater(len(matches), 0, "Feed should return matches for today")
        
        sample = matches[0]
        self.assertIn("id", sample)
        self.assertIn("home_team", sample)
        self.assertIn("away_team", sample)

    def test_02_data_quality_validator(self):
        valid_match = {
            "home_team": "Arsenal",
            "away_team": "Chelsea",
            "home_score": "2",
            "away_score": "1"
        }
        warnings = DataQualityValidator.validate_match(valid_match)
        self.assertEqual(len(warnings), 0)

        invalid_match = {
            "home_team": "",
            "away_team": "Chelsea",
            "home_score": "abc"
        }
        warnings_invalid = DataQualityValidator.validate_match(invalid_match)
        self.assertGreater(len(warnings_invalid), 0)

    def test_03_stats_parser(self):
        # Test on match with stats: zq7kDz2N
        stats = self.stats_parser.get_match_statistics("zq7kDz2N")
        self.assertIn("stats", stats)
        self.assertIn("raw_items", stats)
        
        core_keys = stats["stats"].keys()
        self.assertIn("expected_goals", core_keys)
        self.assertIn("ball_possession", core_keys)
        self.assertIn("total_shots", core_keys)

    def test_04_ml_pipeline(self):
        sample_match = {
            "id": "test_123",
            "league": "Premier League",
            "home_team": "Team A",
            "away_team": "Team B",
            "home_score": "3",
            "away_score": "1"
        }
        features = MLFeaturePipeline.transform_match(sample_match)
        self.assertEqual(features["target_outcome"], "HOME_WIN")
        self.assertEqual(features["target_over_2_5"], 1)
        self.assertIn("xg_difference", features)
        self.assertIn("possession_differential", features)

        csv_str = MLFeaturePipeline.export_csv([features])
        self.assertIn("HOME_WIN", csv_str)
        self.assertIn("match_id", csv_str)


if __name__ == "__main__":
    unittest.main()
