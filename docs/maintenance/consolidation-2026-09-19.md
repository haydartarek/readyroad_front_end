# Frontend consolidation — 2026-09-19

`main` at `cd164e4b0ef33f8bf389a43b8e8172aad1432af7` is the application baseline, including Stripe. Application code and dependency versions remain unchanged.

## Decisions

- Removed two archived old worktrees and ten non-main local branches. Main is the only active local branch/worktree.
- Preserved the complete UI stash and its untracked parent in a verified bundle before removing the stash entry.
- Older removal of traffic-sign filters/counts and lesson guidance is archived, not adopted as a cleanup change. Current features remain intact.
- Editorial accessibility work and old SEO/admin/mobile branch changes are integrated or superseded by newer main.
- Historical pre-repair `.bak` editor/markdown/Arabic translation files were archived outside executable source paths.
- All checked web/mobile runtime dependencies have current uses; React DOM is a required React/Next runtime dependency. No packages were removed on guesswork.
- Removed 12 remote branches proven to be ancestors of origin/main and unrelated to open PRs. Other remote branches remain pending explicit approval because some back open PRs or are not literal ancestors. PR #14 is an ancestor of main; #10 is implemented in newer main; #7's old workflow is superseded by Deploy Production. Exact branch SHA guards and classifications are in the private archive.

## Test maintenance

- Payment mocks now return a complete typed Axios response, fixing TypeScript validation without casts or application changes.
- Protected layout audits wait for the mocked session response and the authenticated account control, rather than measuring the loading shell and navigating away during session resolution.
- Result-review alignment reads both DOM rectangles in one browser frame, so smooth scrolling cannot distort separate measurements. Existing geometry tolerances and timeouts are unchanged.
- Web CI exposed an unstable translation-function mock in the admin-user page test: every render recreated `t`, retriggering the fetch effect. The mock now matches the provider's stable callback, with an assertion that the initial list and summary are fetched exactly once. Its targeted CI/coverage rerun passed both cases.

## Recovery archive

The private archive is `worktree-rescue-20260919/verified-snapshot`, next to the two repositories, not inside either checkout. Its README describes recovery commands; `*-refs.txt`, `inventory.json`, `stash-inventory.json` and `remote-branch-decisions.json` preserve the exact original state and decisions. Keep this archive: not every old proposal was adopted into main. Do not publish its patches or diagnostic logs.

The Git bundles were verified before removing local worktrees, branches and stashes. Changed/untracked worktree files and old ignored source backups were copied and SHA-256 checked. Active `.env` files were left in place and unchanged.

## Release boundary

This consolidation prepares main for future work. It does not authorize a production deployment. Its paired commit messages use `Release-Pair: consolidation-20260919`; the existing Deploy Production workflow skips automatic deployment for this marker. No deployment workflow is dispatched.

## Bundle checksums (SHA-256)

- `readyroad_front_end.bundle`: `5cfcf05147fc14f8cc366c5a6f6a08d41b186aed0c64eedff46e7eb780c3c42d`
- `readyroad_front_end-stashes.bundle`: `2de9ddc031abad852122094d0f7816a2c7b51778070416d4c85affec13fe58b2`

## Validation

- Jest: 95 suites, 607 tests passed; the changed payment test also passed its targeted rerun.
- TypeScript and ESLint: passed after the final test edits.
- Local Next production build: passed as part of Playwright setup.
- Full Playwright run: 193 passed, 2 failed, 3 conditional live-local cases skipped. After fixing the two test synchronization issues, all 14 affected cases passed with traces: 195 unique configured cases now pass. The remaining three require the running local stack/Admin credentials and real performance evidence; they are not claimed as executed.
- Flutter 3.38.5 (matching CI): 9 tests passed; analyzer and formatting passed in an isolated local container using tracked source and the existing lockfile.

Reports and traces are retained outside the repository under `worktree-rescue-20260919/final-validation`.
