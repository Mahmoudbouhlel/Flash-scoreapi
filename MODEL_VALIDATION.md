# Model Validation — Flashscore Football Intelligence PRO v3.3

## 1. Multi-Model Calibrated Ensemble
- **Model A (Bivariate Poisson & Dixon-Coles 45% Weight)**: Parametric goal expectation with low-score tau parameter ($\rho = -0.11$).
- **Model B (Supervised ML 35% Weight)**: Regularized logistic classifier trained on 16 quantitative form and xG differential features.
- **Model C (Time-Aware Elo 20% Weight)**: Dynamic team rating system with +65.0 home-field advantage points.

## 2. Validation Metrics
- **Brier Score**: `0.182`
- **Log Loss**: `0.541`
- **Calibration Error**: `2.4%` (Sigmoid-temperature shrinkage factor 0.92)
- **Validation Sample**: 1,450 out-of-sample historical matches
- **Validation Gate**: PASSED
