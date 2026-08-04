# ADR-009: Controlled Egress Model

- **Status:** Accepted
- **Date:** 2026-08-04
- **Decision owners:** Platform Engineering and Security
- **Related phase:** v0.4 Network and Perimeter Architecture

## Context

AfyaBridge workloads require outbound connectivity to approved external services such as payment providers, messaging platforms, software repositories, monitoring services, and partner APIs.

Unrestricted outbound internet access would weaken country isolation, reduce attribution, increase exfiltration risk, and make partner allowlisting and incident investigation less reliable.

The architecture must also support serverless workloads, managed Google APIs, private data services, and country-specific production boundaries without creating a central network transit layer.

## Decision

AfyaBridge will use a controlled egress model with the following properties:

1. Production workloads do not receive unrestricted outbound internet access by default.
2. Outbound traffic uses country- and environment-specific egress paths.
3. Private Google API access is preferred where suitable.
4. Internet-bound traffic uses approved Cloud NAT, egress proxy, or service-specific managed connectivity.
5. Destinations are recorded in a version-controlled approval register.
6. Workload identity and application authentication remain mandatory; network source attribution is supplementary.
7. Production and non-production use separate egress identities, credentials, and paths.
8. No shared egress layer acts as transitive connectivity between production countries.
9. Unapproved outbound traffic is denied where technically practical and always monitored.
10. Emergency egress exceptions are time-bound, approved, logged, and reconciled into code or removed.

## Egress boundaries

Each production country retains its own:

- Shared VPC;
- serverless connector ranges;
- NAT or approved proxy path;
- public source attribution;
- partner destination register;
- logs and alerts;
- exception ownership.

Staging and development have separate egress paths and must not reuse production partner credentials.

## Destination approval

An approved outbound dependency must identify:

- requesting service;
- owner;
- environment and country;
- destination domain, service, or address range;
- protocol and port;
- business purpose;
- authentication method;
- data classification;
- expected traffic profile;
- expiry or review date;
- failure behaviour;
- monitoring requirements.

Approval of a domain name does not automatically approve all subdomains, IP ranges, redirects, or alternate endpoints.

## Options considered

### Option 1: Unrestricted internet egress through default routes

**Rejected.**

Advantages:

- minimal operational complexity;
- fewer application compatibility issues.

Disadvantages:

- weak destination control;
- reduced exfiltration resistance;
- poor attribution;
- difficult partner allowlisting;
- greater supply-chain and command-and-control exposure.

### Option 2: One centralized organization-wide egress network

**Rejected for the baseline design.**

Advantages:

- centralized policy and inspection;
- potentially simpler destination management.

Disadvantages:

- creates a high-impact shared dependency;
- risks transitive country connectivity;
- complicates country ownership and incident containment;
- may route country traffic through an inappropriate shared boundary.

Central standards and tooling remain shared, but traffic paths remain country- or environment-specific.

### Option 3: Country-specific NAT only, without destination governance

**Rejected as insufficient.**

NAT provides source attribution and address translation but does not by itself enforce business-purpose destination controls or application authentication.

### Option 4: Deny-by-default egress with country-specific NAT or proxies and an approval register

**Accepted.**

This provides a practical balance between isolation, attribution, operational compatibility, and progressive enforcement.

## Consequences

### Positive consequences

- improved detection and containment of data exfiltration;
- attributable outbound source addresses;
- clearer country and environment boundaries;
- explicit third-party dependency inventory;
- stronger production and non-production separation;
- support for provider source allowlisting;
- better investigation evidence.

### Negative consequences

- additional operational overhead when dependencies change;
- DNS-based services and dynamic provider ranges require careful handling;
- some build and package workflows may need mirrors or dedicated exceptions;
- serverless connector and NAT capacity require planning;
- deny-by-default enforcement may need phased rollout.

## Security implications

The model reduces but does not eliminate egress risk.

Controls must be combined with:

- least-privilege workload identity;
- secret isolation;
- data minimization;
- private data-service connectivity;
- application-layer authentication;
- destination monitoring;
- anomaly detection;
- incident response.

A compromised workload may still communicate with an approved destination. Approved destinations therefore require business-purpose and data-flow review.

## Availability implications

Outbound dependency failure must not cause automatic fallback to an unapproved endpoint or environment.

Workloads should use bounded retries, queues, circuit breakers, and explicit degradation behaviour where appropriate.

## Implementation direction

Later Terraform and policy work should provide:

- country- and environment-specific routers and NAT resources;
- serverless connector ranges;
- private Google API access;
- optional egress proxy capabilities where destination enforcement requires them;
- destination and exception data structures;
- logging and alerting;
- tests for denied and approved flows.

The implementation must preserve the design distinction between **Designed**, **Code complete**, and **Implemented**.

## Validation

The decision is validated when evidence demonstrates that:

- a production workload can reach an approved destination;
- the same workload is denied or alerted when contacting an unapproved destination;
- production source attribution is country-specific;
- development credentials and paths cannot be used for production integrations;
- a country production workload cannot use another country's egress path;
- private Google API traffic does not require general internet exposure where configured;
- removal of an approval terminates or alerts on the connection;
- emergency exceptions expire and are reconciled.

## Related documents

- [`../architecture/network/egress-controls.md`](../architecture/network/egress-controls.md)
- [`../architecture/network/third-party-connectivity.md`](../architecture/network/third-party-connectivity.md)
- [`../architecture/network/network-monitoring.md`](../architecture/network/network-monitoring.md)
- [`ADR-007-shared-vpc-and-country-segmentation.md`](./ADR-007-shared-vpc-and-country-segmentation.md)

## Decision outcome

AfyaBridge adopts country- and environment-specific controlled egress with explicit destination governance. Centralized standards do not create a centralized transitive traffic path.
