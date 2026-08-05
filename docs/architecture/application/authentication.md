# Application Authentication

## Status

**Implemented but not yet validated**

## Purpose

This document defines how the v0.6 application converts an upstream authenticated identity into a server-side `AuthenticatedActor` context. Authentication establishes who or what is calling; it does not grant access to a household, patient, referral, programme, facility, or country.

## Current baseline

The application expects an upstream trusted identity layer to authenticate the caller and provide a signed or otherwise integrity-protected actor assertion. The local baseline parses the assertion into:

- actor identifier;
- actor type: workforce or workload;
- assigned roles;
- country;
- programme;
- optional facility;
- assignment identifiers.

The parser rejects malformed assertions and rejects any scope identifier whose country prefix does not match the asserted country.

## Trust boundary

The current `x-afyabridge-actor` header is an integration seam for local development. It is **not** safe when accepted directly from an untrusted client. A deployed environment must ensure that:

1. the public edge removes client-supplied copies of identity headers;
2. a trusted authentication component creates the actor assertion;
3. the assertion is signed, encrypted, or delivered through a trusted authenticated channel;
4. the web application verifies issuer, audience, expiry, and integrity;
5. the original subject and authentication context remain auditable.

## Failure behaviour

- Missing or malformed actor context returns `401`.
- Cross-country identifiers inside the actor scope return `401`.
- Authentication errors do not disclose parsing details to the caller.
- Responses containing actor or session information use `Cache-Control: no-store`.

## Session endpoint

`GET /api/session` returns only the minimum actor context required by the client. It does not return credentials, token material, identity-provider claims, or unrestricted entitlements.

## Prohibited patterns

- Trusting browser-created identity headers
- Treating a role claim as sufficient authorization
- Accepting country or programme scope from request bodies without comparison to the actor context
- Long-lived bearer tokens in browser storage
- Logging raw identity tokens or authentication assertions
- Allowing workload identities to use workforce-only application actions

## Validation evidence required

- tests for missing, malformed, expired, and tampered assertions;
- tests for mismatched country prefixes;
- verification that the edge removes spoofed identity headers;
- issuer and audience validation tests for the selected identity provider;
- session fixation and logout tests;
- audit evidence for successful and failed authentication.
