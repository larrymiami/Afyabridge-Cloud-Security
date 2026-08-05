# Application Input Validation

## Status

Implemented at selected v0.6 boundaries, but not yet fully validated.

## Validation model

All external input is untrusted, including browser requests, identity assertions, route parameters, partner payloads, offline-sync batches, database-derived free text, and configuration values.

Validation occurs before authorization-sensitive processing and before persistence.

## Required controls

- Parse structured input with explicit schemas.
- Reject unknown or malformed country identifiers.
- Enforce country prefixes on scoped identifiers.
- Apply length and character limits before persistence.
- Reject unexpected fields where the endpoint contract requires a closed schema.
- Normalize only where normalization cannot change security meaning.
- Validate route parameters independently of request bodies.
- Use parameterized database queries.
- Return generic client errors without echoing rejected Restricted content.
- Record non-sensitive validation-failure metadata for monitoring.

## Household boundary

Household operations require:

- a supported country;
- matching country prefixes for programme, facility, assignment, and household identifiers;
- a display name between 1 and 120 characters;
- an authenticated actor with a matching server-derived scope;
- a repository query that repeats country, programme, facility, and assignment predicates.

Database constraints provide a second enforcement layer and prevent mismatched country prefixes even if an application defect bypasses request validation.

## File and offline inputs

Future file uploads and offline batches require size limits, content-type verification, malware controls where applicable, item-count limits, replay identifiers, version checks, and per-item authorization. A valid batch envelope must never imply that every item in the batch is authorized.

## Error behavior

Validation failures return a generic `400` response. Cross-country identifiers presented to resource lookup endpoints should normally return `404` to avoid confirming that a foreign resource exists. Authentication and authorization failures remain `401` and `403` without exposing internal policy details.

## Validation evidence

Completion requires tests for malformed payloads, oversized values, unknown fields, cross-country identifiers, unassigned resources, SQL metacharacters, duplicate requests, and safe error responses. Deployed evidence is required before this control is marked validated.
