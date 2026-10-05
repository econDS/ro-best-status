# Best Status — readability pass (round 1)

Presentation only. The calculator, optimizer, data and `styles.css` are untouched; the delta is a reversible pair list (`changes.json`) plus one `<style id="readability">` block (`readability.css`).

- Text below 12px: 81% of rendered characters on desktop (79% on mobile) before → 7% / 6% after (the remainder is decorative caps labels and hero artwork, floor 10px). Body base 14px → 15px.
- Hero is shorter (smaller title and artwork, no 310px minimum) so the planner is reachable sooner.
- Start panel: activity choices in a 2×2 grid; the two jump links are a tidy row instead of two links with an orphan "·".

Tests: `node --test` 35/35; `tests/first-run.browser.cjs` PASS (exact calculation outputs equal the historical baseline); `qa/best-status-nav/browser.cjs` 364 checks / 0 failures (Chromium via Playwright 1.55.1, local).
Not addressed: muted text colours, result hierarchy, touch-target audit.
