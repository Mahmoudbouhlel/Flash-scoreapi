"""
Flashscore Mobile HTML Scraper (flashscore.mobi)
Extracts matches, live scores, and match details from lightweight HTML.
"""

import urllib.request
import urllib.parse
import re
from typing import List, Dict, Any, Optional

SPORT_PATHS = {
    "football": "",
    "soccer": "",
    "tennis": "tennis/",
    "basketball": "basketball/",
    "hockey": "hockey/",
    "baseball": "baseball/",
    "handball": "handball/",
    "volleyball": "volleyball/",
    "cricket": "cricket/"
}

class FlashscoreMobiScraper:
    def __init__(self):
        self.base_url = "https://www.flashscore.mobi"
        self.headers = {
            "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        }

    def _fetch_html(self, url: str) -> str:
        req = urllib.request.Request(url, headers=self.headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode("utf-8", errors="ignore")

    def get_matches(self, sport: str = "football", day_offset: int = 0, status: str = "all") -> List[Dict[str, Any]]:
        sport_path = SPORT_PATHS.get(sport.lower(), "")
        url = f"{self.base_url}/{sport_path}"
        
        params = []
        if status == "live":
            params.append("s=2")
        elif day_offset != 0:
            params.append(f"d={day_offset}")
            
        if params:
            url += "?" + "&".join(params)

        html = self._fetch_html(url)
        return self._parse_mobi_html(html, status_filter=status)

    def _parse_mobi_html(self, html: str, status_filter: str = "all") -> List[Dict[str, Any]]:
        matches = []
        league_pattern = re.compile(r'<h4>(.*?)</h4>(.*?)(?=(?:<h4>|<div id="footer">|$))', re.DOTALL)
        match_pattern = re.compile(
            r'(?:<span>(.*?)</span>\s*)?([^<]+?)\s*<a\s+href="[^"]*?/match/([a-zA-Z0-9]+)/?[^"]*"\s+class="([^"]+)">([^<]+)</a>',
            re.IGNORECASE
        )

        for league_match in league_pattern.finditer(html):
            raw_league = league_match.group(1)
            clean_league = re.sub(r'<[^>]+>', '', raw_league).strip()
            
            country = clean_league.split(":")[0].strip() if ":" in clean_league else "Global"
            league_name = clean_league.split(":", 1)[1].strip() if ":" in clean_league else clean_league
            
            section_html = league_match.group(2)
            for m in match_pattern.finditer(section_html):
                time_or_min = (m.group(1) or "").strip()
                teams_raw = m.group(2).strip()
                match_id = m.group(3).strip()
                class_attr = m.group(4).strip().lower()
                score_or_status = m.group(5).replace("&nbsp;", "").strip()

                status = "Unknown"
                if "live" in class_attr:
                    status = "Live"
                elif "fin" in class_attr:
                    status = "Finished"
                elif "sched" in class_attr:
                    status = "Scheduled"
                elif "canc" in class_attr:
                    status = "Cancelled"
                elif "postp" in class_attr:
                    status = "Postponed"

                if status_filter == "live" and status != "Live":
                    continue
                if status_filter == "finished" and status != "Finished":
                    continue
                if status_filter == "scheduled" and status != "Scheduled":
                    continue

                home_team = "Home Team"
                away_team = "Away Team"
                if " - " in teams_raw:
                    home_team, away_team = teams_raw.split(" - ", 1)
                elif "-" in teams_raw:
                    home_team, away_team = teams_raw.split("-", 1)

                home_score = "-"
                away_score = "-"
                if "-" in score_or_status and score_or_status != "-":
                    parts = score_or_status.split("-", 1)
                    home_score = parts[0].strip()
                    away_score = parts[1].strip()

                matches.append({
                    "id": match_id,
                    "league": clean_league,
                    "country": country,
                    "league_name": league_name,
                    "home_team": home_team.strip(),
                    "away_team": away_team.strip(),
                    "home_score": home_score,
                    "away_score": away_score,
                    "status": status,
                    "time": time_or_min,
                    "url": f"https://www.flashscore.com/match/{match_id}/"
                })

        return matches

    def get_match_detail(self, match_id: str) -> Optional[Dict[str, Any]]:
        url = f"{self.base_url}/match/{match_id}/"
        try:
            html = self._fetch_html(url)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            raise

        title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE)
        title = title_match.group(1) if title_match else ""

        details = re.findall(r'<div class="detail">(.*?)</div>', html, re.DOTALL)
        clean_details = [re.sub(r'<[^>]+>', '', d).strip() for d in details]

        score = ""
        period_breakdown = ""
        status = "Finished"
        kickoff_time = ""

        if clean_details:
            first_line = clean_details[0]
            if "(" in first_line and ")" in first_line:
                score_part, period_part = first_line.split("(", 1)
                score = score_part.strip()
                period_breakdown = period_part.rstrip(")").strip()
            else:
                score = first_line

            for d in clean_details[1:]:
                if any(x in d.lower() for x in ["finished", "live", "half time", "postponed", "cancelled"]):
                    status = d
                elif re.search(r'\d{2}\.\d{2}\.\d{4}', d):
                    kickoff_time = d

        home_team = "Home"
        away_team = "Away"
        if "|" in title:
            team_chunk = title.split("|", 1)[1].strip()
            if " - " in team_chunk:
                home_team, away_team = team_chunk.split(" - ", 1)

        return {
            "id": match_id,
            "title": title,
            "home_team": home_team,
            "away_team": away_team,
            "score": score,
            "period_breakdown": period_breakdown,
            "status": status,
            "kickoff_time": kickoff_time,
            "raw_details": clean_details,
            "url": f"https://www.flashscore.com/match/{match_id}/"
        }
