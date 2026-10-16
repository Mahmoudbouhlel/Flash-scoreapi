# Live Clock Validation — Flashscore Football Intelligence PRO v3.3

## 1. Match Clock Architecture
- **Raw Provider Status Mapping**:
  - `1` = Scheduled
  - `2` = Live In-Play
  - `3` = Finished / Full-Time
  - `4` = Postponed
  - `5` = Cancelled
- **Period State Machine**: `NOT_STARTED` -> `1ST_HALF` -> `HALF_TIME` -> `2ND_HALF` -> `EXTRA_TIME` -> `FULL_TIME`.
- **Stoppage Time Handling**: Correctly formats `45+X` for first half and `90+X` for second half stoppage time.
- **Feed Stale Protection**: Visual badges indicate `LIVE` (synced < 15s), `SYNCING` (sync in progress), `STALE` (delay > 30s), or `ERROR`.
