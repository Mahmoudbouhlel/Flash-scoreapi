"""
Flashscore Detailed Match Statistics, Incidents & Lineups Parser
Decodes:
- df_st_1_{match_id}: 20+ match statistics with universal SD codes (xG, possession, shots on/off target, box shots, fouls, etc.)
- df_su_1_{match_id}: Match incidents & events timeline (goals, penalties, cards, substitutions, VAR)
- df_li_1_{match_id}: Lineups, formations, player ratings, starting XI, and bench
"""

import urllib.request
import urllib.error
import re
from typing import Dict, Any, List, Optional

# Universal Flashscore SD Numeric Code Mappings (Locale-independent)
SD_STAT_MAP = {
    "432": ("expected_goals", "Expected Goals (xG)", "core"),
    "499": ("xg_on_target", "xG on Target (xGOT)", "shots"),
    "503": ("expected_assists", "Expected Assists (xA)", "passes"),
    "12": ("ball_possession", "Ball Possession (%)", "core"),
    "34": ("total_shots", "Total Shots", "shots"),
    "13": ("shots_on_target", "Shots on Target", "shots"),
    "14": ("shots_off_target", "Shots off Target", "shots"),
    "158": ("blocked_shots", "Blocked Shots", "shots"),
    "461": ("shots_inside_box", "Shots Inside Box", "shots"),
    "463": ("shots_outside_box", "Shots Outside Box", "shots"),
    "459": ("big_chances", "Big Chances", "shots"),
    "457": ("hit_woodwork", "Hit Woodwork", "shots"),
    "16": ("corner_kicks", "Corner Kicks", "core"),
    "23": ("yellow_cards", "Yellow Cards", "discipline"),
    "22": ("red_cards", "Red Cards", "discipline"),
    "21": ("fouls", "Fouls", "discipline"),
    "17": ("offsides", "Offsides", "discipline"),
    "19": ("goalkeeper_saves", "Goalkeeper Saves", "defense"),
    "342": ("passes", "Passes & Accuracy", "passes"),
    "517": ("long_balls", "Long Balls", "passes"),
    "467": ("passes_final_third", "Passes to Final Third", "passes"),
    "433": ("crosses", "Crosses", "passes"),
    "471": ("dangerous_attacks", "Touches in Opponent Box / Dangerous Attacks", "core"),
    "475": ("tackles", "Tackles", "defense"),
    "479": ("clearances", "Clearances", "defense"),
    "434": ("interceptions", "Interceptions", "defense"),
    "511": ("goals_prevented", "Goals Prevented", "defense"),
    "20": ("goal_kicks", "Goal Kicks", "defense"),
}


class FlashscoreStatsParser:
    def __init__(self, cdn_server: str = "46.flashscore.ninja"):
        self.cdn_server = cdn_server
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "x-fsign": "SW9D1eZo",
            "Referer": "https://www.flashscore.com/",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
        }

    def _fetch_feed(self, endpoint_path: str) -> str:
        url = f"https://{self.cdn_server}/37/x/feed/{endpoint_path}"
        req = urllib.request.Request(url, headers=self.headers)
        with urllib.request.urlopen(req, timeout=3.5) as resp:
            return resp.read().decode("utf-8", errors="ignore")

    def get_match_statistics(self, match_id: str) -> Dict[str, Any]:
        """
        Parses all match statistics for full match (and half periods if present)
        Returns structured dict with normalized metrics and raw items.
        """
        raw_data = self._fetch_feed(f"df_st_1_{match_id}")
        if not raw_data or len(raw_data.strip()) == 0:
            return {"match_id": match_id, "stats": {}, "raw_items": []}

        stats_dict = {}
        raw_items = []
        blocks = raw_data.split("~")

        current_period = "Match"
        for block in blocks:
            fields = {}
            for item in block.split("¬"):
                if "÷" in item:
                    parts = item.split("÷", 1)
                    fields[parts[0].strip()] = parts[1].strip()

            if "SE" in fields:
                current_period = fields["SE"]

            if "SD" in fields:
                sd_code = fields["SD"]
                raw_label = fields.get("SG", f"Stat {sd_code}")
                home_val_str = fields.get("SH", "0").strip()
                away_val_str = fields.get("SI", "0").strip()

                stat_meta = SD_STAT_MAP.get(sd_code)
                stat_key = stat_meta[0] if stat_meta else f"stat_{sd_code}"
                english_name = stat_meta[1] if stat_meta else raw_label
                category = stat_meta[2] if stat_meta else "core"

                # Parse numeric values
                def clean_num(val_str: str):
                    clean = re.sub(r"[^\d.]", "", val_str)
                    if clean:
                        try:
                            return float(clean) if "." in clean else int(clean)
                        except ValueError:
                            return 0
                    return 0

                home_numeric = clean_num(home_val_str)
                away_numeric = clean_num(away_val_str)

                # Store primary match-level stat if not already populated
                if stat_key not in stats_dict:
                    stats_dict[stat_key] = {
                        "home": home_numeric if "%" not in home_val_str and "/" not in home_val_str else home_val_str,
                        "away": away_numeric if "%" not in away_val_str and "/" not in away_val_str else away_val_str,
                        "home_raw": home_numeric,
                        "away_raw": away_numeric,
                    }

                # Compute comparison percentage for visual bars
                total = home_numeric + away_numeric
                home_pct = round((home_numeric / total * 100), 1) if total > 0 else 50.0

                raw_items.append({
                    "code": sd_code,
                    "key": stat_key,
                    "name": english_name,
                    "category": category,
                    "home": home_val_str,
                    "away": away_val_str,
                    "home_raw": home_numeric,
                    "away_raw": away_numeric,
                    "home_percentage": home_pct,
                    "period": current_period
                })

        return {
            "match_id": match_id,
            "period": current_period,
            "stats": stats_dict,
            "raw_items": raw_items
        }

    def get_match_incidents(self, match_id: str) -> List[Dict[str, Any]]:
        """
        Parses match events: goals, assists, yellow/red cards, substitutions, and VAR reviews.
        Feed: df_su_1_{match_id}
        """
        try:
            raw_data = self._fetch_feed(f"df_su_1_{match_id}")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return []
            raise

        incidents = []
        blocks = raw_data.split("~")

        for idx, block in enumerate(blocks):
            fields = {}
            for item in block.split("¬"):
                if "÷" in item:
                    parts = item.split("÷", 1)
                    fields[parts[0].strip()] = parts[1].strip()

            minute = fields.get("IB", "")
            incident_type_raw = fields.get("IA", "")
            player = fields.get("IN", fields.get("IK", "Player"))
            sub_player = fields.get("IK", "") if "IN" in fields else ""
            score = fields.get("IC", "")

            # Incident type mapping
            inc_type = "event"
            if incident_type_raw == "1":
                inc_type = "goal"
            elif incident_type_raw == "2":
                inc_type = "yellow_card"
            elif incident_type_raw == "3":
                inc_type = "substitution"
            elif incident_type_raw == "4":
                inc_type = "red_card"
            elif incident_type_raw == "5":
                inc_type = "var"

            # Determine team (home vs away)
            team = "home" if fields.get("IF") == "1" else "away"

            if minute or player != "Player":
                incidents.append({
                    "id": f"{match_id}_inc_{idx}",
                    "minute": minute,
                    "type": inc_type,
                    "team": team,
                    "player": player,
                    "sub_player": sub_player,
                    "score_after": score,
                    "description": fields.get("IF_desc", "")
                })

        return incidents

    def get_match_lineups(self, match_id: str) -> Dict[str, Any]:
        """
        Parses starting XI, bench, coach, formations (e.g. 4-4-2, 4-3-3), and player ratings.
        Feed: df_li_1_{match_id}
        """
        try:
            raw_data = self._fetch_feed(f"df_li_1_{match_id}")
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return {}
            raise

        home_formation = "4-4-2"
        away_formation = "4-4-2"
        home_starting = []
        away_starting = []
        home_bench = []
        away_bench = []

        blocks = raw_data.split("~")
        current_team = "home"
        is_bench = False

        for block in blocks:
            fields = {}
            for item in block.split("¬"):
                if "÷" in item:
                    parts = item.split("÷", 1)
                    fields[parts[0].strip()] = parts[1].strip()

            # Formation header: LD÷1-4-4-2 or similar
            if "LD" in fields:
                raw_formation = fields["LD"].replace("1-", "")
                if current_team == "home":
                    home_formation = raw_formation
                    current_team = "away"
                else:
                    away_formation = raw_formation

            # Player entry: LP = player id, LI = player name, LPR = rating, LR = role
            if "LI" in fields:
                player_id = fields.get("LP", "")
                name = fields.get("LI", "Unknown")
                rating = float(fields["LPR"]) if "LPR" in fields and fields["LPR"].replace(".", "", 1).isdigit() else None
                role = fields.get("LR", "(M)")
                pos_category = "M"
                if "(G)" in role:
                    pos_category = "G"
                elif "(D)" in role:
                    pos_category = "D"
                elif "(F)" in role:
                    pos_category = "F"

                player_obj = {
                    "id": player_id,
                    "name": name,
                    "number": fields.get("LS", ""),
                    "position": pos_category,
                    "role_name": role,
                    "rating": rating
                }

                # Flashscore puts starting XI first (11 players), then bench
                if current_team == "home":
                    if len(home_starting) < 11:
                        home_starting.append(player_obj)
                    else:
                        home_bench.append(player_obj)
                else:
                    if len(away_starting) < 11:
                        away_starting.append(player_obj)
                    else:
                        away_bench.append(player_obj)

        return {
            "match_id": match_id,
            "home_formation": home_formation,
            "away_formation": away_formation,
            "home_starting": home_starting,
            "away_starting": away_starting,
            "home_bench": home_bench,
            "away_bench": away_bench
        }


if __name__ == "__main__":
    parser = FlashscoreStatsParser()
    print("Testing parser on match zq7kDz2N...")
    stats = parser.get_match_statistics("zq7kDz2N")
    print(f"Parsed {len(stats['raw_items'])} stat items.")
    print("Core metrics extracted:")
    for k, v in list(stats["stats"].items())[:8]:
        print(f"  {k}: {v}")
