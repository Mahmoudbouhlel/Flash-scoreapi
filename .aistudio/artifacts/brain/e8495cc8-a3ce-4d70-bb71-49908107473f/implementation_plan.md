# Implementation Plan - Flashscore AI Football Intelligence v2.4

We will upgrade the Flashscore AI Football Intelligence platform to v2.4 across both backend (`server.ts`, python workers) and frontend (`src/` components), strictly adhering to real data integrity, zero demos in production, accurate real-time clock synchronization with visual health badges (`SYNCING`, `LIVE`, `STALE`), deep statistical context, strict Daily Top 5 (excluding Double Chance entirely, markets: Home Win, Away Win, Over 2.5, BTTS Yes), automated result settlement, and complete documentation files.

## User Preferences Incorporated
- **Live Signal Risk Profile**: Research Only mode (all candidates visible and evaluated).
- **Daily Top 5 Odds Threshold**: Standard odds (1.30 to 5.00).

---

## Proposed Changes

### 1. Backend & Live Clock Synchronization (`server.ts` & Python bridge)
- **Robust Match Clock Service**:
  - Track period, minute, stoppage time (`45+X`, `90+X`), half-time freeze (`HT`), full-time freeze (`FT`), and stale-data indicators.
  - Expose `GET /api/v2/live/clock/{match_id}` returning provider minute, displayed minute, period, timestamp, data age, synchronization health, and source identity.
- **Persistent Live Match Tracker**:
  - Support manual, auto, and hybrid tracking modes stored persistently in SQLite.
  - Automatic background synchronization for discovery (30-60s), scores/clocks (5-10s), events (10-15s), stats (15-30s).
- **Deep Statistical Context (`MatchStatisticalContext`)**:
  - Ingest attacking stats (shots, shots on target, blocked shots, xG, big chances, touches inside box), possession, corners, cards, fouls, saves, and pre-match context (Elo, form, H2H).
- **Rolling Statistics & Momentum**:
  - Calculate rolling changes over 5, 10, 15 minutes (delta xG, delta shots, delta corners, delta big chances) and normalize a momentum index.

### 2. Prediction Engines & Signal Processing
- **Engine A: Daily Pre-Match Top 5**:
  - Strictly filtered to real upcoming fixtures.
  - **No Double Chance** (1X, X2, 12). Only 4 markets: Home Win (1), Away Win (2), Over 2.5, BTTS Yes (GG).
  - Odds range: 1.30 to 5.00.
  - Max 5 picks per day, 1 selection per match, positive estimated EV.
- **Engine B: Live Prediction Signals**:
  - Requires full statistical analysis before signal (default ON).
  - Evaluates models (Poisson, hazard, Elo-adjusted, ensemble) with calibrated probabilities and uncertainty.
  - States: `WAITING_FOR_STATISTICS`, `ANALYZING`, `INSUFFICIENT_DATA`, `NO_SIGNAL`, `CANDIDATE`, `QUALIFIED`, `PUBLISHED`, `TRACKING`, `SETTLED`.

### 3. Result Settlement & Notifications
- **Automatic Result Settlement**:
  - Flat 1-unit stake calculation (WIN = odds - 1, LOST = -1, VOID = 0).
  - Separate Daily and Live performance metrics (ROI, win rate, drawdown).
- **Telegram & Discord Integrations**:
  - Secure configuration for bot tokens, chat IDs, webhooks, and test alerts.

### 4. Frontend UI Upgrades (`src/`)
- **LiveSignalsCockpit**:
  - Add visual status indicators for match clock health (`SYNCING`, `LIVE`, `STALE`) next to the match minute.
  - Display last synchronization timestamp for each match.
  - High-density layout for Live Matches, Tracked Matches, Signal Radar, Active Signals, Daily Top 5, Prediction History, Model Performance, and Notifications.

### 5. Required Documentation Files
Create the following markdown files:
- `IMPLEMENTATION_STATUS.md`
- `REAL_DATA_AUDIT.md`
- `MATCH_CLOCK_VALIDATION.md`
- `LIVE_MODEL_VALIDATION.md`
- `DAILY_MODEL_VALIDATION.md`
- `TEST_RESULTS.md`
- `README.md`

---

## Verification Plan
- Run backend build and tests (`npm run build`, `npm run lint`).
- Verify API endpoints for live clock, stats, and predictions.
