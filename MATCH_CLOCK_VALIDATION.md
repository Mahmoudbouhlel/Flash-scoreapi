# Match Clock Validation — Flashscore AI Football Intelligence v2.4

## 1. Requirements & Protocol
- **State Validation**: Strict validation of raw status codes (`1` = Scheduled, `2` = Live, `3` = Finished, `4` = Postponed, `5` = Cancelled). Status codes are never blindly interpreted as match minutes.
- **Clock Ticking & Interpolation**: Monotonic elapsed time interpolation between server polling intervals when actively running.
- **Half-Time & Full-Time Freezes**: At half-time, clock freezes and displays `HT`. At full-time, displays `FT`.
- **Stale Feed Protection**: If provider synchronization exceeds 60 seconds without refresh, the clock status switches to `STALE` and data-sensitive signal generation is suspended.

## 2. Test Scenarios Verified
- First-half normal progression (`1' – 45'`)
- Stoppage time formatting (`45+X`, `90+X`)
- Half-time freeze (`HT`)
- Second-half resumption (`46' – 90'`)
- Full-time finalization (`FT`)
- Stale feed detection & suspension
