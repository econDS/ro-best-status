# Best Status — readability pass (round 1)

Presentation only. The calculator, optimizer, data and `styles.css` are untouched; the delta is a reversible pair list (`changes.json`) plus one `<style id="readability">` block (`readability.css`).

- Text below 12px: 81% of rendered characters on desktop (79% on mobile) before → 7% / 6% after (the remainder is decorative caps labels and hero artwork, floor 10px). Body base 14px → 15px.
- Hero is shorter (smaller title and artwork, no 310px minimum) so the planner is reachable sooner.
- Start panel: activity choices in a 2×2 grid; the two jump links are a tidy row instead of two links with an orphan "·".

Tests: `node --test` 35/35; `tests/first-run.browser.cjs` PASS (exact calculation outputs equal the historical baseline); `qa/best-status-nav/browser.cjs` 364 checks / 0 failures (Chromium via Playwright 1.55.1, local).
Not addressed: muted text colours, result hierarchy, touch-target audit.

## Round 2
- Contrast: remaining text below WCAG AA (privacy note, timing line, footer, "BASE" tag) lightened; only the decorative `↗` arrows stay at ~4.3:1.
- Remaining shorthand sizes the first pass missed raised: rate-improvement 9→13px, card timing 8→11px, "BASE" tag, stat field labels 10→12px.
- Touch targets: links, summaries and buttons are 44px high (reset button 40px), number fields and selects 40px; checkbox rows 44px. Radio/checkbox inputs keep their native size inside 44px labels.
- Result hierarchy: best rate 64px (was 38px), recommended stat values 28–34px (was 20px), label 14px; tables and notes stay quiet.
- Tests: `node --test` 35/35; `tests/first-run.browser.cjs` PASS (calculation outputs identical to the historical baseline); `qa/best-status-nav/browser.cjs` 364 checks / 0 failures. No horizontal overflow at 1440 or 390.
