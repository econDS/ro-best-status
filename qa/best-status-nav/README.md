# Best Status navigation regression evidence

## Scope and immutable baseline

- Baseline: `cb6f4aa775e1afc8efc450b6d31cd5fb73f9fd74` on `main`.
- Integration: local RO Suite 1.3.0, actual `best-status` identity, fixed dark theme, Thai fallback portal anchor, original skip link/header order retained.
- No calculator, DP, class/job-bonus, recipe, original style, source-limitations, settings, migration, share, or export behavior is changed. The existing app has no share/export or theme toggle.
- Existing keys remain `statforge-planner-v2` and legacy `statforge-planner-v1`; navigation adds none.
- Existing Pages workflow gains only copying `assets` into its existing static `public` artifact. No deployment was manually triggered by this work.

## Reproducible checks

`npm test` runs the original 16 tests unchanged plus navigation source/artifact invariants. `calculator-baseline.json` freezes 4 input scenarios × 3 craft outputs from the original source, covering all six classes, automatic Job Bonus, shared gear bonuses, current minima, reset allocation, recipe modifiers and custom budgets. `source-baseline.json` hashes the original core, CSS, tests, documentation and HTML. The test removes only the named navigation additions from HTML and checks exact original bytes.

`browser.cjs` is a standalone Playwright runner (outside Node's default test discovery), using immutable `BASE_ROOT` and the candidate source under `/ro-best-status/`. The read-only PR workflow archives the baseline, installs pinned QA tooling in runner temporary storage, and publishes logs, result JSON and screenshots even after failure. Check the report's `sourceSha` or recorded source-commit file against the PR head; an older green run does not verify a newer commit.

Browser coverage includes original/candidate calculations, all class selections, custom persisted settings, reload/migration, recipe and reset flows, 360/390/768/1440 widths under light/dark OS preferences with the same fixed dark app theme, keyboard menu/focus behavior, current-page identity, and an actually blocked navigation module with the calculator still usable. Existing baseline errors/overflow are reported separately from regressions. Timing text is excluded from DOM equivalence comparisons.

## Dependency and limitations

The Portal PR contains the reviewed 1.3.0 source and release artifacts plus the Portal catalog entry. Review/merge it first to establish the release source, then this integration. No tag, GitHub Release, Pages setting, merge, manual deployment or sibling-app upgrade is part of these PRs. Existing sibling apps pinned to 1.2.0 will not gain Best Status from this change. Grade & Refine stays planned without a launch URL.

Local Chromium startup is blocked by this execution environment's socket restriction. Real browser results must be verified from the PR CI run/artifact, never inferred from static tests. GitHub Actions artifact access requires access to the repository and a GitHub login; PNG evidence may be preserved in this directory after inspection.
