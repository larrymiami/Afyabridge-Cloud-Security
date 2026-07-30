# Private Service Access

## Purpose

This document defines how AfyaBridge workloads reach managed data and platform services without exposing those services directly to the public internet or creating broad network trust.

The design treats private connectivity as one control in a layered access model. Private addressing does not replace workload identity, application authorization, encryption, logging, or data-country controls.

## Design objectives

Private service access must:

1. Keep production databases, caches, queues, and internal APIs off public endpoints where supported.
2. Preserve country and environment isolation.
3. Prevent non-production networks from reaching production data services.
4. Avoid a shared transitive network path between country production environments.
5. Use dedicated service ranges and connection ownership.
6. Require workload-specific identity and least-privilege authorization.
7. Produce sufficient connection, DNS, IAM, and audit evidence for investigation.
8. Fail closed when private routing, identity, or authorization cannot be validated.

## Connectivity classes

| Class | Examples | Expected path |
|---|---|---|
| Country data services | relational databases, caches, internal object stores | country application workload to country data service over approved private connectivity |
| Google APIs | Secret Manager, KMS, logging, monitoring, artifact access | private Google API path where practical, with workload identity |
| Internal application services | API, worker, notification, reporting services | authenticated service-to-service call over approved internal or managed endpoint |
| Shared security services | logging and security telemetry destinations | one-way or narrowly scoped export path; no reverse workload reachability |
| External partner services | payment, messaging, referral, or identity partners | controlled egress; not private service access unless a dedicated approved connection exists |

## Country-scoped service ranges

Each production Shared VPC reserves a non-overlapping range for managed-service connections.

| Environment | Private-service allocation |
|---|---|
| Kenya production | reserved within `10.40.192.0/18` |
| Ghana production | reserved within `10.50.192.0/18` |
| South Africa production | reserved within `10.60.192.0/18` |
| Staging | reserved within `10.70.192.0/18` |
| Development | reserved within `10.80.192.0/18` |

Exact subranges are allocated through infrastructure code and the address registry. They must not overlap application, connector, administration, or future expansion ranges.

## Connection ownership

The Shared VPC host project owns:

- reserved private-service ranges;
- peering or private-service connection configuration;
- route controls;
- DNS zones and forwarding rules where applicable;
- network logging and flow visibility;
- attachment approval for service projects.

The data service project owns:

- the managed service instance;
- database-level or service-level authorization;
- encryption configuration;
- backup and recovery configuration;
- service audit logs;
- maintenance and availability settings.

Application projects do not create unmanaged peering or private-service connections directly.

## Approved access pattern

A production application reaches a managed data service through this sequence:

1. The workload runs under a dedicated country and environment service account.
2. The workload resolves a private service name.
3. DNS returns an approved private address or managed private endpoint.
4. Routing keeps traffic inside the country production network boundary.
5. Firewall policy permits only the required source identity, connector, subnet, protocol, and port where these controls are applicable.
6. The managed service validates the workload credential or database credential.
7. Database or service authorization limits operations to the required schema, database, queue, bucket, or key scope.
8. Connection, authentication, query, and error telemetry is recorded according to the data classification.

## Serverless workloads

Cloud Run and similar managed runtimes require explicit connectivity configuration before they may reach private services.

The design requires:

- country- and environment-specific connectors or supported direct VPC egress capability;
- dedicated connector address ranges;
- no reuse of a production connector by another country or by non-production;
- egress mode selected deliberately rather than inherited from a default;
- connector health and capacity monitoring;
- service identity enforcement at the destination;
- validation that public fallback endpoints are disabled or rejected.

A connector establishes reachability only. It does not grant database, secret, queue, or API permission.

## Private Google API access

Workloads without external IP addresses should use approved private access paths for Google APIs where supported and operationally appropriate.

Controls include:

- private DNS behavior validated for approved API domains;
- restricted or private API endpoints considered for sensitive production paths;
- workload identity required for every API request;
- organization policy and IAM limiting which services may be used;
- no assumption that a private API route authorizes the request;
- logging of denied and successful sensitive API operations.

## DNS requirements

Private service names must:

- be hosted in an approved private DNS zone;
- have explicit ownership;
- avoid ambiguous split-horizon behavior;
- resolve only within intended environment and country networks;
- use stable names rather than embedding raw addresses in application configuration;
- support controlled migration and recovery;
- be included in certificate validation where TLS terminates on an internal service.

DNS forwarding between country production networks is prohibited unless a reviewed exception demonstrates that it cannot create transitive service discovery or routing.

## Firewall and route controls

Private connectivity follows deny-by-default principles.

Rules must:

- identify the business and technical owner;
- specify source, destination, protocol, port, environment, and country;
- use service-account or secure-tag targeting where supported and reliable;
- avoid broad source ranges when a narrower identity or connector boundary is available;
- prohibit non-production sources from production destinations;
- prohibit country-to-country production data access;
- expire temporary migration or recovery rules;
- be managed through version-controlled infrastructure code.

Routes learned or created by private-service connections must be reviewed to ensure they do not establish unintended transit.

## Data-service authentication

Private network reachability is insufficient on its own.

Managed services must require one or more of:

- workload identity or IAM database authentication;
- short-lived database credentials;
- workload-specific database users;
- TLS with server verification;
- mTLS for approved internal services where operationally justified;
- schema-, database-, queue-, topic-, bucket-, or key-level authorization.

Shared database accounts across services are prohibited in production.

## Public endpoint restrictions

Where a managed service supports both public and private endpoints:

- the public endpoint is disabled by default;
- authorized-network lists are not used as the primary production control;
- temporary public enablement requires an incident or migration exception;
- the exception must identify source, duration, approver, monitoring, and rollback;
- public access is tested as denied after the exception closes.

## Shared services boundary

Central logging, security, and monitoring services may receive telemetry from country environments, but this does not grant those shared projects general network access back into workloads or data services.

Permitted patterns include:

- log sinks;
- metric export;
- event publication to a controlled destination;
- asset inventory export;
- narrowly scoped security scanning where explicitly approved.

A bidirectional shared-services mesh is not part of the v0.4 design.

## Availability and recovery

Private connectivity is included in service recovery planning.

Recovery procedures must address:

- reserved-range loss or accidental replacement;
- DNS failure;
- connector exhaustion or failure;
- private-service connection drift;
- certificate or credential expiry;
- route or firewall rollback;
- restoration from an earlier known-good configuration;
- country-specific recovery without connecting another country production network.

## Monitoring

Required telemetry includes:

- VPC Flow Logs for relevant subnets;
- firewall-rule logging for sensitive allow and deny paths;
- DNS query and error telemetry where available and proportionate;
- managed-service connection and authentication logs;
- connector health, throughput, errors, and saturation;
- IAM denials and unusual credential use;
- configuration changes to routes, DNS, connectors, service ranges, and endpoints.

Alerts should cover:

- production service receiving public traffic;
- non-production source attempting production data access;
- cross-country destination attempts;
- repeated authentication failures from a valid network path;
- unexpected destination address or DNS answer;
- private connector exhaustion;
- managed-service public endpoint enablement;
- deletion or replacement of a reserved service range.

## Validation

The design is validated through architecture and later implementation tests.

Required tests include:

1. Production workload reaches its approved country data service.
2. The same workload cannot reach another country’s data service.
3. Development and staging cannot reach production data services.
4. A workload with network reachability but no service permission is denied.
5. A workload with permission but no approved network path is denied.
6. Public endpoints are unavailable for production data services.
7. Private DNS resolves only inside intended networks.
8. Connector and service-range changes are detected as drift.
9. Temporary migration access expires and denial is re-verified.
10. Logs identify the source workload, destination, decision, and relevant country context.

## Status

**Designed.** Private ranges, connectors, DNS, policies, routes, service endpoints, authentication, tests, and evidence are not yet implemented.