# Verification report

Verified on 2026-09-30 using Node24.19.0.

## Passed

- `npm test`: six test groups, all passed
- `node --check app.js` and `node --check optimizer.js`
- Exact score/minimum-cost results vs exhaustive **test-only** oracle: all budgets0–100, caps2/4/7/11, all three activities
- Current minimum stats, non-relevant stat spending, zero/full budgets, deterministic ties, input rejection, fixed bonuses and greedy-failure regression
- Source parity: all130 upgrade-cost values, all400 normal/transcended level budgets
- Original Python DP parity:18 cases (three activities, levels99/150/200, normal/transcended), rate error below1e−9
- jsdom smoke: default rates83.20/80.40/74.70; blank-input validation and stale-result clearing; class locks and rebirth; zero budget; overspending rejection; current-stat preservation; reset mode; positive/negative bonuses; repeated resets; persistence
- Default frontend has no external runtime dependencies and uses relative asset paths

## Performance sample

Node24 cloud machine; warmup100 cycles, measured500 solves per activity at level200, transcended, cap130:

- Rune:0.305ms mean,17030 transitions
- Poison:0.329ms mean,17030 transitions
- Potion:0.964ms mean,50697 transitions

These measurements describe this machine only. UI displays its actual calculation timing.

## Not yet verified

Rendered desktop/mobile visual QA and actual GitHub Pages deployment. Local Chromium launch was blocked by environment socket restrictions; managed cloud browser rejected localhost preview with ERR_BLOCKED_BY_CLIENT. DOM smoke is not a substitute for visual browser testing. Verify the published page at desktop and narrow mobile widths once hosting is available.
