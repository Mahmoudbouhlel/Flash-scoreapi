# Daily Top 5 Implementation Report v3.1 — Fixed Market Allocation

## 1. Overview
The Daily Top 5 module has been upgraded to **v3.1**, replacing free selection with a strict **Fixed Market Allocation Strategy**.

## 2. Fixed Allocation Quotas
| Position | Market | Required Pick |
| :--- | :--- | :--- |
| **#1** | HOME WIN (1) | Best Home Win opportunity |
| **#2** | HOME WIN (1) | Second-best Home Win opportunity (different match) |
| **#3** | AWAY WIN (2) | Best Away Win opportunity |
| **#4** | OVER 2.5 GOALS | Best Over 2.5 Goals opportunity |
| **#5** | GG / BTTS YES | Best Both Teams To Score Yes opportunity |

## 3. Allocation Optimizer Rules
- Independent candidate pools (`homeWinPool`, `awayWinPool`, `over25Pool`, `bttsPool`).
- Global `usedMatches` set to ensure **no match is recommended twice** in the published top 5.
- If an allocated category has no qualified match meeting the strict odds (`> 1.30`) and probability (`>= 65%`) thresholds without duplication, the slot is left empty as `NO QUALIFIED PICK` rather than being filled by an unrequested market.
