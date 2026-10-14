# Dynamic navigation 2.0.0

Baseline: `8c45e80f93afc15bf5a79280c4a3fc9018684af1`, root publishing on `main`.

The only application HTML change is the local module path from 1.5.1 to 2.0.0. Existing tool ID, host tokens, script-failure fallback and application code remain unchanged. The three release files are copied verbatim from the Portal immutable release. Their source commit and file hashes are recorded in nav.lock.json.

Contract: catalog schemaVersion 1, automatic connection-time request to https://econds.github.io/ro_tools_portal/catalog/v1/tools.json, immediate bundled fallback, 1500 ms deadline, 256 KiB and 500 tools maximum, cache revalidation, no credentials/redirects. HTTPS econds.github.io repository-root URLs only; no port, credentials, query, fragment, escapes or dot segments. Unknown current IDs initialize safely and resolve from the central catalog. Search and bounded scrolling preserve compact navigation.

Verification: `npm test` retains historical byte guards and adds raw candidate/old-release/application-byte assertions. `node qa/nav200/browser.cjs` uses the unchanged installed bundle to test central addition/rename/removal/order, unknown identity, 120 tools, search/focus/mobile, malicious raw URLs, invalid schema/JSON/duplicates/size, offline and timeout. Existing calculator/persistence/theme/keyboard regressions and first-run browser comparisons run in the dedicated read-only feature-branch PR workflow. Every browser runner mocks the exact endpoint before navigation; no production catalog is needed for deterministic tests.

Migration: review and publish the Portal catalog/release first, then approve this child PR and independently publish using the existing workflow. No Pages settings change is needed. Later catalog-only updates need only the Portal publication, never a child rebuild.

Rollback: change the module path back to `./assets/ro-suite/1.5.1/nav.js` and revert the v2-only tests/workflow as part of reverting this commit. Retain all release directories. This restores the frozen catalog behavior without changing saved data or formulas. No merge or deployment is performed by this change.
