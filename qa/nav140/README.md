# RO Suite Nav 1.4.1 alignment rollout

Baseline: `3b7dd2ce37a8b3844a9a7774dda6caae2ff3fc0a`. Original source tests passed before edits (22 tests). Actual pre-edit Chromium layout evidence is recorded in `baseline-browser-receipt.json`: [baseline run](https://github.com/econDS/ro_tools_portal/actions/runs/37075741836). Six widths: 320, 360, 390, 430, 768, 1440. The previous navbar measured 98px on narrow screens and 68px on wider screens, with bar edges inset 9px or 15px from the real app content.

## Narrow production delta
- Add exact immutable 1.4.0 release from Portal source commit `24ca1068c8f6868b38d6224e661f818fec9897f9`
- Change the local module reference and add a scoped public-property host stylesheet
- Remove only the navigation host shell class to avoid double gutters; keep original header and main shell classes and app styles unchanged
- Preserve old releases and every original calculation, defaults, saved-state, first-run UX and app asset byte

`changes.json` records literal HTML replacements. The exact reverse adapter permits historical tests to retain their original immutable hashes. The new source test independently checks the real modified HTML, immutable latest-main reconstruction, untouched original files, release hashes, scoped CSS and read-only workflow. Existing browser regression is extended to all six widths and the new actual module path.

## Verification and review
All original source assertions are retained. The branch-scoped read-only workflow compares actual current-main and candidate calculation outputs, storage, fallback and keyboard paths in Chromium; it also reruns the existing first-run regression against its own immutable historical baseline. Cross-repository measured edge/height comparisons are reviewed centrally in [Portal PR #6](https://github.com/econDS/ro_tools_portal/pull/6). CI and central candidate comparison must pass at the exact PR head before readiness. Browser results are not claimed until the corresponding CI run completes.

## Rollback
Revert this rollout commit. Earlier release files remain available. No storage or data migration and no deployment workflow changes. Draft review only; do not merge before the source-of-truth PR is ready.

## Additive 1.4.1 accessibility patch
The final module reference is 1.4.1 from immutable Portal source `ac62659a26539d802111d255edb92b09ec68382b`. It keeps the optional catalog status live region exposed while empty by using zero margin rather than display:none. The existing 1.4.0 directory is preserved byte-for-byte, catalog/destinations are unchanged, and no host CSS or application behavior changed. Source guards independently validate both releases. Final-head Chromium checks rerun for this patch.
