# Application Boundaries

## Purpose

This document defines the security boundaries that application code must preserve. It translates the identity, network and data-protection architecture into enforceable application responsibilities.

## Primary trust boundaries

| Boundary | Untrusted side | Trusted side | Required enforcement |
|---|---|---|---|
| Browser to web application | browser state, parameters, cookies, uploaded content | server request handler | authentication, CSRF and origin checks, validation, authorization, rate limits |
| Public edge to application origin | internet and forwarded headers | verified platform request context | managed edge restriction, trusted proxy handling, no client-controlled identity headers |
| Session to actor context | session token and claims | normalized authenticated actor | issuer, audience, expiry and revocation validation |
| Actor to country scope | requested country or resource identifier | authorized country context | server-derived scope and deny-on-mismatch |
| Application to database | application parameters and dynamic filters | parameterized country-scoped query | least-privilege database identity and mandatory scope predicates |
| Online application to sync worker | device changes and replayable messages | validated sync operation | device identity, sequence checks, authorization and conflict handling |
| Application to external partner | outbound request and partner response | normalized integration event | allowlisted destination, workload identity or secret, schema validation and audit |
| Application to audit pipeline | security event attributes | append-only audit record | minimization, integrity, delivery monitoring and Restricted-data exclusion |

## Country boundary

Kenya, Ghana and South Africa are independent production authorization domains.

Application code must:

1. derive the actor's permitted country from verified identity and assignment data;
2. reject country selection supplied only by the client;
3. encode or associate every country-owned record with an authoritative country value;
4. include country scope in repository and service method contracts;
5. deny reads, writes, exports and sync operations when actor and record countries differ;
6. record denied cross-country attempts as security events;
7. avoid shared caches whose keys omit country scope.

Country isolation must be enforced even when network or project isolation also exists.

## Programme, facility and assignment boundaries

Country membership alone is insufficient for access to patient, household, referral or follow-up records.

Authorization decisions also evaluate:

- programme membership;
- facility responsibility;
- active geographic or caseload assignment;
- role and permitted action;
- record status and sensitivity;
- emergency or delegated-access state;
- purpose and workflow context where required.

These attributes are evaluated server-side. UI visibility is not an authorization control.

## Package boundaries

### `apps/web`

May coordinate requests and render responses. It must not define ad hoc authorization rules or read environment variables throughout the codebase.

### `packages/config`

Owns runtime configuration parsing. It returns validated, typed values and must not log secret values.

### `packages/shared`

Owns stable domain types without infrastructure access. It must not import application frameworks or database clients.

### `packages/database`

Owns database connectivity and later repository implementations. Business handlers must not create independent database clients.

### Planned security packages

- `auth` verifies identities and creates actor contexts.
- `authorization` evaluates policies and returns explicit permit or denial results.
- `audit` emits normalized append-only security events.
- `security` provides validation, identifiers, redaction, rate-limit and replay helpers.

## Data-transfer objects

External request objects are not domain entities. Each boundary performs an explicit conversion:

```text
untrusted request
  -> schema validation
  -> normalized command
  -> authenticated actor
  -> authorization decision
  -> domain operation
  -> minimized response
  -> audit event
```

Unknown fields are rejected for security-sensitive commands unless compatibility requirements explicitly permit them.

## Failure behaviour

- Missing identity returns an authentication failure.
- Valid identity without permission returns a generic authorization denial.
- Invalid identifiers and malformed input return bounded validation errors.
- Existence of an inaccessible Restricted record is not disclosed.
- Dependency failures do not return credentials, queries, stack traces or record content.
- Authorization infrastructure failure defaults to denial.
- Audit delivery failure follows the operation-specific fail-open or fail-closed policy; high-risk administrative actions fail closed.

## Prohibited patterns

- trusting country, role or user identifiers from request headers without verified platform mediation;
- filtering unauthorized records only after fetching them;
- database methods that return cross-country collections without an explicit approved use case;
- direct database clients in route handlers;
- authorization rules duplicated independently across UI and API layers;
- logging request bodies containing health or identity data;
- using production data for local development or automated tests;
- treating possession of an offline record as continuing authorization.

## Verification expectations

Implementation evidence will include:

- cross-country denial tests;
- programme and assignment-scope tests;
- inaccessible-record non-disclosure tests;
- configuration and error-redaction tests;
- repository-contract tests requiring country scope;
- replay and revoked-device sync tests;
- audit-event completeness and minimization tests.

## Status

The boundaries are **Designed**. The package separation and country-aware types are partially implemented; authentication, authorization, audit and business-operation enforcement remain to be implemented and tested.
