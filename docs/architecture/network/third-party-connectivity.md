# Third-Party Connectivity

## Purpose

This document defines how AfyaBridge connects to external partners, vendors, payment providers, messaging platforms, referral systems, and support services without weakening country, environment, identity, or data boundaries.

Third-party connectivity is treated as an explicit trust boundary. Network reachability, DNS resolution, or possession of an API endpoint does not establish trust.

## Design objectives

Third-party connectivity must:

1. Be sponsored by an accountable AfyaBridge owner.
2. Be scoped to a named country, environment, service, and business purpose.
3. Use authenticated and encrypted protocols.
4. Avoid permanent broad inbound or outbound network access.
5. Preserve country and production isolation.
6. Support rapid revocation and expiry.
7. Produce sufficient logs for investigation and access review.
8. Prevent partner connectivity from becoming a transitive route into other environments.

## Connectivity classes

| Class | Examples | Preferred pattern |
|---|---|---|
| Public API consumer | SMS, email, payment, geocoding provider | Controlled outbound HTTPS through approved egress path |
| Inbound webhook provider | payment confirmation, messaging callback | Managed public edge, dedicated endpoint, signature and replay validation |
| Private partner service | referral network, laboratory platform | Private service endpoint or tightly scoped VPN where justified |
| File exchange | scheduled reports or batch data | Managed object storage exchange with separate identities and prefixes |
| Support vendor | managed operations or incident support | Identity-aware, time-bound administrative access; no permanent VPN |
| Regulator or auditor | evidence review or approved export | Read-only application or data export channel with expiry and audit |

## Partner onboarding requirements

Every integration must have a version-controlled connectivity record containing:

- partner name and legal entity;
- AfyaBridge sponsor and technical owner;
- countries and environments in scope;
- business purpose;
- data categories transferred;
- source and destination systems;
- direction of connection;
- protocol and ports;
- authentication method;
- expected source addresses or certificate identities where applicable;
- expected traffic volume and schedule;
- logging and alerting requirements;
- contract, data-processing, and incident-contact references;
- renewal or expiry date;
- revocation and exit procedure.

A partner connection must not be activated from an informal request alone.

## Outbound partner access

Outbound integrations use the controlled egress model defined in [`egress-controls.md`](./egress-controls.md).

Requirements:

- destinations are explicitly approved;
- workloads use dedicated identities and secrets;
- production credentials are separate from non-production credentials;
- source attribution uses country-specific NAT addresses or an approved egress proxy where the provider supports allowlisting;
- retries use bounded backoff and idempotency controls;
- payloads contain only the minimum required data;
- failures do not cause fallback to an unapproved destination;
- destination changes require review rather than silent DNS or configuration drift.

IP allowlisting is a supplementary control and does not replace application authentication.

## Inbound webhook access

Inbound callbacks terminate at the managed public edge before reaching application services.

Each provider receives a dedicated logical endpoint or route. Controls include:

- TLS enforcement;
- provider-specific authentication;
- message signatures using managed secrets or public keys;
- timestamp validation;
- replay detection;
- schema and content-type validation;
- request-size limits;
- rate limits;
- idempotency keys;
- country and environment routing checks;
- structured security logging;
- rejection of unsigned or stale events.

Webhook handlers must not trust caller-provided country, organization, payment, patient, or facility scope without server-side validation.

## Private connectivity

Private partner connectivity is an exception, not the default.

A VPN or private interconnect may be considered when:

- the provider cannot securely use a public authenticated API;
- traffic volume or latency justifies a private path;
- regulatory or contractual controls require it;
- ownership, routing, logging, and termination can be clearly assigned.

Private connectivity must:

- terminate in a country-specific connector boundary;
- advertise only approved prefixes;
- reject default routes and broad route propagation;
- avoid access to administration and unrelated subnets;
- use dedicated firewall rules;
- use application authentication in addition to network controls;
- have tunnel health and route-change alerts;
- be reviewed at least quarterly.

No third-party connection may provide transit between countries, production and non-production, or separate partners.

## File and object exchange

Batch exchange uses a dedicated storage location or transfer service rather than shared application buckets.

Controls include:

- separate partner identity;
- least-privilege object permissions;
- partner-specific prefixes or buckets;
- encryption in transit and at rest;
- malware and file-type validation where relevant;
- retention and deletion rules;
- object access logging;
- upload size and frequency controls;
- checksum or signature validation;
- no listing of unrelated objects.

## Secrets and certificates

Third-party credentials are stored in approved secret-management services.

Requirements:

- no credentials in source control, Terraform state, container images, logs, or support tickets;
- separate credentials by country and environment;
- rotation ownership and schedule;
- emergency revocation procedure;
- certificate expiry monitoring;
- restricted secret access to the consuming workload identity;
- no broad shared integration account where provider capabilities allow separation.

## Third-party support access

Support vendors do not receive permanent network access.

Support access requires:

- named individual identity;
- AfyaBridge sponsor;
- approved support case or change record;
- strong authentication;
- time-bound role or group membership;
- least-privilege target scope;
- monitored session or complete administrative logs;
- revocation at the end of the support window;
- post-access review for production activity.

Direct database, SSH, RDP, or unrestricted VPN access is prohibited as a normal support model.

## Failure and isolation behaviour

A partner outage must not automatically weaken security controls.

Systems must:

- queue or fail safely where appropriate;
- avoid routing to unapproved backup endpoints;
- avoid disabling signature validation;
- avoid switching production data to non-production integrations;
- limit retries to prevent denial-of-service amplification;
- surface degraded partner dependencies through monitoring.

## Monitoring

Monitor for:

- traffic to unapproved destinations;
- unexpected source addresses;
- signature, certificate, and authentication failures;
- webhook replay attempts;
- unusual request volume or payload size;
- route or tunnel changes;
- certificate expiry;
- use of expired credentials;
- data transfer outside approved country or environment scope;
- partner activity outside agreed schedules.

## Validation

The design is validated when tests demonstrate that:

- an unsigned or replayed webhook is rejected;
- a partner identity cannot access another partner's exchange location;
- non-production credentials cannot invoke production integrations;
- a private partner route cannot reach administration or unrelated subnets;
- removal of the partner's identity and rules terminates access;
- an unapproved outbound destination is denied and logged;
- a country-specific integration cannot access another country's service or data.

## Status

**Designed.** No third-party connection is represented as approved or implemented until its connectivity record, configuration, tests, and evidence exist.
