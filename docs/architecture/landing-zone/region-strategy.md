# Region Strategy

## 1. Purpose

This document defines the initial Google Cloud region strategy for AfyaBridge Cloud Security.

The strategy balances latency, service availability, operational simplicity, recovery requirements, cost, and country isolation. It is an engineering design decision for the project and does not constitute legal advice or a statement of regulatory compliance.

Google Cloud currently provides one general-purpose region in Africa: Johannesburg, South Africa (`africa-south1`). The initial design therefore uses Johannesburg as the primary African region while preserving the ability to adopt additional African regions when they become available.

## 2. Design principles

1. Production data location must be explicit.
2. Country environments must not select regions independently without review.
3. Regional services must use approved locations only.
4. Globally scoped services must be documented separately from regional workloads.
5. Recovery design must consider both regional disruption and cross-border data movement.
6. Service availability must be verified before a workload is assigned to a region.
7. Region changes require an architecture decision and migration plan.
8. Region policy must be enforceable through infrastructure and governance controls where practical.

## 3. Initial approved regions

| Region | Location | Initial use |
|---|---|---|
| `africa-south1` | Johannesburg, South Africa | Primary regional workload location for production, staging, and shared African services |
| `europe-west1` | St. Ghislain, Belgium | Conditional recovery or backup location where cross-region recovery is required and approved |
| `me-central1` | Doha, Qatar | Evaluation-only alternative for selected services where service support, latency, and data-handling requirements justify it |

Only `africa-south1` is approved by default for production application and data workloads in v0.2.

`europe-west1` and `me-central1` are not automatically approved for restricted country data. Their use requires an explicit decision covering data classification, encryption, retention, cost, recovery objectives, and cross-border handling assumptions.

## 4. Country strategy

### 4.1 Kenya

| Item | Decision |
|---|---|
| Primary region | `africa-south1` |
| Recovery region | Not enabled by default in v0.2 |
| Backup location | Same-region or provider-managed regional storage initially |
| Rationale | Closest currently available general-purpose Google Cloud region in Africa and consistent with the shared operational model |

Kenya production services remain in country-specific projects even though the physical region is outside Kenya.

This is an architecture assumption for the lab. A real deployment would require legal, contractual, programme, and data-protection review before processing identifiable health-related data outside Kenya.

### 4.2 Ghana

| Item | Decision |
|---|---|
| Primary region | `africa-south1` |
| Recovery region | Not enabled by default in v0.2 |
| Backup location | Same-region or provider-managed regional storage initially |
| Rationale | Only current general-purpose Google Cloud region in Africa and simplest consistent baseline for the project |

Ghana production services remain isolated through folders, projects, IAM, data services, keys, and application authorisation despite sharing the same physical region as the other country environments.

### 4.3 South Africa

| Item | Decision |
|---|---|
| Primary region | `africa-south1` |
| Recovery region | Conditional secondary-region design in a later phase |
| Backup location | Same-region initially; cross-region copy may be evaluated during resilience work |
| Rationale | Local African region and strongest initial fit for latency and operational simplicity |

South Africa is the only initial country with an in-country Google Cloud region. This does not by itself establish compliance with any data-protection or sector requirement.

## 5. Environment placement

| Environment | Default region | Notes |
|---|---|---|
| Production | `africa-south1` | Country-specific projects and data boundaries |
| Staging | `africa-south1` | Shared staging with synthetic, country-labelled data |
| Development | `africa-south1` | Shared development; low-cost services may use global control planes where required |
| Sandbox | `africa-south1` unless an experiment requires another approved region | Short-lived and synthetic only |
| Bootstrap | Region chosen by service requirement | Terraform state and control-plane services must document actual location behaviour |
| Shared security and logging | `africa-south1` where regional; global where the service is inherently global | Access is centralised, data visibility remains restricted |

## 6. Regional, multi-regional, and global services

Not all Google Cloud services use the same location model.

Every service must be classified as one of:

- **Zonal** — deployed in one zone;
- **Regional** — deployed across or within one region;
- **Multi-regional** — provider-managed across a named geography;
- **Global** — control plane or data path is not restricted to one region;
- **Location-dependent** — location semantics vary by feature.

A service may not be labelled compliant with this strategy solely because its console shows a region. The implementation must verify where customer data, logs, backups, metadata, and control-plane operations are stored or processed.

## 7. Service placement rules

### 7.1 Application runtimes

- Cloud Run services use `africa-south1` where supported.
- GKE workloads, when introduced, use regional clusters in `africa-south1` unless a documented exception exists.
- Production services must not fail over automatically to an unapproved region.
- Container images may be replicated only through approved Artifact Registry locations.

### 7.2 Databases

- Production databases must use `africa-south1` where the selected service supports it.
- Public IP access remains prohibited.
- Cross-region replicas are deferred until the data-handling and cost model is approved.
- Database backups must have an explicit location and retention policy.

### 7.3 Object storage

- Buckets containing confidential or restricted data use a defined regional location.
- Automatic multi-region placement is not used for restricted production data by default.
- Public-access prevention and uniform bucket-level access are required.
- Backup or export buckets must not silently expand the approved data-location boundary.

### 7.4 Logs and security telemetry

- Central log routing may cross project and country boundaries into the common logging or security projects.
- Access to central logs is role-restricted and auditable.
- Restricted application payloads must not be written to logs.
- Log bucket locations and retention settings must be explicit.

### 7.5 Secrets and keys

- Secret replicas and KMS key locations must align with the workload's approved region strategy.
- Country workloads must not use another country's key hierarchy.
- A global secret or key configuration must not be used merely for convenience.

## 8. Recovery strategy

The initial v0.2 design prioritises a sound single-region landing zone before introducing cross-region failover.

### 8.1 Initial recovery posture

- regional high availability where supported;
- automated backups;
- tested restore procedures;
- infrastructure reproducibility through Terraform;
- signed and reproducible application artifacts;
- documented dependencies on regional and global services;
- offline CHW queue capability to tolerate temporary service disruption.

### 8.2 Cross-region recovery

Cross-region recovery will be evaluated in v1.0 and may use an approved secondary region such as `europe-west1` only after documenting:

- which data is replicated;
- whether replication is continuous or backup-based;
- encryption and key ownership;
- cross-border data assumptions;
- failover and failback authority;
- recovery time and recovery point targets;
- service compatibility;
- expected steady-state and test cost;
- deletion and retention behaviour.

No active-active multi-region design is assumed in v0.2.

## 9. Location-policy enforcement

The landing zone should enforce or validate approved locations through:

- organisation policy where available;
- Terraform input validation;
- policy-as-code checks in pull requests;
- project-factory defaults;
- asset inventory queries;
- posture findings for out-of-policy resources;
- exception records with owner and expiry date.

Expected policy behaviour:

1. A resource in an unapproved region is blocked where enforcement is available.
2. Unsupported enforcement cases produce a finding before production promotion.
3. Exceptions require a documented owner, reason, scope, compensating controls, and expiry.

## 10. Region-selection checklist

Before adding a service or changing location, confirm:

- the service is available in the proposed region;
- required features are available there;
- dependencies use compatible locations;
- data classification permits the location;
- latency is acceptable for expected users;
- backup and recovery locations are known;
- logging and key locations are compatible;
- egress and replication costs are understood;
- Terraform and policy checks support the decision;
- the change does not weaken country isolation.

## 11. Validation evidence

Planned evidence includes:

- Terraform validation rejecting an unapproved region;
- an organisation-policy or policy-as-code result;
- inventory of deployed resources grouped by location;
- service-availability verification for selected components;
- backup-location configuration;
- a documented exception test;
- regional recovery exercise results in the resilience phase.

## 12. Related objectives and threats

### Security objectives

- CSPM-03 — enforce approved locations;
- GOV-01 — enforce resource metadata;
- GOV-03 — require controlled infrastructure changes;
- GOV-06 — support country onboarding;
- RES-01 — support regional resilience;
- RES-02 — validate backup restoration;
- RES-04 — document recovery objectives.

### Threats

- TH-015 — cross-country analytics export contains identifiable data;
- TH-016 — cloud posture drift creates an unmonitored exposure;
- TH-021 — backup exposure or uncontrolled restoration;
- TH-022 — regional disruption prevents access to critical workflows.

## 13. Review triggers

Review this strategy when:

- Google Cloud launches another relevant African region;
- a required service is unavailable in `africa-south1`;
- a new country is added;
- legal or contractual requirements change;
- cross-region replication is introduced;
- recovery objectives change;
- a region outage or exercise exposes a design weakness;
- material latency or cost evidence justifies a different placement.
