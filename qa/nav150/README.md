# Host theme rollout (nav 1.5.1)

Baseline: `81b8e316bfc4a81c3457c265da96586d9949a8e0` (`main`). Existing node source suite passed before edits.

The eight public host palette/font tokens reuse the existing app palette; see `host-theme.json` for exact sources, values and contrast. No new color is introduced. The existing fixed-dark slate and mint palette is used.

`theme-host.css` only sets public tokens and the light-DOM fallback color/font/hover/focus. Existing `nav140-host.css` keeps all shell widths, responsive gutters, padding and 44px hit targets unchanged. The fallback uses the mapped host surface while retaining its existing geometry. There is no theme toggle or new storage key.

All earlier releases, including 1.4.1 and 1.5.0, remain byte-identical. Only the pinned module path and scoped stylesheet link change in application HTML. Strict normalization reverses those two exact changes before historical app/formula/first-run byte checks. Host application code, prices and metadata are untouched.

The read-only same-repository PR workflow runs all source tests, actual Chromium regression against current main, and the existing historical first-run suite. Full-suite cross-host screenshots and contrast matrix are coordinated separately.

The 1.5.1 source patch namespaces private fallback tokens so host `--muted`, `--line` and other existing app variables resolve correctly. Browser assertions compare all resolved public color tokens against the audited host values, plus computed navigation surface, text and font, including blocked-module fallback.
