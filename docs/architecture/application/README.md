# Application Security Baseline

## Purpose

This section defines and implements the first application-security baseline for AfyaBridge. It connects the architecture produced in v0.1 through v0.5 to a minimal community-health application that uses synthetic data only.

The baseline demonstrates country-aware authentication context, server-side authorization, durable scoped persistence, structured audit events, replay-resistant offline synchronization, optimistic concurrency, safe error handling, and automated security validation.

## Control states

| State | Meaning |
|---|---|
| **Designed** | Requirements, boundaries, and expected behavior are documented. |
| **Implemented** | Application code, configuration, migrations, or tests exist. |
| **Validated** | Repeatable automated or manual evidence demonstrates the expected behavior. |

A committed test or workflow is not itself validation evidence. Validation requires a successful execution against the reviewed revision.

## Implemented components

| Component | Responsibility | Current state |
|---|---|---|
| Web application | Health, session, household creation, and scoped household retrieval APIs | Implemented; validation pending |
| Sync worker | Validates and processes device-bound offline operations | Implemented; validation pending |
| Configuration package | Runtime environment contract and startup validation | Implemented; validation pending |
| Shared package | Country-aware identifiers, actors, and request scopes | Implemented; validation pending |
| Authentication package | Parses trusted actor assertions and rejects malformed or cross-country scope | Implemented; validation pending |
| Authorization package | Role, country, programme, facility, assignment, and action policy decisions | Implemented; validation pending |
| Audit package | Structured security-event construction and sensitive-field controls | Implemented; validation pending |
| Database package | PostgreSQL boundary, migrations, scoped repositories, and conditional mutations | Implemented; validation pending |
| Sync package | Schema validation, device binding, replay controls, and conflict decisions | Implemented; validation pending |
| CI workflow | Clean database, migrations, synthetic seed, type checks, tests, and build | Implemented; first successful run pending |

## Security principles

- Only synthetic data is permitted in repository fixtures and local validation.
- Authentication and authorization are separate controls.
- Client-supplied identity headers are a local integration seam, not a production trust mechanism.
- Every sensitive server operation receives an explicit actor and request scope.
- Country is a mandatory authorization boundary, not a presentation-layer filter.
- Programme, facility, assignment, action, and record scope are enforced server-side.
- Database reads and writes repeat applicable authorization predicates.
- Configuration is validated before use, and secrets are never committed.
- Health and error responses expose no credentials, SQL, stack traces, Restricted data, or authorization reasoning.
- Sensitive actions produce structured, correlated audit events.
- Offline operations are untrusted input and require independent device, actor, scope, sequence, timestamp, and version validation.
- Duplicate operations receive stable idempotent outcomes.
- Concurrent writes require an expected version; unsafe last-write-wins behavior is not accepted.
- Development-only CSP allowances are excluded from the production policy.

## Repository layout

```text
apps/
  web/
  sync-worker/
packages/
  audit/
  auth/
  authorization/
  config/
  database/
  shared/
  sync/
scripts/
  run-migrations.mjs
  seed-synthetic-data.mjs
```

## Implemented application controls

1. Strict TypeScript compiler settings and deterministic workspace dependencies.
2. Runtime environment validation with server-only database configuration.
3. Country-aware identifiers, authenticated actors, and request scopes.
4. Loopback-only local PostgreSQL exposure.
5. Database constraints for country-prefixed scope identifiers.
6. Parameterized repository queries carrying country and programme scope.
7. Deny-by-default authorization decisions.
8. Generic, non-enumerating authentication and authorization failures.
9. Structured audit-event fields with sensitive-content exclusions.
10. Validated household creation and scoped retrieval APIs.
11. Household versioning and conditional mutations.
12. Device-bound offline operations with monotonically increasing sequence numbers.
13. Operation idempotency, payload hashing, timestamp windows, and conflict states.
14. Safe browser headers with development- and production-specific CSP behavior.
15. Clean-database migration, synthetic-seed, test, type-check, and build workflow.

## Architecture documents

| Document | Purpose |
|---|---|
| [`application-boundaries.md`](./application-boundaries.md) | Application components, trust boundaries, ownership, and prohibited coupling |
| [`authentication.md`](./authentication.md) | Authenticated actor assertions, trust assumptions, and failure behavior |
| [`authorization-enforcement.md`](./authorization-enforcement.md) | Policy evaluation and enforcement at API and persistence boundaries |
| [`input-validation.md`](./input-validation.md) | Request, identifier, batch, and database validation |
| [`audit-logging.md`](./audit-logging.md) | Security-event structure, prohibited fields, integrity, and failure handling |
| [`offline-sync-security.md`](./offline-sync-security.md) | Device binding, replay resistance, idempotency, conflicts, and local-data assumptions |
| [`error-handling.md`](./error-handling.md) | Safe client responses, internal error translation, and fail-closed behavior |
| [`abuse-protection.md`](./abuse-protection.md) | Request limits, throttling dimensions, batch limits, and abuse detections |

## Diagrams

- [`../diagrams/application-flow.md`](../diagrams/application-flow.md)
- [`../diagrams/authorization-flow.md`](../diagrams/authorization-flow.md)
- [`../diagrams/offline-sync-flow.md`](../diagrams/offline-sync-flow.md)

## Validation

The validation workflow is defined in `.github/workflows/application-baseline.yml` and is expected to:

1. start an isolated PostgreSQL service;
2. install dependencies from the committed lockfile;
3. apply migrations to a clean database;
4. seed synthetic records for Kenya, Ghana, and South Africa;
5. run strict type checks;
6. execute unit, boundary, and integration tests; and
7. build the applications and packages.

The detailed test scope and evidence requirements are recorded in [`../../testing/application-security-test-plan.md`](../../testing/application-security-test-plan.md).

## Known boundary

The current `x-afyabridge-actor` request header exists only to exercise downstream authentication and authorization controls locally. A production deployment must replace it with a trusted, integrity-protected identity assertion created by the deployed authentication layer or trusted edge. Direct client control of this header is prohibited.

Patient and referral workflows remain outside this minimal implementation package and must not be represented as implemented.

## Status

The v0.6 application-security baseline is **Implemented and in review**. Controls remain **not validated** until the GitHub Actions workflow completes successfully for the reviewed pull-request revision and its evidence is inspected.