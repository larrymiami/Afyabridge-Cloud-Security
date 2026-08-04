# Egress Controls

## Purpose

This document defines how AfyaBridge workloads reach Google APIs, managed services, package repositories, partner systems, and the public internet. The objective is to minimize unrestricted outbound access, preserve country and environment boundaries, and make every approved external dependency attributable and reviewable.

## Egress principles

1. Workloads do not receive unrestricted internet access by default.
2. Private service paths are preferred over public endpoints where supported and appropriate.
3. Egress is scoped by environment, country, workload, protocol, and destination.
4. Production and non-production use separate egress paths and policies.
5. Country production networks must not use another country as a transit path.
6. Static source addresses are used when partner allowlisting or attribution requires them.
7. DNS, routes, NAT, proxy rules, firewall rules, and partner destinations are managed as code.
8. An allowed network path does not replace workload identity or destination authentication.

## Egress classes

| Class | Examples | Default treatment |
|---|---|---|
| Google APIs and managed services | storage, logging, monitoring, secrets, artifact services | Prefer private or restricted API paths; authenticate with workload identity |
| Approved SaaS | messaging, email, monitoring, support systems | Explicit destination and owner; HTTPS only unless documented otherwise |
| Partner systems | payments, referrals, government or NGO integrations | Dedicated connector boundary where risk warrants; static source identity where required |
| Software supply chain | package registries, container registries, update services | CI/CD or controlled build path; runtime access minimized |
| General internet | arbitrary websites and endpoints | Denied for production workloads unless explicitly approved |
| Administrative retrieval | emergency diagnostics or vendor downloads | Temporary, approved, logged, and time-bound |

## Default production model

Production workloads should use:

- private IP addresses;
- no external IP addresses on private compute;
- Cloud NAT or an approved egress proxy only for documented destinations;
- private access to Google APIs where feasible;
- dedicated connector or subnet paths for higher-risk partner integrations;
- DNS resolution controlled by the environment's approved resolvers;
- flow logs, NAT logs, firewall logs, and application-level destination telemetry.

Cloud NAT provides source translation and attribution but is not, by itself, a destination allowlist. Destination restriction requires firewall, proxy, service-specific, DNS, or application controls appropriate to the runtime.

## Serverless egress

Serverless services that need VPC access use environment- and trust-zone-specific connectors or equivalent managed connectivity.

Each service must declare:

- whether all traffic or private ranges only are routed through the connector;
- approved destinations;
- expected ports and protocols;
- source identity and connector range;
- failure behavior when egress is unavailable;
- expected volume and cost;
- logging and alerting requirements.

A serverless connector must not be reused to collapse country, environment, or workload trust boundaries.

## Destination approval register

Approved egress dependencies should be represented in a machine-readable register containing:

- dependency name;
- owning team;
- business purpose;
- environment and country;
- source workload identity;
- destination domain, IP range, or service identifier;
- port and protocol;
- authentication method;
- data classification permitted to leave;
- expected traffic profile;
- expiry or review date;
- incident and support contacts;
- teardown procedure.

Broad wildcard domains and unrestricted address ranges require explicit security review.

## DNS controls

DNS is part of the egress control plane.

Controls should include:

- approved private and public zones;
- centralized query logging with privacy safeguards;
- prevention of unauthorized resolver bypass where technically practical;
- monitoring for newly observed or suspicious domains;
- split-horizon records only where ownership and failure behavior are clear;
- lifecycle management for partner and service records;
- no assumption that DNS allowlisting alone prevents access to unintended services on shared infrastructure.

## Partner egress

Partner integrations require a documented trust boundary. Depending on risk, the design may use:

- a dedicated connector subnet or service;
- fixed egress addresses;
- mutual TLS;
- signed requests;
- private connectivity;
- message queues or asynchronous exchange;
- per-partner credentials and rate limits;
- payload minimization and field-level validation.

Partner failure must not cause workloads to bypass approved controls or send data to fallback endpoints without review.

## Software supply-chain egress

Production runtime services should not download arbitrary packages or execute remote installation scripts.

Preferred controls are:

- dependencies resolved during controlled builds;
- artifacts mirrored or stored in approved repositories;
- signed and scanned images promoted between environments;
- production deployment of the same approved artifact tested in non-production;
- runtime images without package managers where practical;
- emergency update paths documented and reviewed after use.

## Data-loss prevention considerations

Network egress controls reduce opportunity but cannot determine all sensitive-data context. Application and data controls must also prevent unauthorized export.

High-risk outbound flows should consider:

- payload schemas and size limits;
- tokenization or pseudonymization;
- field allowlists;
- encryption at the application layer where required;
- approval for bulk export;
- anomaly detection on volume and destination;
- blocking secrets, access tokens, or health-record content from logs.

## Failure behavior

Services must define safe behavior when an external dependency is unavailable.

Examples include:

- queue and retry with bounded backoff;
- dead-letter handling;
- fail closed for authorization or fraud checks;
- manual reconciliation for payment callbacks;
- degraded read-only behavior;
- no automatic switch to an unapproved endpoint.

## Monitoring and detection

Detection coverage should include:

- traffic to unapproved destinations;
- new domains or IP ranges;
- spikes in outbound volume;
- unusual countries or autonomous systems where observable;
- repeated denied connections;
- DNS tunneling indicators;
- direct public API access when a private path is expected;
- production package downloads;
- partner traffic from unexpected workloads;
- use of a country egress path by another country environment;
- temporary exceptions that fail to expire.

## Exception process

An egress exception requires:

1. business and technical justification;
2. source workload, country, and environment;
3. exact destination and protocol;
4. data classification;
5. authentication and encryption controls;
6. monitoring plan;
7. owner and expiry;
8. rollback and removal verification.

Emergency access is temporary and linked to an incident or change record.

## Validation requirements

Tests must demonstrate that:

- workloads without approved egress cannot reach arbitrary internet destinations;
- private API paths work as designed;
- connector and NAT paths remain environment and country scoped;
- source addresses match partner expectations;
- denied egress is logged;
- production runtimes cannot retrieve arbitrary packages;
- destination exceptions expire;
- DNS and direct-IP paths cannot trivially bypass the intended policy;
- sensitive values do not appear in network logs.

## Status

**Designed.** No NAT gateway, proxy, destination policy, private API path, connector rule, or partner allowlist is represented as implemented until code, deployment, testing, and evidence exist.
