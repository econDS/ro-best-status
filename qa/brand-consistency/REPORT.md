# Best Status — STAT FORGE: branding-only QA

Base commit: `21131807125d4318c37e50c0a4efcfec2c1c8970`. Checkout started clean. Branch: `chore/best-status-brand-consistency`.

## Inventory and scope

- Portal registry, public navigation catalog and nav snapshots retain compact **Best Status**. Portal presentation maps its card, search results, favorites, recents, related references and accessible labels to **Best Status — STAT FORGE**. Presentation search retains all original aliases and adds `stat forge`.
- The Portal description is `จัดสเตตัสสำหรับ Rune, Poison และ Potion พร้อมหาค่าที่เหมาะที่สุดตามงบแต้ม`.
- Best Status title, description, logo, home accessible name, hero copy and README are updated. Best Status is primary; STAT FORGE is secondary. Exact Dynamic Programming remains supporting detail.
- No Best Status manifest, Open Graph, Twitter metadata or canonical element existed; none is invented. Existing favicon has no hardcoded brand text. Portal PWA retains its Portal name and scope.
- Identifiers, URLs, accent/icon, themes, selectors, storage keys/migration, calculations, Job Bonuses, stat caps, optimizer and source notes are unchanged.
- No nav release is needed. Short nav label already is **Best Status**. Every released artifact and lock-pinned source remains byte-identical, including nav 1.3.0. Public catalog is a compact navigation contract, not the full Portal presentation title.

## Tests

- Best Status baseline: `npm test`: 20 passed. Candidate adds a naming test; original frozen calculator fixtures remain unchanged.
- Portal original build was rerun in an isolated archive at the base commit. `npm run build`, `npm run build:nav`, `npm run test:nav` (2), `npm run test:pwa` (11), Python unittest (19 passed, 2 skipped) checked locally. Final CI reruns the full aggregate.
- Local Chromium launch unavailable (browser executable missing). Read-only PR CI installs pinned browser tooling and retains real screenshots/report; no browser pass is asserted until that run completes.
- Best Status browser comparisons normalize only exact approved branding strings in `copy-changes.json`; all calculator DOM/control/output/state comparisons remain. Naming can change text wrapping/vertical positions, so layout checks retain horizontal geometry, overflow, collision and theme checks rather than requiring old text heights.
- CI artifact identifies the tested commit; PR links point to latest head CI.

## Not tested / findings

Real devices, WebKit, Firefox, and Pages after merge are not tested. No redesign or unrelated bug fixes. Historical documentation about old PR deployment timing is left outside this naming scope.
