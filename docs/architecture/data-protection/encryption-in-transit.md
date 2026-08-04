# Encryption in Transit

## Purpose

This document defines how AfyaBridge protects data while it moves between users, devices, edge services, application workloads, managed services, administrative tools, third parties, and backup or analytics systems.

Encryption in transit is required across public, private, administrative, partner, and service-to-service paths. Private networking does not remove the requirement to authenticate endpoints or protect sensitive payloads.

## Design principles

- Restricted and Confidential data must not traverse plaintext protocols.
- Public application traffic terminates over HTTPS at the managed edge.
- Workload-to-workload requests require both encrypted transport and authenticated service identity.
- Country production traffic remains country-scoped unless an approved cross-border flow exists.
- Certificate validation must not be disabled to resolve operational problems.
- Legacy protocols and weak cipher configurations are prohibited.
- Sensitive message payloads are minimized even when transport is encrypted.
- Encryption state and peer identity must be observable and testable.

## Traffic classes

| Traffic class | Required protection |
|---|---|
| End user to public edge | HTTPS with valid public certificate, modern TLS, redirect or reject plaintext HTTP |
| Edge to application origin | Authenticated, encrypted origin connection with direct-origin restrictions |
| Workload to workload | HTTPS or supported authenticated encrypted channel using short-lived workload identity |
| Workload to managed database | Provider-supported encrypted connection with certificate and endpoint validation |
| Workload to object storage or Google APIs | HTTPS through approved private or public API path |
| Administrative access | Identity-aware encrypted session; no public plaintext management protocol |
| Partner API or webhook | HTTPS plus application-level request authentication and replay protection |
| Batch export or file transfer | Approved encrypted API or managed secure transfer mechanism |
| Device synchronization | HTTPS, authenticated device/user session, bounded retry and local queue protection |

## Public ingress

Public endpoints must:

- present certificates for approved AfyaBridge domains;
- reject invalid, expired, mismatched, or untrusted certificates;
- redirect or reject plaintext HTTP according to endpoint purpose;
- use managed TLS policy where supported;
- prohibit direct bypass of the managed edge;
- preserve enough connection metadata for security investigation without logging sensitive payloads.

Health checks and internal probes must not create an unauthenticated public data path.

## Origin protection

Traffic between the edge and application origin must use an encrypted and authenticated path supported by the chosen runtime and load-balancing design.

An origin is not considered protected merely because its hostname is undocumented. Controls must prevent direct internet invocation or require the same authentication and authorization as the public edge path.

## Service-to-service encryption

Internal services must use encrypted transport even inside the same VPC or managed platform.

Each service-to-service call must define:

- calling workload identity;
- receiving service identity or trusted endpoint;
- expected audience;
- protocol and port;
- authorization scope;
- timeout and retry policy;
- logging and trace-correlation requirements;
- handling of user context when present.

Bearer tokens or identity tokens must be short-lived and audience-restricted. A service must not accept a token issued for another service solely because the signature is valid.

## Database connections

Database clients must use the provider-supported encrypted connection mode. Client configuration must not silently fall back to plaintext.

Where certificate verification options are available, the implementation must validate the server endpoint and trust chain. Connection strings, client libraries, proxies, and sidecars must be tested to confirm the effective mode.

Database credentials and certificates must come from approved secret or identity systems, not source code or container images.

## Messaging and asynchronous traffic

Managed messaging services use encrypted service endpoints, but payload sensitivity still matters. Events should contain the minimum data needed by the consumer.

When a message leaves Google Cloud or crosses a partner boundary, the design must consider payload-level protection in addition to TLS, especially for delayed processing, third-party queues, or store-and-forward systems.

## Offline and mobile synchronization

Device sync must protect:

- authentication tokens;
- queued requests;
- conflict-resolution payloads;
- retry metadata;
- response caches;
- upload attachments.

The client must not accept invalid certificates or permit user-installed debugging proxies in production without explicit managed-device controls. Synchronization failures must not cause sensitive data to be transmitted through alternate insecure channels.

## Third-party integrations

TLS alone does not authenticate the business sender of a webhook or API request. Third-party flows must combine encrypted transport with one or more of:

- signed requests;
- mutual TLS where justified;
- OAuth or workload federation;
- short-lived API credentials;
- source allowlisting as a supporting control;
- timestamp and nonce validation;
- replay detection.

Partner certificate rotation and endpoint changes require controlled testing before production cutover.

## Administrative paths

Administrative access must use managed encrypted control planes, identity-aware proxies, or approved private-access tools.

The following are prohibited on public interfaces:

- plaintext database protocols;
- unencrypted remote shells;
- unsecured dashboards;
- direct cache administration;
- unauthenticated metrics endpoints;
- ad hoc file-transfer services.

## Certificate trust

Applications must use trusted certificate stores managed through supported platform mechanisms. Private certificate authorities may be used only where ownership, issuance, revocation, rotation, and trust distribution are defined.

Certificate pinning is considered only where the operational risks are understood. It must not be introduced without a recovery and rotation plan.

## Protocol standards

The implementation baseline must define approved:

- TLS versions;
- cipher policies where configurable;
- certificate algorithms and key sizes;
- hostname-verification behaviour;
- mutual-TLS use cases;
- certificate validity periods;
- deprecation and compatibility process.

The exact baseline belongs in implementation policy because supported protocol settings can change over time.

## Failure behaviour

Clients and services must fail closed when:

- certificate validation fails;
- the hostname does not match;
- the peer identity is unexpected;
- the token audience is wrong;
- a required client certificate is missing;
- the approved encrypted protocol cannot be negotiated.

Automatic fallback to plaintext is prohibited.

## Monitoring

Monitoring should identify:

- plaintext requests reaching public or internal endpoints;
- certificate expiry or renewal failure;
- unexpected TLS policy changes;
- failed certificate validation;
- repeated handshake failures;
- use of deprecated protocols;
- direct-origin traffic;
- service calls with invalid issuer or audience;
- partner endpoint or certificate changes;
- database connections that do not meet the required encrypted mode.

## Validation requirements

Before marking encryption-in-transit controls implemented, evidence must show:

1. a complete traffic-path inventory;
2. the effective protocol for each path;
3. valid certificate and hostname verification;
4. service identity and audience enforcement;
5. denied plaintext access;
6. denied direct-origin access;
7. database encrypted-connection verification;
8. partner authentication and replay tests;
9. certificate renewal testing;
10. monitoring and alert ownership.

## Status

This architecture is **Designed**. No TLS policy, certificate, service identity, database connection, partner transport, or monitoring rule is considered implemented until configuration, testing, and evidence exist.
