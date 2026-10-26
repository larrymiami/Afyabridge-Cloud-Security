# Baseline review — 2026-10-26

## Scope and source revision

Review of `main` at `5e799fa06357784f433a0590fc88d5530706f241` before resuming foundation live validation. This review does not deploy or modify Google Cloud resources, merge dependency upgrades, or change the publication boundary.

The latest main-branch push runs were Application baseline [31610706595](https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/31610706595), Security gates [31610706980](https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/31610706980), and Supply chain [31610706662](https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/31610706662). All succeeded on 2026-08-12. They are historical evidence, not a fresh October security verdict.

## Milestone reconciliation

- v0.10D was merged in PR #27 on 2026-08-07, merge commit `6aa1ab8eec03787bfa5b4df221dd11fa3fae0ac7`. Its repository reporting work is no longer awaiting review.
- v0.7 and v0.10 remain **In progress** because their broader live-validation requirements remain open. Repository implementation completion does not close those milestones.
- v0.7H–L remain the recorded live bootstrap/federation boundary. v0.11 and v0.12 remain planned.

## Baseline defects and corrections

1. Supply-chain governance rejected the federation workflows' YAML-folded `terraform init` commands: its line-based matching could not see `-lockfile=readonly` on a later source line. Move the existing flag onto the command's first source line without changing the executed shell command. Add three negative cases proving that removing the flag from the PR plan, apply-plan, or apply-execution initialization still fails validation.
2. Static Terraform CI used 1.15.5 while `.terraform-version` and both federation workflows used 1.15.8. Align static CI with 1.15.8; keep Google provider versions and lockfiles unchanged.
3. Authentication and authorization had existing Vitest tests but no workspace test scripts or local Vitest dependency. Wire them into `pnpm test`, reusing locked Vitest 3.2.7; add their and audit's missing standard lint/typecheck scripts so recursive checks cover all workspace packages.
4. The web lint script invoked unsupported `next lint`. Use the repository's existing TypeScript-based lint convention (`tsc --noEmit`). This is not an ESLint/style-analysis claim. Run workspace lint in Application baseline CI as well.
5. Ignore generated workspace `dist` output; do not commit generated build files.

## Local verification

Tools: Node 22.23.1, pnpm 10.14.0, checksum-verified Terraform 1.15.8. Dependency installation uses the frozen lockfile. The lockfile change only adds references to the already locked Vitest version for auth and authorization; no resolved dependency upgrade is included.

| Check | Result and boundary |
|---|---|
| Frozen dependency installation | PASS |
| Workspace lint and typecheck | PASS; TypeScript-based checks |
| Non-database application tests | PASS: 21 tests across auth, authorization, sync, worker, and web |
| Application production build | PASS |
| API contract | PASS: 4 operations / 4 paths |
| Posture/governance scenario suites | PASS: 189 scenarios before supply-chain tests |
| Supply-chain identity, governance, revocation | PASS after command-format correction |
| Supply-chain compromise scenarios | PASS: 20, including 3 new federation lockfile cases |
| Repository posture evaluation | PASS: 11/11 rules; all 11 still require live validation |
| Posture reporting | PASS; zero operational findings and empty committed history; `insufficient-history/repository-evidence` |
| Terraform recursive formatting | PASS |
| Backend-free, read-only Terraform init | PASS across all seven roots |
| Terraform provider validation | BLOCKED locally: provider startup reports `listen unix ... socket: operation not permitted`. Requires CI; not recorded as a configuration pass |
| PostgreSQL integration / full recursive test command | BLOCKED locally: no PostgreSQL service or Docker available. Requires Application baseline CI |
| Container build / vulnerability scan, CodeQL, OPA, signing | Not rerun locally; require their dedicated CI paths. PR signing must stay skipped |
| Current package audit | FAIL; registry audit reports 7 critical, 8 high, 11 moderate, 2 low vulnerability entries. These are package advisory results, not proof of application exploitability |

The aggregate posture PASS describes governed repository desired-state only. It does not override a failing dependency/security verdict.

## Dependency pull-request triage

There are 14 open dependency PRs at review time. Results below are the latest available checks for each fetched head, which may predate this review. None is approved for merge by this review.

| Priority | PRs | Finding and next action |
|---|---|---|
| 1 | #57 — compatible npm updates | Package scan and application validation passed in its recorded run, but container scan failed. Refresh against the current baseline, audit the resulting lockfile, and remediate both package and image findings before merge. A historical passing package scan is not a current clean bill of health |
| 1 | #81 — Node 26 container | Build fails at `corepack enable`: `corepack` is absent. Rebuild a deliberately reviewed runtime update with explicit package-manager provisioning and matching CI/runtime versions; do not use this PR as an automatic image vulnerability fix |
| 2 | #78 — compatible Actions updates | SHA pins are retained; available security verdict fails through package/container scans. Rebase after baseline/security remediation and rerun the complete verdict and artifact-flow checks |
| 2 | #22 — checkout major | Changes only the two remaining supply-chain checkouts from v6 to v7.0.1; other workflows already use v7.0.1. Recorded checks pass, but rebase and obtain a fresh complete verdict before merge |
| 3 | #82, #69–74 — Google provider 8.x | Seven root upgrades are not a coordinated module migration. #71 logs show incompatible constraints `~> 7.41.0, ~> 8.3.0` between child modules and root; #69–74 Terraform validation fails. Bootstrap #82 validation passes, but that does not validate the other roots or live WIF behavior. Review one coordinated provider migration separately, preserving lockfile integrity and obtaining plans before any apply |
| 3 | #19 — TypeScript 7 | Recorded application typecheck fails with missing NodeJS/process types in config. Treat as a compiler migration with explicit type configuration, not a baseline prerequisite |
| 3 | #18 — Vitest 4 | Recorded checks pass on an older base. Refresh with newly wired auth/authorization tests, review current advisories and compatibility, and rerun full tests; historical green does not establish current safety |
| 3 | #45 — Node 26 type definitions | Changes type definitions without changing the Node 22 execution contract. Align with the chosen runtime migration; recorded package security verdict currently fails |

### Confirmed failure evidence

- #57 container scan [103877890760](https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/34813004040/job/103877890760): Alpine `libcrypto3` and `libssl3` HIGH findings, installed 3.5.7-r0, scanner-reported fix 3.5.8-r0. This is the historical scan observation, not an assertion about today's image contents.
- #71 Terraform validation [106239713327](https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/35570094269/job/106239713327): incompatible Google provider constraints in root and child modules.
- #81 supply-chain build [117925335255](https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/39211382235/job/117925335255): `/bin/sh: corepack: not found`.
- #19 application validation [92872733376](https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/31180611206/job/92872733376): TypeScript NodeJS/process type errors.

## Exit criteria before foundation live deployment

1. Review and merge the baseline corrections only after fresh required CI is understood; retain any failing security verdict as a blocker.
2. Remediate current package/container findings in a separate dependency change; keep severity gates, signing separation, and provider lockfile enforcement intact.
3. Obtain successful current Application baseline (including PostgreSQL tests), Terraform foundation, Security gate verdict, and PR-safe supply-chain checks.
4. Then begin foundation deployment readiness: GCP access/state inspection, organization prerequisites, reviewed scope, costs, and cleanup plan. No cloud apply is part of this review.
