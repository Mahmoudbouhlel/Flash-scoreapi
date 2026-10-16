# Daily Model Validation — Flashscore AI Football Intelligence v2.4

## 1. Daily Top 5 Architecture
- **Real Fixtures Only**: Fetches genuine upcoming matches for the requested date. No fictional teams or recycled yesterday fixtures.
- **Strict Market Exclusion**: **Double Chance (1X, X2, 12) is completely removed** from Daily Top 5 models, selection menus, candidate generation, and published picks.
- **Four Approved Markets**:
  1. HOME WIN (1)
  2. AWAY WIN (2)
  3. OVER 2.5 GOALS
  4. BOTH TEAMS TO SCORE — YES (GG / BTTS)
- **Odds Bounds**: Minimum odds strictly greater than 1.30 (default 1.30), maximum odds 5.00.
- **Limits**: Maximum 5 selections per day, exactly 1 selection per match.

## 2. Validation & Backtesting
- Dixon-Coles / Poisson joint score distribution combined with Elo ratings and historical form.
- Pre-match predictions frozen prior to kickoff. Zero post-match information leakage.
