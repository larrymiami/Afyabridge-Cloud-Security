# Application Security Test Plan

## Status

**Implemented, validation pending CI execution**

## Purpose

This plan defines the minimum evidence required before the v0.6 application-security baseline can be described as validated.

## Validation layers

| Layer | Evidence required |
|---|---|
| Static correctness | strict TypeScript checks and successful production build |
| Authentication | malformed, absent, cross-country, and wrong-actor contexts rejected |
| Authorization | role, country, programme, facility, and assignment denials tested |
| Database isolation | country constraints and scope predicates exercised against PostgreSQL |
| Input validation | malformed identifiers, unsupported operations, invalid versions, and timestamps rejected |
| Error handling | generic responses, stable codes, and no sensitive details |
| Offline sync | device binding, replay resistance, idempotency, timestamp windows, and conflicts |
| Migrations | clean database migration from an empty PostgreSQL service |
| Synthetic data | deterministic Kenya, Ghana, and South Africa fixtures only |
| Build | production application and worker builds complete successfully |

## Required CI sequence

1. Start an isolated PostgreSQL service.
2. Install dependencies from the repository workspace.
3. Apply every migration in lexical order.
4. Record applied migrations in `schema_migrations`.
5. Seed synthetic country-scoped fixtures.
6. Run strict type checking.
7. Run unit and integration tests.
8. Build all applications and packages.

A later step must not run when an earlier security gate fails.

## Required negative scenarios

- missing or malformed actor context;
- actor scope containing another country's identifier;
- unsupported role;
- cross-country household access;
- programme, facility, or assignment mismatch;
- database insert with mismatched country-prefixed identifiers;
- stale optimistic-concurrency version;
- duplicate sync operation;
- invalid device binding;
- revoked device;
- future or expired offline operation;
- unsupported sync entity or action;
- unexpected exception containing sensitive internal text.

## Data requirements

Tests use synthetic records only. Fixtures must:

- be visibly labelled synthetic;
- use country-prefixed identifiers;
- avoid real names, phone numbers, clinical details, addresses, or identifiers;
- be deterministic and safe to recreate;
- remain isolated from production services and credentials.

## Evidence outputs

For each pull request, retain:

- workflow run URL and commit SHA;
- job and step outcomes;
- test output and failure details;
- migration and seed output;
- production build result;
- reviewed exceptions or skipped tests;
- remediation and successful rerun evidence where a gate initially fails.

## Exit criteria

The v0.6 milestone may move from **Implemented** to **Validated in CI** only when:

- the workflow completes successfully on the pull-request head commit;
- no required test is skipped without an approved exception;
- migrations succeed from a clean database;
- synthetic seeding succeeds;
- all negative security tests pass;
- all packages type-check;
- production builds complete;
- the resulting evidence is linked from the pull request.

Successful CI does not prove production deployment or operational effectiveness. Those states belong to later infrastructure, deployment, and runtime-validation milestones.
