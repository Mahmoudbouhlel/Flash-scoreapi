"""
Flashscore v2.3 Robust Real-Time Match Clock & Live Synchronization Service
Implements:
1. Provider reconciliation from Flashscore live event codes (AB, AC, AD, AO).
2. Proper 45+ and 90+ stoppage/added time calculation.
3. Half-time clock freeze (HT) and 2nd half continuation (46'+).
4. Full-time clock freeze (FT) and extra time / penalties support.
5. Live state determination (LIVE, STALE, OFFLINE) and data delay in seconds.
6. Local elapsed estimation between provider heartbeats without look-ahead drift.
"""

import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple


class MatchClockService:
    @staticmethod
    def parse_provider_clock(
        status_code: str,
        detailed_state: str,
        kickoff_timestamp: Optional[int],
        provider_timestamp: Optional[int] = None,
        now_ts: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Calculates verified match period, elapsed minute, stoppage time,
        and clock display from real provider status codes.
        """
        now = now_ts or time.time()
        prov_ts = provider_timestamp or int(now)
        delay_sec = max(0.0, round(now - prov_ts, 1))

        # Determine status state
        if delay_sec > 90.0:
            status_state = "STALE"
        else:
            status_state = "LIVE"

        st_code = str(status_code or "1").strip()
        det_code = str(detailed_state or "").strip()

        # Non-live / Scheduled
        if st_code == "1":
            return {
                "period": "Scheduled",
                "minute": 0,
                "added_time": 0,
                "display_clock": "Scheduled",
                "is_running": False,
                "provider_timestamp": prov_ts,
                "last_sync_timestamp": now,
                "data_delay_seconds": delay_sec,
                "status_state": "SCHEDULED"
            }

        # Finished
        if st_code == "3" or det_code == "3" or "finish" in det_code.lower() or "ft" in det_code.lower():
            return {
                "period": "Full-Time",
                "minute": 90,
                "added_time": 0,
                "display_clock": "FT",
                "is_running": False,
                "provider_timestamp": prov_ts,
                "last_sync_timestamp": now,
                "data_delay_seconds": delay_sec,
                "status_state": "FINISHED"
            }

        # Postponed / Cancelled / Interrupted / Delayed
        if st_code == "4" or det_code == "4":
            return {
                "period": "Postponed",
                "minute": 0,
                "added_time": 0,
                "display_clock": "Postponed",
                "is_running": False,
                "provider_timestamp": prov_ts,
                "last_sync_timestamp": now,
                "data_delay_seconds": delay_sec,
                "status_state": "POSTPONED"
            }
        if st_code == "5" or det_code == "5":
            return {
                "period": "Cancelled",
                "minute": 0,
                "added_time": 0,
                "display_clock": "Cancelled",
                "is_running": False,
                "provider_timestamp": prov_ts,
                "last_sync_timestamp": now,
                "data_delay_seconds": delay_sec,
                "status_state": "CANCELLED"
            }
        if st_code in ("6", "7", "8") or det_code in ("6", "7", "8", "43"):
            lbl = "Interrupted" if st_code == "6" else ("Abandoned" if st_code == "7" else "Suspended")
            return {
                "period": lbl,
                "minute": 0,
                "added_time": 0,
                "display_clock": lbl,
                "is_running": False,
                "provider_timestamp": prov_ts,
                "last_sync_timestamp": now,
                "data_delay_seconds": delay_sec,
                "status_state": "PAUSED"
            }

        # Half-Time freeze
        if det_code == "38" or "half" in det_code.lower() or "ht" in det_code.lower():
            return {
                "period": "Half-Time",
                "minute": 45,
                "added_time": 0,
                "display_clock": "HT",
                "is_running": False,
                "provider_timestamp": prov_ts,
                "last_sync_timestamp": now,
                "data_delay_seconds": delay_sec,
                "status_state": status_state
            }

        # Extra Time / Penalties
        if det_code in ("14", "15") or "et" in det_code.lower():
            return {
                "period": "Extra Time",
                "minute": 105,
                "added_time": 0,
                "display_clock": "ET",
                "is_running": True,
                "provider_timestamp": prov_ts,
                "last_sync_timestamp": now,
                "data_delay_seconds": delay_sec,
                "status_state": status_state
            }
        if det_code == "16" or "pen" in det_code.lower():
            return {
                "period": "Penalties",
                "minute": 120,
                "added_time": 0,
                "display_clock": "Pen.",
                "is_running": False,
                "provider_timestamp": prov_ts,
                "last_sync_timestamp": now,
                "data_delay_seconds": delay_sec,
                "status_state": status_state
            }

        # LIVE MATCH: 1st Half (AC: 12) or 2nd Half (AC: 13)
        # Parse explicit minute if det_code contains a raw number or stoppage format (e.g. "45+2'", "78'")
        raw_clean = det_code.replace("'", "").replace("+", " ").strip()
        explicit_min: Optional[int] = None
        explicit_add: int = 0

        parts = raw_clean.split()
        if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
            explicit_min = int(parts[0])
            explicit_add = int(parts[1])
        elif len(parts) == 1 and parts[0].isdigit():
            val = int(parts[0])
            if val <= 90:
                explicit_min = val
            # det_code could be 12 (1H) or 13 (2H) code
            if val in (12, 13):
                explicit_min = None

        is_second_half = (det_code == "13") or (explicit_min is not None and explicit_min >= 46)

        if explicit_min is not None:
            calc_minute = explicit_min
            added = explicit_add
        else:
            # Estimate from provider timestamp delta if kickoff timestamp exists
            if kickoff_timestamp and kickoff_timestamp > 0:
                diff_sec = max(0, prov_ts - kickoff_timestamp)
                diff_min = int(diff_sec // 60)
                if is_second_half:
                    # Flashscore 2nd half begins ~60 mins after match kickoff (45m 1H + 15m HT)
                    calc_minute = min(90, max(46, 45 + max(1, diff_min - 60)))
                    added = max(0, diff_min - 105) if diff_min > 105 else 0
                else:
                    calc_minute = min(45, max(1, diff_min))
                    added = max(0, diff_min - 45) if diff_min > 45 else 0
            else:
                calc_minute = 46 if is_second_half else 15
                added = 0

        period_name = "2nd Half" if is_second_half else "1st Half"

        # Format display clock with stoppage handling
        if is_second_half:
            if calc_minute >= 90 and added > 0:
                disp = f"90+{added}'"
            elif calc_minute >= 90:
                disp = "90'"
            else:
                disp = f"{calc_minute}'"
        else:
            if calc_minute >= 45 and added > 0:
                disp = f"45+{added}'"
            elif calc_minute >= 45:
                disp = "45'"
            else:
                disp = f"{calc_minute}'"

        return {
            "period": period_name,
            "minute": calc_minute,
            "added_time": added,
            "display_clock": disp,
            "is_running": (status_state == "LIVE"),
            "provider_timestamp": prov_ts,
            "last_sync_timestamp": now,
            "data_delay_seconds": delay_sec,
            "status_state": status_state
        }

    @staticmethod
    def estimate_interpolated_clock(clock_record: Dict[str, Any], now_ts: Optional[float] = None) -> Dict[str, Any]:
        """
        Advances the clock smoothly between provider polls only when the match state supports it
        (is_running is True and status_state is LIVE). Freezes at 45+ stoppage, HT, and 90+ stoppage.
        """
        now = now_ts or time.time()
        last_sync = clock_record.get("last_sync_timestamp", now)
        elapsed_sec = max(0.0, now - last_sync)

        # Check stale threshold
        if elapsed_sec > 90.0:
            updated = dict(clock_record)
            updated["status_state"] = "STALE"
            updated["is_running"] = False
            updated["data_delay_seconds"] = round(elapsed_sec, 1)
            return updated

        updated = dict(clock_record)
        updated["data_delay_seconds"] = round(elapsed_sec, 1)

        if not clock_record.get("is_running") or clock_record.get("status_state") != "LIVE":
            return updated

        period = clock_record.get("period", "")
        base_minute = clock_record.get("minute", 0)
        base_added = clock_record.get("added_time", 0)

        added_minutes = int(elapsed_sec // 60)
        if added_minutes <= 0:
            return updated

        if period == "1st Half":
            new_min = base_minute + added_minutes
            if new_min < 45:
                updated["minute"] = new_min
                updated["display_clock"] = f"{new_min}'"
            else:
                # In stoppage time
                stoppage = (new_min - 45) + base_added
                updated["minute"] = 45
                updated["added_time"] = stoppage
                updated["display_clock"] = f"45+{stoppage}'" if stoppage > 0 else "45'"
        elif period == "2nd Half":
            new_min = base_minute + added_minutes
            if new_min < 90:
                updated["minute"] = new_min
                updated["display_clock"] = f"{new_min}'"
            else:
                # In stoppage time
                stoppage = (new_min - 90) + base_added
                updated["minute"] = 90
                updated["added_time"] = stoppage
                updated["display_clock"] = f"90+{stoppage}'" if stoppage > 0 else "90'"

        return updated
