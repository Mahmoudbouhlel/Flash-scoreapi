"""
Automatic Win / Loss Settlement Tracker (settlement_tracker.py)
Audit-proof idempotent result settlement for all supported betting markets.
Calculates ROI, Win Rate, Drawdown, Streaks, and Brier Score.
"""

from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime, timezone

from prediction_models import PredictionDatabase


class SettlementEngine:
    """
    Evaluates confirmed match outcomes against published betting selections.
    Enforces standard 90-minute regulation time rules and idempotency.
    """

    @staticmethod
    def evaluate_market_outcome(
        market: str,
        selection: str,
        home_score: int,
        away_score: int,
        is_postponed: bool = False,
        is_abandoned: bool = False
    ) -> Tuple[str, float, str]:
        """
        Settles a bet. Returns (status, profit_units, rationale).
        Flat stake = 1 unit.
        """
        if is_postponed or is_abandoned:
            return "VOID", 0.0, "Match postponed or abandoned"

        tot_goals = home_score + away_score

        # 1. Match Result
        if market == "Match Result":
            if selection == "Home Win":
                win = home_score > away_score
            elif selection == "Draw":
                win = home_score == away_score
            elif selection == "Away Win":
                win = away_score > home_score
            else:
                return "UNRESOLVED", 0.0, "Unknown selection"
            return ("WIN", 1.0, f"Score: {home_score}-{away_score}") if win else ("LOST", -1.0, f"Score: {home_score}-{away_score}")

        # 2. Double Chance
        elif market == "Double Chance":
            if selection == "1X":
                win = home_score >= away_score
            elif selection == "X2":
                win = away_score >= home_score
            elif selection == "12":
                win = home_score != away_score
            else:
                return "UNRESOLVED", 0.0, "Unknown selection"
            return ("WIN", 1.0, f"Score: {home_score}-{away_score}") if win else ("LOST", -1.0, f"Score: {home_score}-{away_score}")

        # 3. Draw No Bet (Push/Void on Draw)
        elif market == "Draw No Bet":
            if home_score == away_score:
                return "VOID", 0.0, "Draw in DNB market (Stake refunded)"
            elif selection == "Home DNB":
                win = home_score > away_score
            elif selection == "Away DNB":
                win = away_score > home_score
            else:
                return "UNRESOLVED", 0.0, "Unknown selection"
            return ("WIN", 1.0, f"Score: {home_score}-{away_score}") if win else ("LOST", -1.0, f"Score: {home_score}-{away_score}")

        # 4. Goals Over/Under
        elif market == "Goals Over/Under":
            if selection == "Over 1.5 Goals":
                win = tot_goals > 1.5
            elif selection == "Under 1.5 Goals":
                win = tot_goals < 1.5
            elif selection == "Over 2.5 Goals":
                win = tot_goals > 2.5
            elif selection == "Under 2.5 Goals":
                win = tot_goals < 2.5
            elif selection == "Over 3.5 Goals":
                win = tot_goals > 3.5
            elif selection == "Under 3.5 Goals":
                win = tot_goals < 3.5
            else:
                return "UNRESOLVED", 0.0, "Unknown selection"
            return ("WIN", 1.0, f"Total goals: {tot_goals}") if win else ("LOST", -1.0, f"Total goals: {tot_goals}")

        # 5. Both Teams To Score
        elif market == "Both Teams To Score":
            btts = (home_score > 0 and away_score > 0)
            if selection == "BTTS Yes":
                win = btts
            elif selection == "BTTS No":
                win = not btts
            else:
                return "UNRESOLVED", 0.0, "Unknown selection"
            return ("WIN", 1.0, f"Score: {home_score}-{away_score}") if win else ("LOST", -1.0, f"Score: {home_score}-{away_score}")

        return "UNRESOLVED", 0.0, "Unsupported market"

    @classmethod
    def settle_prediction_record(
        cls,
        pred: Dict[str, Any],
        final_home_score: int,
        final_away_score: int,
        is_postponed: bool = False
    ) -> Dict[str, Any]:
        """
        Idempotent settlement of a published prediction.
        """
        outcome_status, _, rationale = cls.evaluate_market_outcome(
            market=pred["market"],
            selection=pred["selection"],
            home_score=final_home_score,
            away_score=final_away_score,
            is_postponed=is_postponed
        )

        odds = float(pred.get("decimal_odds", 1.0))
        stake = float(pred.get("stake_units", 1.0))

        if outcome_status == "WIN":
            profit = round((odds - 1.0) * stake, 3)
        elif outcome_status == "LOST":
            profit = -stake
        else:
            profit = 0.0

        return {
            "prediction_id": pred.get("prediction_id", f"sim_{pred.get('match_id', 'm')}"),
            "status": outcome_status,
            "home_final_score": final_home_score,
            "away_final_score": final_away_score,
            "profit_units": profit,
            "rationale": rationale,
            "settled_at_utc": datetime.now(timezone.utc).isoformat()
        }


class PerformanceAnalyticsEngine:
    """
    Computes rigorous betting analytics and calibration metrics.
    Excludes VOID and PENDING from win-rate denominator.
    """

    @staticmethod
    def calculate_metrics(history: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_published = len(history)
        wins = 0
        losses = 0
        voids = 0
        pending = 0

        total_staked = 0.0
        net_profit = 0.0
        odds_sum = 0.0
        brier_sum = 0.0
        brier_count = 0

        # Streaks & Drawdown
        current_streak = 0
        longest_win_streak = 0
        longest_loss_streak = 0

        cumulative_profit = 0.0
        peak_profit = 0.0
        max_drawdown = 0.0

        daily_profit_map: Dict[str, float] = {}

        for p in reversed(history):  # Chronological order
            status = p.get("status", "PENDING")
            date_key = p.get("prediction_date", "unknown")
            stake = float(p.get("stake_units", 1.0))
            profit = float(p.get("profit_units", 0.0))
            odds = float(p.get("decimal_odds", 1.0))
            p_model = float(p.get("model_probability", 0.5))

            if status == "WIN":
                wins += 1
                total_staked += stake
                net_profit += profit
                odds_sum += odds
                cumulative_profit += profit
                daily_profit_map[date_key] = daily_profit_map.get(date_key, 0.0) + profit

                # Streaks
                current_streak = current_streak + 1 if current_streak > 0 else 1
                if current_streak > longest_win_streak:
                    longest_win_streak = current_streak

                # Brier score: (p_model - 1)^2
                brier_sum += (p_model - 1.0) ** 2
                brier_count += 1

            elif status == "LOST":
                losses += 1
                total_staked += stake
                net_profit += profit  # profit is negative (-1.0)
                odds_sum += odds
                cumulative_profit += profit
                daily_profit_map[date_key] = daily_profit_map.get(date_key, 0.0) + profit

                # Streaks
                current_streak = current_streak - 1 if current_streak < 0 else -1
                if abs(current_streak) > longest_loss_streak:
                    longest_loss_streak = abs(current_streak)

                # Brier score: (p_model - 0)^2
                brier_sum += (p_model - 0.0) ** 2
                brier_count += 1

            elif status == "VOID":
                voids += 1
                total_staked += stake
                cumulative_profit += 0.0

            else:
                pending += 1

            # Track Drawdown
            if cumulative_profit > peak_profit:
                peak_profit = cumulative_profit
            drawdown = peak_profit - cumulative_profit
            if drawdown > max_drawdown:
                max_drawdown = drawdown

        # Win Rate calculation: Strictly Wins / (Wins + Losses)
        resolved_count = wins + losses
        win_rate = (wins / resolved_count) if resolved_count > 0 else 0.0
        roi = (net_profit / total_staked) if total_staked > 0 else 0.0
        avg_odds = (odds_sum / resolved_count) if resolved_count > 0 else 0.0
        brier_score = (brier_sum / brier_count) if brier_count > 0 else 0.0

        return {
            "total_published": total_published,
            "wins": wins,
            "losses": losses,
            "voids": voids,
            "pending": pending,
            "win_rate_pct": round(win_rate * 100, 2),
            "roi_pct": round(roi * 100, 2),
            "net_profit_units": round(net_profit, 3),
            "total_staked_units": round(total_staked, 2),
            "average_odds": round(avg_odds, 3),
            "max_drawdown_units": round(max_drawdown, 3),
            "longest_win_streak": longest_win_streak,
            "longest_loss_streak": longest_loss_streak,
            "brier_score": round(brier_score, 4),
            "daily_profit_history": daily_profit_map
        }
