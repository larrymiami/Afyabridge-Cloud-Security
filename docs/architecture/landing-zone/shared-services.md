# Shared Services

## Purpose

This document defines the shared Google Cloud services used across AfyaBridge environments and country workloads.

Shared services centralise capabilities that benefit from consistent governance, security, and operational ownership. They must not become an unrestricted bridge between country or environment boundaries.

## Shared-services principles

1. Shared services provide platform capabilities, not broad access to workload data.
2. Each shared project has a narrow purpose and accountable owner.
3. Country and environment context is preserved in logs, artifacts, findings, and access policies.
4. Shared services expose only documented interfaces.
5. Access is granted through groups and dedicated service identities, not individual ad hoc bindings.
6. Production and non-production permissions remain distinct even when a service is shared.
7. Shared-service compromise must not automatically grant access to all country data.

## Project catalogue

| Project | Responsibility | Typical services |
|---|---|---|
| `afyabridge-common-security` | Security findings, detections, posture and response integrations | Security Command Center integrations, security dashboards, alert routing |
| `afyabridge-common-logging` | Central log storage and controlled security queries | Log sinks, log buckets, retention controls, audit-log analytics |
| `afyabridge-common-networking` | Shared connectivity and network governance | Shared VPC hosts, DNS forwarding, firewall policy, NAT and private connectivity |
| `afyabridge-common-cicd` | Deployment federation and automation identities | Workload Identity Federation, deployment service accounts, automation logs |
| `afyabridge-common-artifacts` | Trusted build and release artifacts | Artifact Registry, SBOMs, signatures, provenance and retention policies |
| `afyabridge-common-dns` | Authoritative platform DNS and certificate-related coordination | Cloud DNS zones, records and delegated administration |
| `afyabridge-bootstrap` | Terraform bootstrap and foundational automation | State buckets, bootstrap identities and project-factory prerequisites |

The final project count may be reduced in the lab when separate projects provide no meaningful control benefit. Any consolidation must retain logical ownership, IAM separation, labels, and evidence.

## Security project

The security project receives or references:

- cloud-security findings;
- selected high-severity alerts;
- IAM and KMS detections;
- public-exposure findings;
- vulnerability and artifact-trust results;
- incident-response evidence locations.

It must not contain unrestricted copies of application data.

Access is limited to security operators, approved auditors, and narrowly scoped automation identities.

## Logging project

The logging project centralises selected logs from workload and shared projects.

Expected sources include:

- Admin Activity audit logs;
- selected Data Access logs;
- IAM policy changes;
- KMS and Secret Manager access;
- deployment events;
- Cloud Run or GKE runtime logs;
- load-balancer and Cloud Armor logs;
- application audit events;
- Terraform and automation events.

Log records must retain source metadata such as:

- project ID;
- country;
- environment;
- service;
- owner;
- data classification where applicable.

Country operational teams may receive scoped views of their own logs without receiving global access.

## Networking project

The networking project hosts shared network controls where practical.

Responsibilities include:

- Shared VPC host projects;
- environment and country network segmentation;
- hierarchical firewall policy concepts;
- Cloud NAT and controlled egress;
- private service access;
- DNS forwarding;
- connectivity logging;
- approved hybrid or external connectivity patterns.

Shared networking does not imply unrestricted routing. Every route, firewall rule, attachment, and service interface must have an owner and documented purpose.

## CI/CD project

The CI/CD project contains cloud-side identities and federation configuration used by approved delivery workflows.

It must provide:

- GitHub Actions Workload Identity Federation;
- separate deployer identities per environment;
- restricted impersonation policies;
- short-lived credentials;
- deployment audit logs;
- no user-managed service-account keys;
- separation between bootstrap, infrastructure, and workload deployment identities.

GitHub remains the workflow orchestrator, while Google Cloud IAM determines the cloud permissions granted to each workflow context.

## Artifact project

The artifact project stores release inputs and outputs that require central trust and governance.

Expected content includes:

- container images;
- SBOMs;
- signatures;
- provenance attestations;
- vulnerability scan results;
- approved base images where used.

Controls include:

- immutable digest-based references;
- restricted writer identities;
- environment-aware promotion;
- retention and cleanup policies;
- vulnerability scanning;
- deployment verification of signatures and provenance.

Country workloads may pull approved artifacts but must not modify trusted release repositories.

## DNS project

The DNS project manages platform-owned zones and delegated records.

Responsibilities include:

- environment-specific DNS namespaces;
- country-specific application records;
- controlled record modification;
- certificate-related DNS validation;
- logging of administrative changes;
- preventing non-production identities from changing production records.

## Bootstrap project

The bootstrap project exists before most other landing-zone resources.

It contains only the minimum resources required to establish repeatable infrastructure management, including:

- Terraform state storage;
- state encryption and versioning;
- bootstrap service identities;
- project-factory prerequisites;
- initial federation configuration where needed;
- recovery documentation.

Application workloads must not run in the bootstrap project.

## Access model

| Role group | Shared-service access |
|---|---|
| Platform engineering | Manage approved platform components through Terraform |
| Security engineering | Read security telemetry and manage selected detections |
| Country operations | Scoped operational views for their country |
| Developers | Limited non-production service access |
| CI/CD identities | Narrow machine permissions for defined workflows |
| Auditors | Read-only evidence and selected logs |

## Cross-project communication

Cross-project access must use:

- dedicated service accounts;
- explicit IAM bindings;
- private or authenticated service interfaces;
- logged requests;
- environment and country conditions where supported;
- default-deny network posture.

Broad project-level primitive roles are prohibited for routine communication.

## Failure and compromise boundaries

The design assumes a shared service may fail or be compromised.

Required protections include:

- separate workload service accounts;
- restricted pull-only artifact access for runtimes;
- no application-data storage in CI/CD projects;
- scoped log access;
- independent country data projects;
- separate production deployment identities;
- backups and recovery procedures for critical shared configuration.

## Cost and availability

Shared services reduce duplication but can create central dependencies.

Each critical service must document:

- expected cost driver;
- availability characteristics;
- backup or reconstruction method;
- failure impact;
- recovery owner;
- whether a country workload can continue temporarily without it.

## Validation

The shared-services model will be validated through:

- denied cross-country log and data access tests;
- denied artifact-write attempts from runtime identities;
- deployment tests using environment-specific identities;
- inventory of cross-project IAM bindings;
- connectivity tests for approved and unapproved paths;
- reconstruction or recovery tests for bootstrap and shared configuration.

## Related objectives and threats

**Objectives:** IAM-01, IAM-02, IAM-05, NET-02, NET-03, SEC-02, SUP-02, SUP-03, SUP-04, MON-01, CSPM-06, GOV-03  
**Threats:** TH-004, TH-006, TH-008, TH-009, TH-013, TH-014, TH-016, TH-017, TH-019
