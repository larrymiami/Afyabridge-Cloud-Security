# Application Security Baseline

## Purpose

This section defines and implements the first application security baseline for AfyaBridge. It connects the architecture produced in v0.1 through v0.5 to a small community-health application using synthetic data only.

## Control state

The v0.6 milestone introduces two control states:

- **Designed** — documented requirements and boundaries exist.
- **Implemented** — application code or configuration exists and can be tested.

A control is not considered validated until automated or repeatable evidence demonstrates the expected behaviour.

## Baseline services

| Component | Responsibility | Initial state |
|---|---|---|
| Web application | Community-health worker and operations interface | Implemented skeleton |
| Configuration package | Startup validation and environment contract | Implemented |
| Shared package | Country-aware domain and request-scope types | Implemented |
| Database package | Controlled PostgreSQL connection boundary | Implemented skeleton |
| Authentication package | Identity verification and session establishment | Planned |
| Authorization package | Country, programme, facility, assignment and record enforcement | Planned |
| Audit package | Structured sensitive-action events | Planned |
| Sync worker | Offline change validation and reconciliation | Planned |

## Security principles

- Synthetic data only is permitted in the repository and local fixtures.
- Authentication and authorization are separate controls.
- Every sensitive server operation receives an explicit actor and request scope.
- Country is a mandatory authorization boundary, not a UI filter.
- Record access is checked server-side at the point of use.
- Database queries must carry or derive country scope.
- Configuration is validated at startup and secrets are never committed.
- Health endpoints expose minimal operational metadata and no secrets or dependency details.
- Errors returned to clients do not contain stack traces, SQL, tokens, or Restricted data.
- Security-relevant actions produce structured audit events.
- Offline sync is treated as untrusted input and is independently authorized.

## Repository layout

```text
apps/
  web/
  sync-worker/                 # planned
packages/
  auth/                        # planned
  authorization/               # planned
  audit/                       # planned
  config/
  database/
  security/                    # planned
  shared/
```

## Initial implemented controls

1. Strict TypeScript compiler settings.
2. Runtime environment validation.
3. Country-aware identifiers and request-scope types.
4. Loopback-only local PostgreSQL exposure.
5. Minimal health response with cache prevention.
6. Baseline browser security headers.
7. Separation of configuration, shared domain, database and web packages.

## Evidence required

The initial package is not considered validated until the repository can demonstrate:

- deterministic dependency installation;
- successful type checking and production build;
- environment validation failures for missing or invalid values;
- health endpoint response and header tests;
- database connectivity without credential disclosure;
- checks preventing committed secrets and real patient data.

## Planned documents

- [`application-boundaries.md`](./application-boundaries.md)
- `authentication.md`
- `authorization-enforcement.md`
- `session-and-token-security.md`
- `input-validation.md`
- `audit-logging.md`
- `offline-sync-security.md`
- `error-handling.md`
- `abuse-protection.md`

## Status

The application foundation is **Implemented but not yet validated**. Authentication, authorization, audit logging, business workflows and offline synchronization remain planned.
