# Billing and Cost Controls

## 1. Purpose

This document defines the billing, budgeting, attribution, and cleanup controls for the AfyaBridge Cloud Security landing zone.

The goal is to prevent unmanaged cloud spend while preserving enough flexibility to validate security, resilience, and multi-country architecture decisions.

Cost controls do not replace security controls. A cheaper design is not acceptable when it weakens isolation, auditability, data protection, or recovery requirements without an explicit risk decision.

## 2. Objectives

The landing zone must:

- associate every project with an approved billing account;
- assign ownership and cost attribution metadata;
- establish project and environment budgets;
- alert before expected limits are exceeded;
- identify abnormal or unexpected spend;
- ensure temporary resources have expiry and cleanup mechanisms;
- distinguish steady-state cost from short-lived test cost;
- prevent abandoned projects and retained data from creating ongoing charges;
- preserve sufficient billing evidence for architecture and operational review.

## 3. Billing model

The initial model uses one approved billing account with cost separated through folders, projects, labels, and exported billing data.

| Scope | Billing approach |
|---|---|
| Bootstrap | Dedicated project budget and strict service allowlist |
| Common services | Shared-platform budgets by project |
| Production countries | Separate budget per country project group |
| Development | Shared non-production budget |
| Staging | Shared non-production budget with separate alerts |
| Sandbox | Low budget, short lifetime, and aggressive cleanup |

A future enterprise deployment may use separate billing accounts for legal entities or operational divisions. That is not required for the initial design.

## 4. Cost ownership

Every project must have:

- an accountable owner team;
- a cost centre;
- an environment;
- a country or shared scope;
- a workload or platform purpose;
- an approved budget;
- a documented cleanup or retention policy.

Initial cost-centre values are defined in [`naming-and-labeling.md`](./naming-and-labeling.md).

Country production costs should be attributable to:

```text
country-ke
country-gh
country-za
```

Common-service costs should be attributable to:

```text
shared-platform
shared-security
shared-network
```

## 5. Budget hierarchy

Budgets should be created at multiple levels where the billing platform permits useful attribution.

### 5.1 Billing-account budget

Purpose:

- detect total lab spend outside expected bounds;
- provide a final safety threshold;
- expose charges from projects missing lower-level budgets.

### 5.2 Project budgets

Every active project must have a project-specific budget.

Project budgets should reflect:

- expected steady-state resources;
- temporary test resources;
- logging and storage growth;
- data transfer;
- backup retention;
- vulnerability scanning and security services;
- expected resilience-test spikes.

### 5.3 Sandbox budgets

Sandbox projects or resources must use the lowest practical budget and must not be treated as persistent infrastructure.

A sandbox budget alert is not permission to continue spending. Sandbox resources must also have an expiry and cleanup mechanism.

## 6. Alert thresholds

Initial budget notifications should be configured at:

- 50% of forecast or actual budget;
- 75%;
- 90%;
- 100%;
- 125% as an overrun escalation threshold.

Forecast alerts should be enabled where supported.

Alert recipients should include:

- platform engineering;
- the project or country owner;
- security engineering when security services or incident activity are involved.

Budgets and alerts do not automatically cap usage. Any automated shutdown or quota action must be designed carefully to avoid destroying evidence, backups, state, or critical security telemetry.

## 7. Initial planning envelopes

The repository does not define fixed production commitments. Actual budgets will be set when implementation choices, service tiers, traffic assumptions, and the available billing account are known.

For planning, each environment should maintain an estimate with these categories:

| Category | Examples |
|---|---|
| Compute | Cloud Run, GKE, workers, build minutes |
| Data | Cloud SQL, object storage, backups, snapshots |
| Network | Internet egress, inter-region transfer, load balancing |
| Security | logging, scanning, KMS, Secret Manager, posture services |
| Delivery | Artifact Registry, CI/CD, provenance storage |
| Observability | metrics, traces, retained logs, alerts |
| Resilience tests | temporary secondary resources, restore environments |

Estimates must distinguish:

- monthly steady-state;
- one-time setup cost;
- periodic test cost;
- worst-case temporary cost;
- cleanup assumptions.

## 8. Cost-control guardrails

### 8.1 Project creation

A project may not be created without:

- billing-account association;
- budget definition;
- labels and owner metadata;
- approved service scope;
- lifecycle classification;
- Terraform management.

### 8.2 Service enablement

Google Cloud APIs should be enabled through Terraform or the project factory.

Service enablement must consider:

- direct service cost;
- dependent service cost;
- default log volume;
- storage retention;
- network egress;
- minimum commitments or reserved capacity.

### 8.3 Resource sizing

Initial deployments should use the smallest size that still supports the validation objective.

Production-like tests may temporarily use larger resources, but must include:

- start and end time;
- owner;
- expected cost;
- cleanup verification.

### 8.4 Autoscaling

Autoscaling configurations require:

- maximum instance or node limits;
- request and concurrency assumptions;
- denial-of-service considerations;
- alerting for unexpected scale;
- protection against runaway retry loops.

Unlimited scaling is prohibited.

### 8.5 Logging

Logging controls must balance investigation requirements and cost.

The design should:

- retain security-critical logs for the documented evidence period;
- avoid logging restricted payloads;
- route only required logs to long-retention buckets;
- use exclusions only after evaluating security impact;
- monitor unexpected log-volume growth;
- assign retention by log class rather than using one setting for all logs.

### 8.6 Storage and backups

Storage resources require:

- lifecycle rules where appropriate;
- explicit retention;
- versioning only where justified;
- backup expiration;
- deletion protection decisions;
- owner and classification metadata;
- periodic restore validation for protected data.

Data must not be retained indefinitely merely because storage appears inexpensive.

### 8.7 Network egress

Architectural review is required for:

- cross-region replication;
- high-volume analytics export;
- public data transfer;
- external security integrations;
- repeated image or dependency downloads;
- traffic between country projects and shared services.

Egress should be estimated before enabling multi-region or external-data flows.

## 9. Temporary-resource management

Temporary resources must include:

- owner;
- expiry date;
- environment;
- cost centre;
- Terraform stack;
- cleanup command or automation.

The cleanup process should identify:

- expired sandbox resources;
- unattached disks and IP addresses;
- old snapshots and backups;
- unused load balancers;
- obsolete container images;
- inactive databases;
- orphaned projects;
- old log buckets or exports;
- stale state locks and temporary deployment resources.

Cleanup automation must not delete production resources solely because metadata is missing. Missing metadata should generate a finding for review.

## 10. Quotas and limits

Quotas should be treated as both operational and cost controls.

The project should define limits for:

- Cloud Run maximum instances;
- GKE node counts when introduced;
- build concurrency;
- external IP addresses;
- storage growth where enforceable;
- API request rates;
- Pub/Sub retention;
- log ingestion and retention;
- backup count and age.

Quota increases require a documented capacity reason and budget review.

## 11. Cost anomaly handling

Unexpected spend should generate an operational event.

The investigation process should review:

1. which billing account, project, service, SKU, region, and label generated the cost;
2. whether the increase was planned;
3. recent infrastructure changes;
4. autoscaling, retry, logging, storage, and egress behaviour;
5. whether suspicious activity or credential compromise is involved;
6. whether containment would affect evidence or recovery capability.

Possible responses include:

- reduce or stop a non-critical workload;
- correct an autoscaling or retry loop;
- remove orphaned resources;
- restrict a compromised identity;
- adjust logging filters after security review;
- update the budget only when the spend is legitimate and approved.

## 12. Billing export and reporting

A billing export should be configured when implementation begins.

The reporting model should support grouping by:

- project;
- folder or country;
- service and SKU;
- region;
- environment;
- owner;
- workload;
- cost centre;
- data classification where labels are available.

Reports should distinguish tagged and untagged spend so missing metadata remains visible.

No report may include credentials, personal data, or restricted application payloads.

## 13. Security-service cost decisions

Security controls must not be silently disabled because of cost.

When a premium or unavailable service is not activated, documentation must record:

- the intended control objective;
- the unavailable or deferred capability;
- the lower-cost control used instead;
- known coverage gaps;
- residual risk;
- the condition for reconsidering the service.

Examples may include advanced Security Command Center capabilities, premium WAF features, extended log retention, or enterprise SIEM integrations.

## 14. Teardown and account hygiene

Every implemented stack must support a documented teardown path.

Before teardown:

- preserve required evidence;
- confirm backup-retention decisions;
- export necessary logs and reports;
- ensure Terraform state remains recoverable;
- identify resources protected against deletion.

After teardown:

- run a cloud-asset inventory;
- confirm no unintended public resources remain;
- confirm no billable workloads remain;
- review retained buckets, logs, backups, keys, secrets, IP addresses, and projects;
- record expected residual charges such as delayed billing entries.

## 15. Planned controls and evidence

Planned evidence includes:

- Terraform-managed budgets;
- budget alert configuration;
- a billing export or equivalent report;
- cost grouped by country and environment;
- an unlabelled-resource report;
- expired sandbox-resource detection;
- maximum autoscaling configuration;
- cleanup logs and final asset inventory;
- cost estimate for cross-region recovery;
- documented premium-service exception where applicable.

## 16. Related objectives and threats

### Security objectives

- GOV-01 — enforce resource metadata;
- GOV-05 — control cloud cost;
- GOV-06 — support country onboarding;
- RES-05 — remove lab infrastructure safely;
- MON-01 — centralise security-relevant logs.

### Threats

- TH-009 — insecure infrastructure-as-code change;
- TH-016 — cloud posture drift creates an unmonitored exposure;
- TH-017 — monitoring or audit logging is disabled or bypassed;
- TH-018 — public endpoint abuse causes denial of service;
- TH-021 — backup exposure or uncontrolled restoration;
- TH-022 — regional disruption prevents critical workflows.

## 17. Review triggers

Review this document when:

- a new project or country is added;
- service tiers change;
- traffic or data volume changes materially;
- cross-region recovery is enabled;
- a cost anomaly occurs;
- a security control is deferred for cost reasons;
- billing-account structure changes;
- cleanup identifies repeated orphaned resources;
- project budgets no longer reflect observed usage.
