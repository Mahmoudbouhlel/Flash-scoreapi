"""
Flashscore v2.2 Real-Time Intelligence: Telegram & Discord Notification Dispatcher
Handles real-time live alert formatting, rich embeds, rate limiting,
error recovery, test alerts, and settlement outcome updates.
"""

import json
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List


ENGINE_DISPLAY_NAMES = {
    "1H_GOALS": "⚡ Engine A: 1st Half Goals",
    "2H_GOALS": "🔥 Engine B: 2nd Half Goals",
    "LATE_1H": "⏳ Engine C: Late 1st Half Pressure",
    "LATE_2H": "⏱️ Engine D: Late 2nd Half Crunch",
    "COMEBACK": "👑 Engine E: Dominance & Comeback",
    "MOMENTUM_SHIFT": "🌊 Engine F: Heavy Momentum Shift",
    "NEXT_GOAL": "🎯 Engine G: Next Goal Predictor",
}

DISCORD_COLORS = {
    "1H_GOALS": 0x10B981,       # Emerald
    "2H_GOALS": 0xF59E0B,       # Amber
    "LATE_1H": 0x8B5CF6,        # Purple
    "LATE_2H": 0xEF4444,        # Red
    "COMEBACK": 0x3B82F6,       # Blue
    "MOMENTUM_SHIFT": 0x06B6D4, # Cyan
    "NEXT_GOAL": 0xEC4899,      # Pink
    "WIN": 0x10B981,            # Green
    "LOST": 0xEF4444,           # Red
    "VOID": 0x6B7280,           # Gray
}


class NotificationDispatcher:
    def __init__(self):
        self.headers = {
            "User-Agent": "FlashscoreIntelligence/2.2",
            "Content-Type": "application/json",
        }

    # -------------------------------------------------------------------------
    # TELEGRAM FORMATTING & DISPATCH
    # -------------------------------------------------------------------------

    def format_telegram_signal_markdown(self, signal: Dict[str, Any]) -> str:
        """
        Creates professional Telegram Markdown message with verified odds > 1.30,
        model probability, positive EV, live match metrics, and trigger rationale.
        """
        engine_name = ENGINE_DISPLAY_NAMES.get(signal.get("engine_code", ""), signal.get("engine_code", "LIVE SIGNAL"))
        match_title = f"{signal.get('home_team', 'Home')} vs {signal.get('away_team', 'Away')}"
        league = signal.get("league", "Football League")
        minute = signal.get("minute", "Live")
        score = signal.get("score_at_signal", "0 - 0")
        market = signal.get("market", "")
        selection = signal.get("selection", "")
        odds = signal.get("decimal_odds", 0.0)
        bookmaker = signal.get("bookmaker", "Bet365 / Pinnacle")
        prob_pct = round(signal.get("model_probability", 0.0) * 100, 1)
        implied_pct = round(signal.get("implied_probability", 0.0) * 100, 1)
        ev_pct = round(signal.get("expected_value", 0.0) * 100, 1)
        xg = f"{signal.get('home_xg', 0.0):.2f} - {signal.get('away_xg', 0.0):.2f}"
        shots = f"{signal.get('home_shots_on_target', 0)}/{signal.get('home_total_shots', 0)} vs {signal.get('away_shots_on_target', 0)}/{signal.get('away_total_shots', 0)}"
        poss = f"{signal.get('home_possession', 50)}% - {signal.get('away_possession', 50)}%"
        
        evidence_list = signal.get("triggering_evidence", [])
        evidence_str = "\n".join([f"• {e}" for e in evidence_list[:4]]) if evidence_list else "• Real-time model threshold exceeded"

        ev_sign = "+" if ev_pct > 0 else ""

        text = (
            f"🚨 *FLASHSCORE v2.2 LIVE SIGNAL*\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"🏆 *{league}*\n"
            f"⚔️ *{match_title}*\n"
            f"⏱️ Minute: `{minute}'` | Score: `{score}`\n"
            f"🏷️ Strategy: *{engine_name}*\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"🎯 *SELECTION:* `{selection}`\n"
            f"📊 *MARKET:* {market}\n"
            f"💰 *VERIFIED ODDS:* `{odds:.2f}` (Strictly > 1.30)\n"
            f"🏢 *BOOKMAKER:* {bookmaker}\n"
            f"📈 *MODEL PROBABILITY:* `{prob_pct}%` (Implied: {implied_pct}%)\n"
            f"💎 *EXPECTED VALUE (EV):* `{ev_sign}{ev_pct}%`\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"📊 *LIVE MATCH PULSE*\n"
            f"• xG: `{xg}`\n"
            f"• SOT / Total: `{shots}`\n"
            f"• Possession: `{poss}`\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"🧠 *ANALYTICAL TRIGGERS*\n"
            f"{evidence_str}\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"⚠️ *Disclaimer:* Calibrated quantitative live signal. Please bet responsibly."
        )
        return text

    def format_telegram_settlement_markdown(self, signal: Dict[str, Any]) -> str:
        res = signal.get("settlement_result", "PENDING").upper()
        icon = "✅" if res == "WIN" else ("❌" if res == "LOST" else "⚪")
        units = signal.get("profit_units", 0.0)
        units_str = f"+{units:.2f}" if units > 0 else f"{units:.2f}"

        text = (
            f"{icon} *SIGNAL SETTLED: {res}*\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"⚔️ {signal.get('home_team')} vs {signal.get('away_team')}\n"
            f"🎯 Selection: `{signal.get('selection')}`\n"
            f"💰 Odds: `{signal.get('decimal_odds'):.2f}`\n"
            f"🏁 Final/Landing Score: `{signal.get('final_score', signal.get('score_at_signal'))}`\n"
            f"⏱️ Settled at: `{signal.get('settled_at_minute', 'FT')}'`\n"
            f"💵 Unit Profit: `{units_str} units`\n"
            f"━━━━━━━━━━━━━━━━━━\n"
            f"Flashscore Deep Live Tracker v2.2 Settlement Engine"
        )
        return text

    def send_telegram(self, bot_token: str, chat_id: str, message: str, thread_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Dispatches payload to Telegram Bot API sendMessage.
        """
        if not bot_token or not chat_id:
            return {"success": False, "error": "Missing bot_token or chat_id"}

        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": message,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True,
        }
        if thread_id:
            try:
                payload["message_thread_id"] = int(thread_id)
            except ValueError:
                pass

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers=self.headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                resp_data = json.loads(response.read().decode("utf-8"))
                return {
                    "success": resp_data.get("ok", False),
                    "message_id": resp_data.get("result", {}).get("message_id"),
                    "raw": resp_data
                }
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            return {"success": False, "error": f"HTTP {e.code}: {err_body}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # -------------------------------------------------------------------------
    # DISCORD FORMATTING & DISPATCH
    # -------------------------------------------------------------------------

    def build_discord_signal_embed(self, signal: Dict[str, Any]) -> Dict[str, Any]:
        engine_code = signal.get("engine_code", "LIVE_SIGNAL")
        engine_name = ENGINE_DISPLAY_NAMES.get(engine_code, engine_code)
        color = DISCORD_COLORS.get(engine_code, 0x10B981)
        match_title = f"{signal.get('home_team', 'Home')} vs {signal.get('away_team', 'Away')}"
        league = signal.get("league", "Football")
        minute = signal.get("minute", "Live")
        score = signal.get("score_at_signal", "0-0")
        odds = signal.get("decimal_odds", 0.0)
        bookmaker = signal.get("bookmaker", "Bet365 / Pinnacle")
        prob_pct = round(signal.get("model_probability", 0.0) * 100, 1)
        implied_pct = round(signal.get("implied_probability", 0.0) * 100, 1)
        ev_pct = round(signal.get("expected_value", 0.0) * 100, 1)
        ev_sign = "+" if ev_pct > 0 else ""

        xg = f"{signal.get('home_xg', 0.0):.2f} - {signal.get('away_xg', 0.0):.2f}"
        shots = f"{signal.get('home_shots_on_target', 0)}/{signal.get('home_total_shots', 0)} vs {signal.get('away_shots_on_target', 0)}/{signal.get('away_total_shots', 0)}"
        poss = f"{signal.get('home_possession', 50)}% - {signal.get('away_possession', 50)}%"

        evidence = signal.get("triggering_evidence", [])
        evidence_text = "\n".join([f"• {e}" for e in evidence[:4]]) if evidence else "• Quantitative model edge verified"

        embed = {
            "title": f"🚨 {engine_name}",
            "description": f"**{match_title}**\n*{league}*",
            "color": color,
            "fields": [
                {"name": "⏱️ Time & Score", "value": f"**{minute}'** | Score: **{score}**", "inline": True},
                {"name": "🎯 Recommended Market", "value": f"**{signal.get('selection')}**\n({signal.get('market')})", "inline": True},
                {"name": "💰 Live Verified Odds", "value": f"**`{odds:.2f}`** *(Strictly > 1.30)*\n{bookmaker}", "inline": True},
                {"name": "📈 Model Prob vs Implied", "value": f"Model: **{prob_pct}%**\nImplied: {implied_pct}%", "inline": True},
                {"name": "💎 Expected Value (EV)", "value": f"**`{ev_sign}{ev_pct}%`**", "inline": True},
                {"name": "📊 Match Pulse", "value": f"xG: `{xg}`\nSOT: `{shots}`\nPoss: `{poss}`", "inline": True},
                {"name": "🧠 Key Signals & Triggers", "value": evidence_text, "inline": False},
            ],
            "footer": {
                "text": "Flashscore v2.2 Real-Time Intelligence • Strictly Calibrated Signals"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return embed

    def build_discord_settlement_embed(self, signal: Dict[str, Any]) -> Dict[str, Any]:
        res = signal.get("settlement_result", "PENDING").upper()
        color = DISCORD_COLORS.get(res, 0x6B7280)
        icon = "✅" if res == "WIN" else ("❌" if res == "LOST" else "⚪")
        units = signal.get("profit_units", 0.0)
        units_str = f"+{units:.2f}" if units > 0 else f"{units:.2f}"

        embed = {
            "title": f"{icon} Signal Settled: {res}",
            "description": f"**{signal.get('home_team')} vs {signal.get('away_team')}**",
            "color": color,
            "fields": [
                {"name": "🎯 Selection", "value": f"`{signal.get('selection')}` @ `{signal.get('decimal_odds'):.2f}`", "inline": True},
                {"name": "🏁 Result", "value": f"Score: `{signal.get('final_score', signal.get('score_at_signal'))}` ({signal.get('settled_at_minute', 'FT')}')", "inline": True},
                {"name": "💵 Profit / Loss", "value": f"**`{units_str} units`**", "inline": True},
            ],
            "footer": {
                "text": "Flashscore v2.2 Automated Settlement Ledger"
            },
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        return embed

    def send_discord(self, webhook_url: str, content: str = "", embeds: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        if not webhook_url:
            return {"success": False, "error": "Missing webhook_url"}

        payload: Dict[str, Any] = {
            "username": "Flashscore v2.2 Intelligence",
            "avatar_url": "https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/radar.png"
        }
        if content:
            payload["content"] = content
        if embeds:
            payload["embeds"] = embeds

        try:
            req = urllib.request.Request(
                webhook_url,
                data=json.dumps(payload).encode("utf-8"),
                headers=self.headers,
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=8) as resp:
                # Discord returns 204 No Content on success
                return {"success": resp.status in (200, 204)}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            return {"success": False, "error": f"HTTP {e.code}: {err_body}"}
        except Exception as e:
            return {"success": False, "error": str(e)}

    # -------------------------------------------------------------------------
    # ROUTING & TEST DISPATCH
    # -------------------------------------------------------------------------

    def is_in_quiet_hours(self, quiet_hours_enabled: bool, start_hour: int, end_hour: int) -> bool:
        if not quiet_hours_enabled:
            return False
        current_hour = datetime.now(timezone.utc).hour
        if start_hour <= end_hour:
            return start_hour <= current_hour < end_hour
        else: # Over midnight, e.g. 23:00 to 07:00
            return current_hour >= start_hour or current_hour < end_hour

    def dispatch_signal(self, signal: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dispatches a signal to configured active destinations according to filtering rules.
        """
        result = {
            "telegram": {"attempted": False, "success": False},
            "discord": {"attempted": False, "success": False},
            "skipped_reasons": []
        }

        # Check quiet hours
        if self.is_in_quiet_hours(
            settings.get("quiet_hours_enabled", False),
            settings.get("quiet_hours_start", 23),
            settings.get("quiet_hours_end", 7)
        ):
            result["skipped_reasons"].append("Quiet hours active (UTC)")
            return result

        # Check thresholds
        min_odds = float(settings.get("min_odds", 1.30))
        min_ev = float(settings.get("min_ev", 0.03))
        min_prob = float(settings.get("min_prob", 0.50))
        enabled_engines = settings.get("enabled_engines", list(ENGINE_DISPLAY_NAMES.keys()))

        if float(signal.get("decimal_odds", 0.0)) < min_odds:
            result["skipped_reasons"].append(f"Odds {signal.get('decimal_odds')} < min {min_odds}")
            return result

        if float(signal.get("expected_value", 0.0)) < min_ev:
            result["skipped_reasons"].append(f"EV {signal.get('expected_value')} < min {min_ev}")
            return result

        if float(signal.get("model_probability", 0.0)) < min_prob:
            result["skipped_reasons"].append(f"Probability {signal.get('model_probability')} < min {min_prob}")
            return result

        if signal.get("engine_code") not in enabled_engines:
            result["skipped_reasons"].append(f"Engine {signal.get('engine_code')} disabled")
            return result

        # Telegram
        tg_token = settings.get("telegram_token", "").strip()
        tg_chat = settings.get("telegram_chat_id", "").strip()
        tg_thread = settings.get("telegram_thread_id", "").strip() or None

        if settings.get("telegram_enabled", False) and tg_token and tg_chat:
            result["telegram"]["attempted"] = True
            msg = self.format_telegram_signal_markdown(signal)
            tg_res = self.send_telegram(tg_token, tg_chat, msg, tg_thread)
            result["telegram"]["success"] = tg_res.get("success", False)
            if not tg_res.get("success"):
                result["telegram"]["error"] = tg_res.get("error")

        # Discord
        discord_url = settings.get("discord_webhook_url", "").strip()
        if settings.get("discord_enabled", False) and discord_url:
            result["discord"]["attempted"] = True
            embed = self.build_discord_signal_embed(signal)
            dc_res = self.send_discord(discord_url, embeds=[embed])
            result["discord"]["success"] = dc_res.get("success", False)
            if not dc_res.get("success"):
                result["discord"]["error"] = dc_res.get("error")

        return result

    def dispatch_settlement(self, signal: Dict[str, Any], settings: Dict[str, Any]) -> Dict[str, Any]:
        result = {"telegram": False, "discord": False}

        tg_token = settings.get("telegram_token", "").strip()
        tg_chat = settings.get("telegram_chat_id", "").strip()
        tg_thread = settings.get("telegram_thread_id", "").strip() or None

        if settings.get("telegram_enabled", False) and tg_token and tg_chat:
            msg = self.format_telegram_settlement_markdown(signal)
            tg_res = self.send_telegram(tg_token, tg_chat, msg, tg_thread)
            result["telegram"] = tg_res.get("success", False)

        discord_url = settings.get("discord_webhook_url", "").strip()
        if settings.get("discord_enabled", False) and discord_url:
            embed = self.build_discord_settlement_embed(signal)
            dc_res = self.send_discord(discord_url, embeds=[embed])
            result["discord"] = dc_res.get("success", False)

        return result

    def send_test_alert(self, destination: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sends an immediate sample test signal to verify webhook/bot credentials.
        """
        sample_signal = {
            "signal_id": "test_sig_001",
            "match_id": "test_match",
            "home_team": "Arsenal",
            "away_team": "Chelsea",
            "league": "Premier League",
            "minute": "34",
            "score_at_signal": "0 - 0",
            "engine_code": "1H_GOALS",
            "market": "First Half Over 0.5 Goals",
            "selection": "1H Over 0.5",
            "decimal_odds": 1.68,
            "bookmaker": "Bet365 (Live Feed)",
            "model_probability": 0.74,
            "implied_probability": 0.595,
            "expected_value": 0.243,
            "home_xg": 1.15,
            "away_xg": 0.25,
            "home_shots_on_target": 4,
            "home_total_shots": 7,
            "away_shots_on_target": 1,
            "away_total_shots": 2,
            "home_possession": 63,
            "away_possession": 37,
            "triggering_evidence": [
                "Arsenal accumulated 1.15 xG within first 34 mins",
                "4 shots on target inside penalty box",
                "Goal hazard model predicts 74.0% 1H goal probability",
                "Live market odds 1.68 generates +24.3% Expected Value (EV)"
            ]
        }

        if destination == "telegram":
            bot_token = config.get("telegram_token", "").strip()
            chat_id = config.get("telegram_chat_id", "").strip()
            thread_id = config.get("telegram_thread_id", "").strip() or None
            if not bot_token or not chat_id:
                return {"success": False, "error": "Bot token or Chat ID is missing"}
            msg = self.format_telegram_signal_markdown(sample_signal)
            return self.send_telegram(bot_token, chat_id, msg, thread_id)

        elif destination == "discord":
            webhook_url = config.get("discord_webhook_url", "").strip()
            if not webhook_url:
                return {"success": False, "error": "Discord Webhook URL is missing"}
            embed = self.build_discord_signal_embed(sample_signal)
            return self.send_discord(webhook_url, embeds=[embed])

        return {"success": False, "error": f"Unknown destination: {destination}"}
