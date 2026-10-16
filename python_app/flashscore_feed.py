"""
Flashscore Direct Feed Scraper & Delimiter Stream Decoder
Connects directly to Flashscore CDN feeds (e.g. 46.flashscore.ninja/37/x/feed/f_1_0_3_en_1)
Decodes the proprietary ~ / ¬ / ÷ delimited data packets into clean Python dictionaries.
"""

import urllib.request
import urllib.error
import time
from typing import List, Dict, Any, Optional

SPORT_ID_MAP = {
    "football": 1,
    "soccer": 1,
    "tennis": 2,
    "basketball": 3,
    "hockey": 4,
    "ice-hockey": 4,
    "american-football": 5,
    "baseball": 6,
    "handball": 7,
    "rugby": 8,
    "floorball": 9,
    "volleyball": 12,
    "cricket": 13,
    "darts": 14,
    "snooker": 15,
    "boxing": 16,
    "esports": 25
}

STATUS_MAP = {
    "1": "Scheduled",
    "2": "Live",
    "3": "Finished",
    "4": "Postponed",
    "5": "Cancelled",
    "6": "Interrupted",
    "7": "Abandoned",
    "8": "Suspended",
    "9": "Awarded",
    "10": "Delayed"
}

class FlashscoreFeedScraper:
    def __init__(self, cdn_server: str = "46.flashscore.ninja"):
        self.cdn_server = cdn_server
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "x-fsign": "SW9D1eZo",
            "Referer": "https://www.flashscore.com/",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
        }

    def fetch_feed_data(self, sport_id: int, day_offset: int = 0) -> str:
        url = f"https://{self.cdn_server}/37/x/feed/f_{sport_id}_{day_offset}_3_en_1"
        req = urllib.request.Request(url, headers=self.headers)
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read().decode("utf-8", errors="ignore")

    def parse_feed(self, raw_data: str, status_filter: str = "all") -> List[Dict[str, Any]]:
        blocks = raw_data.split("~")
        current_league = "Unknown League"
        current_country = "Global"
        current_tournament_id = ""
        matches = []
        
        for block in blocks:
            fields = {}
            for segment in block.split("¬"):
                if "÷" in segment:
                    parts = segment.split("÷", 1)
                    fields[parts[0].strip()] = parts[1].strip()

            if "ZA" in fields:
                current_league = fields.get("ZA", "")
            if "ZY" in fields:
                current_country = fields.get("ZY", "")
            if "ZEE" in fields:
                current_tournament_id = fields.get("ZEE", "")

            if "AA" in fields:
                match_id = fields.get("AA")
                raw_status = fields.get("AB", "1")
                status_text = STATUS_MAP.get(raw_status, "Unknown")
                
                if status_filter == "live" and raw_status != "2":
                    continue
                elif status_filter == "finished" and raw_status != "3":
                    continue
                elif status_filter == "scheduled" and raw_status != "1":
                    continue

                home_score = fields.get("AG", "-")
                away_score = fields.get("AH", "-")
                
                period_scores = []
                if "BA" in fields and "BC" in fields:
                    period_scores.append({"period": "1st Half", "home": fields.get("BA"), "away": fields.get("BC")})
                if "BB" in fields and "BD" in fields:
                    period_scores.append({"period": "2nd Half", "home": fields.get("BB"), "away": fields.get("BD")})

                detailed_state = fields.get("AC", "")
                elapsed_minute = fields.get("AC", "Live") if raw_status == "2" else None
                    
                match_obj = {
                    "id": match_id,
                    "league": current_league,
                    "country": current_country,
                    "tournament_id": current_tournament_id,
                    "home_team": fields.get("AE", "Home Team"),
                    "away_team": fields.get("AF", "Away Team"),
                    "home_score": home_score,
                    "away_score": away_score,
                    "status_code": raw_status,
                    "status": status_text,
                    "detailed_state": detailed_state,
                    "elapsed_minute": elapsed_minute,
                    "timestamp": int(fields.get("AD", 0)) if fields.get("AD", "").isdigit() else None,
                    "periods": period_scores,
                    "winner": "home" if fields.get("AS") == "1" else ("away" if fields.get("AS") == "2" else None),
                    "url": f"https://www.flashscore.com/match/{match_id}/"
                }
                matches.append(match_obj)

        return matches

    def get_matches(self, sport: str = "football", day_offset: int = 0, status: str = "all") -> List[Dict[str, Any]]:
        sport_id = SPORT_ID_MAP.get(sport.lower(), 1)
        raw_data = self.fetch_feed_data(sport_id, day_offset)
        return self.parse_feed(raw_data, status_filter=status)
