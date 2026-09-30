# Verification report

## Math and source checks (2026-09-30)

- `npm test`: sixteen test groups passed
- JS syntax and `git diff --check` passed
- Exact score/minimum-cost results vs exhaustive **test-only** oracle for all budgets0–100, caps2/4/7/11, all three activities
- Current minima, irrelevant-stat spending, zero/full budgets, deterministic ties, invalid inputs, bonuses and greedy counterexample
- All130 cost entries and400 normal/transcended level budgets match pinned RO-help-tool tables
- Wiki source review checked all10 Rune recipes/minimumskills/ranks and17 potion entries; independent review confirmed coefficients/modifier tables
- Rune test: mastery10/job70/Ancient/Verkana,DEX90LUK100→80 raw; Mystic→110 raw, deliberately no undocumented clamp
- Potion test: PP10/Research10/Instruction5/Job70,DEX90LUK100INT50/Red→95.5..105.5 raw
- Verified fixed offsets/recipe endpoints change displayed output but not raw-optimal stat allocation
- Source arithmetic, formula uncertainty and rAthena differences documented in SOURCE_NOTES.md

## Job-bonus integration

- Six classes, every Job1..max and each stat increment boundary tested
- Exact max totals and documented supplemental Genetic/GX boundaries checked
- Current-class-only lookup; class switches do not stack previous bonuses
- Once-only Base+Job+equipment sum and separate direct JobLevel term tested numerically
- Profile-specific rebirth budgets, caps and invalid classes/levels checked
- Provenance caution appears only above confirmed Wiki ranges (or AssassinCrossJob1–2 AGI discrepancy)

## DOM smoke

Prior formula smoke covered10 Rune/17 potion recipes, skill/material updates, minimumskills, blank/invalid input, raw>100 and persisted-formula sanitization.

Current job-profile DOM smoke passed defaults70.60/84.80/86.95–96.95, allclass selectors, independent class/job changes, visibleJob clamp, forced-rebirth budgets, card-local cap/level/job/formula errors, once-only gear+Job totals, provenance warnings, v2 persistence, Creator valid above genericnonrebirth budget, zero budget and v1 migration preservingbase/level/budget/formula/backup with persistent notice and acknowledgment. DOM tests do not substitute for visual rendering.

## Browser/deployment verification

The earlier base release was verified in the deployed cloud browser at1165px, including no horizontal overflow and live validation/class/reset/persistence. Narrow mobile rendering has not been directly verified. Local Chromium is unavailable because of environment socket restrictions; live deployment is the supported visual-check route. Consult the GitHub Actions run for this exact commit to verify tests and publication; do not infer deployment success from this file alone.

## Performance

The score-indexed algorithm uses at most645 score units and three stats. Representative original-core Node24 benchmark (500 solves afterwarmup) was0.3–1ms per activity. Actual app timing varies bydevice and now includes formula validation; the UI displays measured timing. No fixed latency is guaranteed.
