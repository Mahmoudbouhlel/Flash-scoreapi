# Odds Source Status Report — Daily Top 5 v3.0

## 1. Odds Provider (`odds_provider.py`)
- Retrieves verified bookmaker consensus prices (Bet365 / Pinnacle).
- Enforces strict inequality: `decimal_odds > 1.30`.
- Upper bound: `5.00`.
- Snapshots odds at publication time to ensure historical immutability. Zero odds fabrication.
