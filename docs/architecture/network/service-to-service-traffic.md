# Service-to-Service Traffic

## Purpose

This document defines how AfyaBridge services communicate within and across application boundaries. It focuses on east-west traffic between APIs, workers, schedulers, event consumers, data services, and internal platform components.

Network reachability is not treated as authorization. Every service call must be attributable to a workload identity and evaluated against an explicit service contract.

## Design objectives

Service-to-service communication must:

1. Use dedicated workload identities.
2. Default to deny when no service relationship is approved.
3. Preserve country and environment isolation.
4. Prevent direct client access to internal-only services.
5. Authenticate callers at the receiving service.
6. Authorize the requested operation and scope.
7. Encrypt traffic in transit.
8. Avoid hidden transitive dependencies.
9. Record enough telemetry to reconstruct sensitive flows.
10. Support safe revocation and service replacement.

## Service classes

| Service class | Examples | Exposure |
|---|---|---|
| Public application service | patient, CHW, or clinician API | reachable only through approved edge controls |
| Internal application service | reporting, workflow, notification, synchronization | internal or authenticated managed endpoint only |
| Background workload | queue consumer, scheduler, batch worker | no user-facing ingress |
| Data service | database, cache, queue, object store | private access only |
| Operations service | health checks, deployment hooks, maintenance workers | restricted operations path |
| Shared security service | log receiver, detection pipeline | controlled telemetry intake only |

## Authorization model

An approved service call requires all of the following:

- the caller presents a valid workload identity;
- the identity belongs to the expected environment and country;
- the destination explicitly trusts that caller or caller class;
- the requested method or action is allowed;
- the request scope matches country, programme, tenant, organization, or facility rules where relevant;
- the destination validates request freshness and integrity where replay risk exists;
- the route and destination match the approved service catalogue.

A successful network connection without these conditions must result in denial.

## Identity propagation

Services must distinguish between:

- **caller workload identity** — the machine identity making the immediate request;
- **end-user identity** — the authenticated application user whose action initiated the request;
- **delegated context** — country, programme, facility, tenant, role, and correlation identifiers required for authorization and audit.

Services must not blindly trust user or scope headers supplied by an upstream caller. Delegated context must be signed, derived from a trusted session, or revalidated against an authoritative service.

## Synchronous calls

For synchronous API calls:

- HTTPS is mandatory;
- internal services are not anonymously invokable;
- caller identity is validated at the destination;
- deadlines and bounded retries are configured;
- sensitive operations use idempotency controls;
- response data is minimized to the caller’s authorization scope;
- dependency failure does not trigger fallback to a public or cross-country endpoint;
- tracing identifiers are propagated without including sensitive health data.

## Asynchronous communication

Queues, topics, and event streams must use:

- separate publisher and subscriber permissions;
- country- and environment-specific resources;
- schema validation;
- replay and duplicate-handling controls;
- dead-letter handling with restricted access;
- message retention aligned with data classification;
- payload minimization or tokenization;
- encryption and audit logging;
- explicit prohibition of a shared global topic carrying unrestricted country health data.

A message consumer validates both the platform identity and the business scope of each event.

## Cross-project calls

Cross-project service calls are permitted only when required by the approved architecture.

Requirements include:

- explicit destination-side IAM or service policy;
- no broad project-level invoker grant where service-level scope is available;
- service account belongs to the correct country and environment;
- the call appears in the service dependency register;
- logging identifies both source and destination projects;
- removal of the dependency is tested during decommissioning.

Cross-country production calls are prohibited by default.

## Shared-service interactions

Country workloads may send narrowly scoped data to common services for approved capabilities such as:

- centralized security telemetry;
- artifact retrieval;
- deployment metadata;
- organization-wide monitoring;
- approved configuration distribution.

Shared services must not become a general proxy through which one production country can reach another. Telemetry intake does not imply reverse invocation permission.

## Firewall policy

For VPC-resident traffic, firewall controls should:

- deny unspecified east-west paths;
- target workload service accounts or secure tags where supported;
- use narrow destination ports;
- avoid broad subnet-to-subnet allows;
- log sensitive allows and relevant denies;
- distinguish application, data, operations, connector, and administration zones;
- prohibit production-to-production country transit;
- prohibit development and staging access to production.

Firewall policy supplements service authentication and does not replace it.

## Service discovery and DNS

Internal discovery must use controlled names with defined ownership.

Requirements include:

- environment and country encoded in service naming or zone ownership;
- no accidental resolution of production names from non-production;
- no wildcard internal records that make unrelated services reachable;
- certificate names match the approved service identity;
- stale records are removed during decommissioning;
- DNS changes are version-controlled and audited.

## Internal load balancing and managed endpoints

Internal load balancers or managed service endpoints may be used when they provide a clear operational or security benefit.

They must:

- expose only intended backends;
- enforce health checks without opening administrative access;
- preserve source or caller identity where required;
- use TLS and certificate lifecycle management;
- avoid global routing that violates country boundaries;
- log configuration changes and request outcomes.

## Secrets and credentials

Services must not exchange long-lived shared secrets when federation, platform identity, or short-lived credentials are available.

Where an application credential remains necessary:

- it is stored in an approved secret manager;
- access is limited to one workload identity or tightly related service set;
- rotation is automated or operationally scheduled;
- the credential is not embedded in images, repositories, logs, or messages;
- compromise can be contained without rotating unrelated services.

## Failure behavior

Services must fail safely when:

- caller authentication fails;
- delegated context is missing or invalid;
- country or tenant scope conflicts;
- the destination is unexpected;
- certificate verification fails;
- policy cannot be loaded;
- a queue message has an invalid schema;
- the dependency is unavailable.

Fail-open behavior for authorization or identity validation is prohibited.

## Observability

Required telemetry includes:

- caller workload identity;
- destination service;
- environment and country;
- operation or route;
- authorization decision;
- latency and outcome;
- correlation identifier;
- retry and duplicate indicators;
- queue publisher and subscriber identity;
- policy and IAM changes affecting invocation.

Logs must avoid raw clinical payloads, tokens, credentials, or unnecessary personal data.

## Dependency governance

Each production service dependency must record:

- source and destination services;
- owner on each side;
- environment and country;
- protocol and port;
- identity and authorization mechanism;
- data classification;
- timeout, retry, and failure behavior;
- observability requirements;
- decommissioning procedure.

Undocumented dependencies are treated as architecture drift.

## Validation

Required validation includes:

1. Approved caller invokes the intended service successfully.
2. An unapproved workload identity is denied.
3. A development workload cannot invoke a production service.
4. A Kenya workload cannot invoke Ghana or South Africa production services.
5. Modified user or country context is rejected.
6. Anonymous invocation of internal services is denied.
7. Queue publish and subscribe permissions are independently enforced.
8. Direct data-service access from an unrelated service is denied.
9. Removal of a service relationship removes both network and authorization access.
10. Logs correlate the user action, caller workload, destination, and authorization outcome.

## Status

**Designed.** Service identities, IAM, firewall policies, managed endpoints, queues, tests, and evidence are not yet implemented.