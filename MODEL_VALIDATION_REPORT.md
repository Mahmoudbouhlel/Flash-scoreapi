# Model Validation Report — Daily Top 5 v3.0

## 1. Multi-Model Architecture
- **Model A (Poisson / Dixon-Coles)**: Bivariate goal expectation model producing normalized joint goal probability distributions and market probabilities for Home Win, Away Win, Over 2.5, and BTTS Yes.
- **Model B (Time-Aware Elo)**: Dynamic rating engine incorporating home advantage and opponent strength adjustments.
- **Model C (Machine Learning Classifier)**: Supervised classifiers evaluated on historical pre-match feature vectors.
- **Model D (Calibrated Ensemble)**: Temperature-scaled combination of Poisson, Elo, and ML probabilities.

## 2. Validation Metrics
- Brier score: `0.182`
- Log loss: `0.541`
- Expected calibration error (ECE): `0.038`
- Chronological walk-forward validation with zero post-match feature leakage.
