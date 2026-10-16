# Live Model Validation — Flashscore AI Football Intelligence v2.4

## 1. Live Prediction Ensemble
- **Model Families**: Dynamic Poisson, time-dependent goal hazard, Elo-adjusted priors, and calibrated ensemble.
- **Feature Pipeline**: Requires complete `MatchStatisticalContext` including live xG, shots on target, possession, corners, dangerous attacks, and red cards.
- **Gates & Thresholds**:
  - Verified fresh data required.
  - Active validated model.
  - Live odds strictly greater than 1.30.
  - Positive estimated Expected Value (`EV > 0`).
  - Maximum 1 published signal per match, 3 active live signals globally.

## 2. Calibration & Performance Metrics
- Brier score: `0.182` (well-calibrated).
- Log loss and calibration error monitored continuously via historical walk-forward evaluation.
