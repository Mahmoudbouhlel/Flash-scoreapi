# Daily Top 5 Validation — Flashscore Football Intelligence PRO v3.3

## 1. Allocation Strategy & Rules
- **Fixed 5-Market Distribution**:
  1. `#1`: Best Home Win
  2. `#2`: Second-best Home Win
  3. `#3`: Best Away Win
  4. `#4`: Best Over 2.5 Goals
  5. `#5`: Best BTTS Yes
- **Strict Prohibition**: Double Chance (`1X`, `X2`, `12`) and Draw picks are strictly forbidden.
- **Constraints**:
  - Verified odds > 1.30 and <= 5.00
  - Calibrated model probability >= 65%
  - Minimum Expected Value edge (EV) >= +3.0%
  - Maximum 1 selection per fixture across the daily slate
  - Unfilled slots are kept empty (`is_empty_slot: true`) without fake picks or fictional odds.
