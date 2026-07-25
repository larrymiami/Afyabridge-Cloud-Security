# Logging and Asset Inventory

## Purpose

This document defines how AfyaBridge centralizes security-relevant logs and cloud-asset metadata across the Google Cloud resource hierarchy.

The design supports:

- security monitoring;
- incident investigation;
- IAM and configuration review;
- posture and drift detection;
- ownership and cost attribution;
- evidence retention;
- country and environment traceability.

## Design principles

1. Security-relevant logs are routed to a dedicated logging project.
2. Security teams receive read access without broad administration of source projects.
3. Production country boundaries remain visible in log and asset metadata.
4. Log routing, buckets, retention, and access are managed as code.
5. Sensitive application fields must not be logged.
6. Asset inventory is queryable by owner, country, environment, workload, and classification.
7. Centralization must not create a new unrestricted path into workload data.

## Central logging architecture

The target project is:

```text
afyabridge-common-logging
```

Organization- or folder-level aggregated sinks route selected logs from child resources into controlled destinations in the logging project.

Recommended destinations:

| Destination | Purpose |
|---|---|
| Log bucket | Operational search, investigation, dashboards, and alerting |
| BigQuery dataset | Longer-term analysis, joins, reporting, and selected evidence queries |
| Cloud Storage archive | Optional low-cost immutable or long-retention evidence where justified |
| Pub/Sub topic | Optional event delivery to detection or response automation |

The first implementation should prioritize a central log bucket. Additional destinations are introduced only when they serve a defined query, retention, or automation requirement.

## Sink model

The initial sink hierarchy is:

```text
Organization or top-level folder
  -> aggregated security sink
      -> central logging project

Production folder or country folder
  -> optional scoped sink for country-specific retention or access

Individual project
  -> service-specific sink only when central routing cannot meet the requirement
```

Aggregated sinks should include descendants. Sink writer identities receive only the destination permissions required to write logs.

## Required log sources

The baseline includes selected records from:

- Cloud Audit Logs;
- IAM policy and service-account changes;
- organization-policy changes;
- project, folder, and billing changes;
- deployment and build activity;
- Artifact Registry activity;
- Secret Manager access;
- Cloud KMS administration and cryptographic access;
- VPC firewall and load-balancer logging where enabled;
- Cloud Armor events;
- Cloud Run request and platform logs;
- GKE audit and workload logs when introduced;
- database administrative and access events where supported;
- Security Command Center findings where available;
- application authentication, authorization, and audit events.

Data Access audit logs may increase cost significantly and should be enabled selectively for high-value services and validated use cases.

## Log classification

| Class | Examples | Handling |
|---|---|---|
| Security critical | IAM grants, key use, secret access, policy changes, public exposure | Centralized, alerted, retained per security requirement |
| Operational | Deployments, service errors, health checks | Centralized with cost-aware retention |
| Application audit | Login, authorization failure, record access, content changes | Structured, minimized, country-aware |
| Debug | Development troubleshooting | Short retention; disabled or sampled in production |
| Restricted | Raw personal or health information | Must not be logged |

## Structured application logging

Application logs should use structured fields such as:

```text
service
project_id
environment
country
request_id
trace_id
actor_type
actor_id_hash
action
resource_type
result
severity
```

Logs must not contain:

- names;
- phone numbers;
- addresses;
- clinical or maternal-care notes;
- authentication tokens;
- secrets;
- raw request or response bodies containing restricted data.

## Retention

Retention is set by log class and operational need rather than one universal period.

The design should support:

- short retention for high-volume debug logs;
- standard retention for operational logs;
- longer retention for security audit and incident evidence;
- locked retention only where the evidence requirement justifies the operational cost and reduced flexibility.

Retention periods must be implemented through configuration and reviewed against cost controls.

## Access model

Suggested role separation:

| Persona | Access |
|---|---|
| Security analyst | Read security logs and findings; create approved queries and alerts |
| Incident responder | Time-bound expanded read access and evidence export |
| Platform engineer | Read operational logs for owned services |
| Country operator | Read approved country-scoped operational views |
| Logging administrator | Manage sinks, buckets, retention, and exclusions without workload administration |
| Auditor | Read selected immutable evidence and configuration history |

Access to central logs does not automatically grant access to source projects or protected data services.

## Log integrity and availability

Controls include:

- sinks and destinations managed through Terraform;
- restricted sink administration;
- audit logging for sink, bucket, exclusion, and retention changes;
- alerts for disabled sinks or reduced retention;
- separate logging administration from workload administration;
- periodic test events proving delivery from representative projects;
- documented recovery steps for misrouted or interrupted logging.

## Cloud Asset Inventory

Cloud Asset Inventory provides organization-, folder-, and project-level visibility into resources and IAM policies.

The design uses:

1. on-demand search for resource and IAM investigation;
2. scheduled snapshots exported to BigQuery;
3. optional asset-change feeds to Pub/Sub for near-real-time drift workflows;
4. inventory queries that verify mandatory metadata and expected hierarchy placement.

## Asset inventory dataset

The target analytical destination is a controlled BigQuery dataset in the security or logging project.

Expected inventory dimensions include:

- resource type;
- project and folder ancestry;
- country;
- environment;
- owner;
- workload;
- data classification;
- cost centre;
- region or location;
- creation and update timestamps;
- IAM bindings;
- public exposure indicators;
- encryption configuration;
- lifecycle and expiry metadata.

## Core inventory queries

The initial query catalogue should detect:

- projects outside the approved folder hierarchy;
- resources missing required labels;
- resources in unapproved locations;
- public buckets or databases;
- user-managed service-account keys;
- basic `Owner` or `Editor` grants;
- cross-country IAM bindings;
- orphaned resources without owners;
- expired sandbox resources;
- workloads using unexpected service accounts;
- manually created resources that differ from Terraform state.

## Drift and findings workflow

```text
Asset snapshot or change event
  -> policy or query evaluation
  -> finding with severity and owner
  -> remediation pull request or incident
  -> validation
  -> closure evidence
```

Findings must have:

- unique ID;
- affected asset;
- detection source;
- severity;
- owner;
- due date;
- remediation action;
- status;
- closure evidence.

## Validation

The design is validated by controlled tests that:

- generate an IAM change and confirm centralized delivery;
- access a secret or key and confirm an audit event is searchable;
- create a non-compliant labeled resource and detect it in inventory;
- create a controlled public-access configuration and detect it;
- disable or alter a sink in a test scope and trigger an alert;
- prove a country operator cannot query another country’s restricted view.

## Mapped objectives and threats

Primary objectives:

- `MON-01`
- `MON-02`
- `MON-03`
- `MON-06`
- `CSPM-01`
- `CSPM-02`
- `CSPM-05`
- `CSPM-06`
- `CSPM-07`
- `IR-03`

Primary threats:

- `TH-003`
- `TH-005`
- `TH-011`
- `TH-014`
- `TH-015`
- `TH-016`
- `TH-017`
- `TH-021`

## Implementation status

**Designed** — centralized routing, inventory, access, retention, and validation requirements are documented. No sink, bucket, export, feed, query, or alert is represented as implemented yet.
