# Flashscore AI Football Intelligence v2.4

Production-grade football intelligence platform featuring two independent quantitative prediction engines:
1. **Engine A: Daily Pre-Match Top 5** (Strictly real fixtures, 4 supported markets: Home Win, Away Win, Over 2.5, BTTS Yes — **No Double Chance**).
2. **Engine B: Live Prediction Signals** (Real-time CDN data tracking 20+ statistics, match clock sync health badges, rolling momentum, and 7 live signal engines).

## Key Features
- **Robust Live Match Clock Service**: Accurate period tracking, minute interpolation, stoppage time (`45+X`, `90+X`), half-time/full-time freezes (`HT`/`FT`), and stale feed detection with visual health indicators (`LIVE`, `SYNCING`, `STALE`).
- **Real Data Only**: Zero production demos or synthetic feeds. Direct ingestion from Flashscore CDN (`46.flashscore.ninja`).
- **Deep Statistical Context**: Ingests attacking stats, xG, shots on target, possession, corners, cards, fouls, saves, and pre-match context (Elo, form).
- **Automated Settlement & Performance Tracking**: Flat 1-unit flat staking, automatic resolution, win rate, ROI, net profit units, and max drawdown.
- **Telegram & Discord Integrations**: Secure webhook configuration, bot tokens, and instant alert dispatchers.

## Running the Application
- Development server runs on port 3000 via `npm run dev`.
- Production build via `npm run build`.
