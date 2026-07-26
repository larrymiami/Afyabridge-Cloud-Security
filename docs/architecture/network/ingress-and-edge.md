# Ingress and Edge Protection

## Purpose

This document defines how public and private requests enter AfyaBridge services. The edge must reduce exposure, terminate approved protocols, enforce transport protections, absorb common attacks, and prevent direct access to workload origins.

## Ingress principles

1. Public services are exposed through a managed edge, not directly from workload instances or connectors.
2. Only explicitly approved services may be internet reachable.
3. Origin services must reject paths that bypass the approved edge.
4. Authentication and authorization remain mandatory behind the edge.
5. Country and environment boundaries apply to ingress configuration and backends.
6. TLS is required for external application traffic.
7. Edge rules, certificates, DNS, and backend attachments are managed as code.
8. Administrative interfaces are not public application endpoints.

## Public edge pattern

The default public request path is:

```text
Client
  -> public DNS
  -> managed HTTPS load balancer
  -> web application firewall and rate controls
  -> approved serverless or private backend
  -> application authentication and authorization
  -> country-scoped data service
```

The edge may provide:

- TLS termination;
- HTTP-to-HTTPS redirection;
- managed certificate attachment;
- web application firewall rules;
- IP and geography-informed controls where justified;
- rate limiting and abuse protection;
- backend health evaluation;
- request logging and correlation identifiers;
- controlled routing to country or environment backends.

## Public endpoint classes

| Class | Examples | Exposure |
|---|---|---|
| Public application | CHW or facility web application, patient-facing services | Internet through managed HTTPS edge |
| Public API | Approved mobile or partner API | Internet through managed API/HTTPS edge with authentication |
| Webhook receiver | Payment, messaging, or referral callback | Narrow public path with sender validation and replay controls |
| Internal application | Administration, internal APIs, operations tools | Private or identity-aware access only |
| Health endpoint | Load-balancer health probes | Minimal response, no sensitive data, restricted path |

Each public endpoint requires an owner, data classification, threat assessment, authentication method, rate profile, backend, logging plan, and decommission process.

## Origin restrictions

A workload considered public must still prevent direct-origin access. Depending on the runtime, controls should include:

- ingress settings that accept traffic only from approved load-balancing or internal paths;
- authenticated invocation between the edge and private services where supported;
- no public IP addresses on private compute;
- firewall rules limited to required proxy and health-check sources;
- removal of default URLs from user-facing documentation and DNS;
- monitoring for successful requests that do not contain expected edge context;
- negative tests proving direct requests are denied.

An edge header alone is not a sufficient origin control because client-supplied headers can be forged.

## TLS and certificates

- TLS is mandatory for externally reachable HTTP services.
- Managed certificates are preferred where they meet operational requirements.
- Certificate ownership, renewal, expiry monitoring, and DNS validation must be documented.
- Weak protocol versions and obsolete cipher suites must not be intentionally enabled.
- Internal service encryption requirements are addressed separately from public TLS termination.
- Private keys must not be stored in source control or general-purpose CI variables.

## Web application firewall

The baseline rule set should cover:

- common injection and protocol abuse patterns;
- malicious scanners and known exploit traffic;
- request-size and method constraints;
- path-specific rate limits;
- credential-stuffing and authentication abuse signals;
- webhook-specific restrictions;
- temporary emergency blocks.

Rules begin in preview or observation mode when false-positive risk is material. Promotion to enforcement requires evidence from representative traffic and an approved rollback path.

## Rate limiting and abuse controls

Rate policies must be endpoint-aware. A single global threshold can harm low-bandwidth field users or fail to protect expensive operations.

Controls should distinguish:

- static content;
- login and token endpoints;
- search endpoints;
- file uploads;
- report generation;
- webhook callbacks;
- administrative actions;
- partner APIs.

Responses must avoid revealing whether an account, patient, facility, or record exists.

## Authentication at the edge

The edge may validate tokens or enforce identity-aware access for suitable endpoints, but application services remain responsible for final authorization.

Edge authentication must not become the only control for:

- country scope;
- programme or facility assignment;
- record-level access;
- privileged operations;
- workflow state;
- data classification decisions.

## Internal and administrative ingress

Internal tools should use private reachability or an identity-aware proxy pattern. They must not be exposed by relying only on an obscure hostname.

Administrative ingress requires:

- named workforce identity;
- strong authentication;
- approved group membership;
- device or context controls where available;
- temporary privilege for sensitive actions;
- centralized logging;
- no direct SSH or RDP exposure to the internet.

## Webhook ingress

Webhook endpoints require additional controls:

- provider-specific signature or message authentication validation;
- timestamp and replay-window checks;
- idempotency controls;
- strict content types and size limits;
- narrow path and method exposure;
- secret rotation;
- sender documentation;
- dead-letter and failure monitoring;
- no trust based solely on source IP where stronger validation exists.

## Country routing

A global edge may route traffic to country-specific backends, but it must not weaken country isolation.

Routing decisions must be based on an authoritative tenant or country association. Client-supplied country parameters are inputs to validate, not authorization facts.

A request must fail closed when the resolved country does not match the authenticated user, application tenant, backend, or data boundary.

## Logging and monitoring

Edge telemetry should include:

- request timestamp and correlation identifier;
- hostname, path template, method, and response class;
- backend service and country environment;
- WAF rule actions;
- rate-limit decisions;
- TLS and certificate failures;
- origin-bypass attempts;
- authentication outcome where processed at the edge;
- latency and backend health.

Sensitive query parameters, tokens, health information, and message bodies must not be logged by default.

## Change control

Ingress changes require:

1. documented endpoint and owner;
2. exposure classification;
3. threat and abuse review;
4. DNS, certificate, firewall, WAF, and backend plan;
5. test evidence;
6. rollback plan;
7. post-deployment verification.

Emergency rules must have an owner, incident reference, scope, and expiry or formal conversion into a permanent rule.

## Validation requirements

Tests must demonstrate that:

- HTTP is redirected or denied as designed;
- unsupported TLS paths fail;
- direct origin access is denied;
- private endpoints are not publicly reachable;
- WAF preview and enforcement behavior is observable;
- rate limits protect sensitive paths without blocking expected field workflows;
- webhook signatures and replay controls fail closed;
- a country mismatch cannot route to another production backend;
- edge logs exclude prohibited sensitive values.

## Status

**Designed.** No load balancer, WAF policy, rate control, certificate, DNS record, or origin restriction is represented as implemented until deployment and validation evidence exist.
