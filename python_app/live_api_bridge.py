"""
Flashscore v2.2 Python CLI Bridge for Express Server API
Provides JSON-RPC CLI commands for real-time live matches, signals,
simulation, settings, Telegram/Discord notifications, and settlement.
"""

import sys
import json
import os
from live_signal_engine import LiveSignalEngine
from notification_dispatcher import NotificationDispatcher


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing action argument"}))
        sys.exit(1)

    action = sys.argv[1]
    engine = LiveSignalEngine()
    dispatcher = NotificationDispatcher()

    # 1. GET PERFORMANCE
    if action == "get_performance":
        engine.seed_initial_demo_data()
        perf = engine.get_performance_ledger()
        print(json.dumps(perf))

    # 2. GET SIGNALS
    elif action == "get_signals":
        status_filter = sys.argv[2] if len(sys.argv) > 2 else "ALL"
        limit = int(sys.argv[3]) if len(sys.argv) > 3 else 50
        signals = engine.get_all_signals(status_filter, limit)
        print(json.dumps(signals))

    # 3. GET LIVE MATCHES (REAL FLASHSCORE CDN)
    elif action == "get_live_matches":
        matches = engine.fetch_and_enrich_live_matches(limit=35)
        print(json.dumps(matches))

    # 4. SCAN AND DETECT SIGNALS ACROSS REAL FLASHSCORE MATCHES
    elif action == "scan_signals":
        res = engine.scan_real_flashscore()
        print(json.dumps({
            "scanned_matches": res["scanned_matches"],
            "detected_signals": res["detected_signals"],
            "new_saved": len(res["new_signals"]),
            "signals": res["new_signals"],
            "settled_signals_count": res.get("settled_signals_count", 0)
        }))

    # 5. GET MATCH SNAPSHOTS
    elif action == "get_match_snapshots":
        match_id = sys.argv[2] if len(sys.argv) > 2 else ""
        snapshots = engine.get_snapshots_for_match(match_id)
        if not snapshots and match_id.startswith("live_m_"):
            # Provide sample historical snapshots for demo match
            snapshots = [
                {"minute": 10, "home_score": 0, "away_score": 0, "home_xg": 0.15, "away_xg": 0.05, "home_shots_on_target": 1, "away_shots_on_target": 0, "pressure_score": 55},
                {"minute": 20, "home_score": 0, "away_score": 0, "home_xg": 0.45, "away_xg": 0.12, "home_shots_on_target": 2, "away_shots_on_target": 0, "pressure_score": 62},
                {"minute": 30, "home_score": 0, "away_score": 0, "home_xg": 0.88, "away_xg": 0.22, "home_shots_on_target": 3, "away_shots_on_target": 1, "pressure_score": 71},
                {"minute": 34, "home_score": 0, "away_score": 0, "home_xg": 1.15, "away_xg": 0.28, "home_shots_on_target": 4, "away_shots_on_target": 1, "pressure_score": 78},
            ]
        print(json.dumps(snapshots))

    # 6. SETTINGS GET / UPDATE
    elif action == "get_settings":
        settings = engine.get_settings()
        print(json.dumps(settings))

    elif action == "update_settings":
        payload = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        updated = engine.update_settings(payload)
        print(json.dumps(updated))

    # 7. TEST ALERT (Telegram / Discord)
    elif action == "test_alert":
        dest = sys.argv[2] if len(sys.argv) > 2 else "telegram"
        config = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
        res = dispatcher.send_test_alert(dest, config)
        print(json.dumps(res))

    # 8. SETTLE SIGNALS WITH REAL FLASHSCORE RESULTS
    elif action == "settle_signals":
        res = engine.settle_with_flashscore()
        perf = engine.get_performance_ledger()
        print(json.dumps({"settled_count": res["settled_count"], "settled": res["settled_signals"], "performance": perf}))

    # 9. SYNC REAL FLASHSCORE CDN
    elif action == "sync_flashscore":
        res = engine.scan_real_flashscore()
        perf = engine.get_performance_ledger()
        print(json.dumps({
            "success": True,
            "source": "Flashscore CDN (46.flashscore.ninja)",
            "scanned_matches": res["scanned_matches"],
            "detected_signals": res["detected_signals"],
            "new_signals": res["new_signals"],
            "live_matches": res["live_matches"],
            "settled_count": res["settled_signals_count"],
            "performance": perf
        }))

    # 9. SIMULATE LIVE SCENARIO
    elif action == "simulate":
        payload = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
        match = {
            "id": payload.get("id", "sim_match"),
            "home_team": payload.get("home_team", "Home FC"),
            "away_team": payload.get("away_team", "Away FC"),
            "league": payload.get("league", "Simulated League"),
            "elapsed_minute": str(payload.get("minute", "35")),
            "home_score": str(payload.get("home_score", "0")),
            "away_score": str(payload.get("away_score", "0")),
            "stats": {
                "home_xg": float(payload.get("home_xg", 1.2)),
                "away_xg": float(payload.get("away_xg", 0.3)),
                "home_shots_on_target": int(payload.get("home_shots_on_target", 4)),
                "home_total_shots": int(payload.get("home_total_shots", 8)),
                "away_shots_on_target": int(payload.get("away_shots_on_target", 1)),
                "away_total_shots": int(payload.get("away_total_shots", 3)),
                "home_possession": float(payload.get("home_possession", 60.0)),
                "away_possession": float(payload.get("away_possession", 40.0)),
                "home_dangerous_attacks": int(payload.get("home_dangerous_attacks", 25)),
                "away_dangerous_attacks": int(payload.get("away_dangerous_attacks", 10)),
                "home_red_cards": int(payload.get("home_red_cards", 0)),
                "away_red_cards": int(payload.get("away_red_cards", 0))
            }
        }
        detected = engine.detect_signals_for_match(match)
        print(json.dumps({"match": match, "signals_detected": detected}))

    # 10. GLOBAL MATCH ANALYSIS
    elif action == "run_global_analysis":
        from prediction_engine import GlobalMatchAnalyzer
        analyzer = GlobalMatchAnalyzer()
        # Fetch live/upcoming matches
        matches = engine.fetch_and_enrich_live_matches(limit=50)
        analyses = analyzer.analyze_all_discovered_fixtures(matches)
        print(json.dumps({"success": True, "count": len(analyses), "analyses": analyses}))

    elif action == "get_global_analyses":
        from models import DatabaseManager
        db = DatabaseManager()
        rows = db.get_all_global_analyses()
        print(json.dumps({"success": True, "count": len(rows), "analyses": rows}))

    else:
        print(json.dumps({"error": f"Unknown action: {action}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
