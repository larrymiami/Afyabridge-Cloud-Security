# Authorization Enforcement

## Status

**Implemented but not yet validated**

## Purpose

Authorization determines whether an authenticated actor may perform a specific action against a specific resource. All decisions are server-side, deny by default, and evaluated using both role permissions and resource scope.

## Decision inputs

The baseline policy evaluates:

- actor type and roles;
- requested action;
- actor country and resource country;
- actor programme and resource programme;
- optional facility scope;
- optional assignment scope.

A matching role alone is insufficient. Country and programme must match, and narrower facility or assignment boundaries are enforced when present.

## Policy package

`@afyabridge/authorization` owns reusable policy decisions. Route handlers supply normalized actor and resource attributes, call the policy function, and require an allowed decision before performing a protected operation.

The policy returns an internal reason code for audit and testing. Public responses use a generic denial message so callers cannot enumerate valid scopes or records.

## Household creation

`POST /api/households` demonstrates the first protected operation:

1. authenticate the actor;
2. validate the request body;
3. construct the proposed household scope;
4. evaluate `household:create`;
5. deny on role, country, programme, facility, or assignment mismatch;
6. create a country-prefixed identifier only after authorization;
7. record success, denial, or failure in the audit stream.

The endpoint currently returns `persistenceStatus: not_yet_persisted`; database persistence is intentionally deferred until schema, row-level constraints, and transaction-bound audit behaviour are implemented.

## Enforcement rules

- Every protected route performs authorization after authentication and validation.
- Country scope is derived from the authenticated actor and compared with the resource.
- Client-supplied scope never widens actor access.
- Queries must include authorized country and programme predicates.
- Record-not-found and record-not-authorized behaviour must avoid enumeration.
- Background workloads use workload-specific actions and scopes.
- Administrative roles remain scoped; no role implies unrestricted cross-country access.

## Prohibited patterns

- UI-only authorization
- Role-only checks without resource scope
- Fetching a record first and checking country later when the query can be scoped
- Accepting arbitrary country-prefixed IDs without verifying the prefix and ownership
- Reusing workforce policies for partner or workload identities
- Returning policy reason codes to untrusted callers
- Silently bypassing authorization for support or troubleshooting

## Validation evidence required

- allow and deny tests for every role/action pair;
- cross-country and cross-programme denial tests;
- facility and assignment mismatch tests;
- object-level authorization tests;
- query-level scope tests once persistence exists;
- negative tests for omitted attributes and unsupported actions;
- audit correlation for allowed and denied decisions.
