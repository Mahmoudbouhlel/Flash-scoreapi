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
    "6": "Half Time",
    "7": "Finished (AET)",
    "8": "Finished (AP)",
    "9": "Walkover",
    "10": "Interrupted",
    "11": "Abandoned",
    "12": "TBA",
    "13": "Pause",
    "14": "1st Half",
    "15": "2nd Half",
    "16": "ET 1st Half",
    "17": "ET 2nd Half",
    "18": "Penalties",
    "38": "Half Time",
    "46": "Break"
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

        live_codes = {"2", "6", "13", "14", "15", "16", "17", "18", "38", "46"}
        finished_codes = {"3", "7", "8", "9"}
        scheduled_codes = {"1", "12"}
        
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
                status_text = STATUS_MAP.get(raw_status, "Live" if raw_status in live_codes else "Scheduled")
                
                if status_filter == "live" and raw_status not in live_codes:
                    continue
                elif status_filter == "finished" and raw_status not in finished_codes:
                    continue
                elif status_filter == "scheduled" and raw_status not in scheduled_codes:
                    continue

                home_score = fields.get("AG", "-")
                away_score = fields.get("AH", "-")
                
                period_scores = []
                if "BA" in fields and "BC" in fields:
                    period_scores.append({"period": "1st Half", "home": fields.get("BA"), "away": fields.get("BC")})
                if "BB" in fields and "BD" in fields:
                    period_scores.append({"period": "2nd Half", "home": fields.get("BB"), "away": fields.get("BD")})

                detailed_state = fields.get("AC", "")
                elapsed_minute = None
                
                if raw_status in live_codes:
                    ac = fields.get("AC", "").strip()
                    ts = int(fields.get("AD", 0)) if fields.get("AD", "").isdigit() else 0
                    if raw_status in ("6", "38") or ac == "HT" or "half time" in ac.lower():
                        elapsed_minute = "HT"
                    elif raw_status == "14" or ac == "1" or ac == "1HT" or "1st" in ac.lower():
                        minute_val = 1
                        if ac.isdigit():
                            minute_val = int(ac)
                        elif ts > 0:
                            diff_secs = max(0, int(time.time() - ts))
                            minute_val = (diff_secs // 60) + 1
                        elapsed_minute = f"1HT 45+{minute_val-45}'" if minute_val > 45 else f"1HT {max(1, minute_val)}'"
                    elif raw_status == "15" or ac == "2" or ac == "2HT" or "2nd" in ac.lower():
                        minute_val = 46
                        if ac.isdigit():
                            minute_val = int(ac)
                        elif ts > 0:
                            diff_secs = max(0, int(time.time() - ts))
                            diff_mins = diff_secs // 60
                            minute_val = 45 + diff_mins if diff_mins <= 45 else diff_mins
                        elapsed_minute = f"2HT 90+{minute_val-90}'" if minute_val > 90 else f"2HT {max(46, minute_val)}'"
                    elif ac and ac != "Live":
                        if ac.startswith("1HT") or ac.startswith("2HT") or ac in ("HT", "FT"):
                            elapsed_minute = ac
                        elif ac.isdigit():
                            num = int(ac)
                            elapsed_minute = f"1HT {num}'" if num <= 45 else f"2HT {num}'"
                        else:
                            elapsed_minute = ac if ac.endswith("'") else f"{ac}'"
                    elif ts > 0:
                        diff_mins = max(1, (int(time.time() - ts) // 60) + 1)
                        elapsed_minute = f"1HT {diff_mins}'" if diff_mins <= 45 else f"2HT {diff_mins}'"
                    else:
                        elapsed_minute = "Live"
                elif raw_status in finished_codes:
                    elapsed_minute = "FT"
                    
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
