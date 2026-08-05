# Error Handling

## Status

Implemented in the v0.6 baseline where explicitly referenced, but not yet validated in CI or a deployed environment.

## Objectives

Application failures must preserve confidentiality, produce actionable operational evidence, and fail closed when identity, authorization, validation, persistence, or synchronization state is uncertain.

## Response model

Public API responses use a stable envelope:

```json
{
  "error": {
    "code": "ACCESS_DENIED",
    "message": "The request was not authorized"
  }
}
```

Responses must not disclose:

- whether an inaccessible record exists;
- database names, table names, queries, or constraint details;
- stack traces or source paths;
- authentication assertion contents;
- authorization scopes or policy internals;
- secrets, tokens, payloads, or health data;
- partner credentials or upstream response bodies.

## Status-code rules

| Condition | Response |
|---|---|
| Missing or invalid trusted identity context | `401` |
| Authenticated actor lacks permission | `403` |
| Resource missing or inaccessible where enumeration is a risk | generic `404` |
| Structurally invalid request | `400` |
| Optimistic-concurrency conflict | `409` |
| Accepted asynchronous operation | `202` |
| Rate or abuse limit reached | `429` |
| Unexpected internal failure | generic `500` |
| Temporary dependency failure | controlled `503` where retry is safe |

## Internal error taxonomy

Internal errors should carry a stable code, severity, retry classification, request identifier, and safe metadata. Error objects must not require sensitive payloads to support investigation.

Recommended categories:

- `AUTHENTICATION_REQUIRED`
- `ACCESS_DENIED`
- `VALIDATION_FAILED`
- `RESOURCE_NOT_FOUND`
- `VERSION_CONFLICT`
- `REPLAY_REJECTED`
- `DEVICE_REVOKED`
- `DEPENDENCY_UNAVAILABLE`
- `INTERNAL_ERROR`

## Fail-closed behavior

The application denies or defers the operation when:

- actor context cannot be verified;
- country or programme scope is ambiguous;
- authorization policy cannot produce a decision;
- the database transaction outcome is unknown;
- a sync operation cannot prove idempotency;
- expected record version does not match;
- required audit evidence cannot be produced for a high-risk action.

Unknown completion after a timeout must not be treated as failure and blindly retried. Callers use idempotency identifiers to recover a stable result.

## Logging and correlation

Every failure should be correlated using a request or operation identifier. Operational logs contain safe error codes and control decisions, while audit events record security-relevant outcomes. Restricted payloads and plaintext credentials are excluded.

## Dependency failures

Dependency errors are translated at the boundary. Raw PostgreSQL, identity-provider, storage, or partner errors do not cross into client responses. Retry guidance is provided only for idempotent operations and uses bounded exponential backoff with jitter.

## Validation evidence

Before this control is marked validated, evidence must include:

- tests for generic unauthorized and not-found responses;
- tests proving stack traces and database errors are absent;
- optimistic-concurrency conflict tests;
- idempotent timeout and retry tests;
- request-ID propagation tests;
- production configuration proving detailed errors are disabled.
