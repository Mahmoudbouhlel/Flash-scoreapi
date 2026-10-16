# Performance Audit — Flashscore Football Intelligence PRO v3.3

## 1. Settlement Rules
- **Flat Staking**: 1.0 unit per pick (`WIN = odds - 1.0`, `LOST = -1.0`, `VOID = 0.0`).
- **Settlement Trigger**: Automatic settlement worker checks finished match scorelines against market rules.
- **Audit Metrics**:
  - Excludes empty slots and unverified picks.
  - Recalculates Win Rate %, ROI %, Net Profit Units, Average Odds, and Max Drawdown exclusively on verified settled selections.
