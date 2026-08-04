# Data Protection and Encryption Architecture

## Purpose

This section defines how AfyaBridge classifies, stores, encrypts, retains, backs up, exports, and destroys health, identity, operational, and security data across Kenya, Ghana, and South Africa.

The design applies to production and non-production systems, including application databases, object storage, logs, backups, analytics datasets, integration payloads, local offline caches, exports, and cryptographic key material.

## Design goals

The data-protection architecture must:

1. Assign an authoritative classification to every data asset.
2. Keep country production data within its approved country boundary unless a documented exception exists.
3. Encrypt sensitive data in transit and at rest.
4. Separate key administration from data administration.
5. Prevent secrets from being stored in source code, images, tickets, or plaintext configuration.
6. Limit collection, storage, replication, and export to defined purposes.
7. Preserve recoverability without creating uncontrolled backup copies.
8. Support verified retention, legal hold, deletion, and destruction.
9. Minimize sensitive data in logs, telemetry, analytics, and support workflows.
10. Produce evidence before any protection control is marked implemented.

## Core principles

- Classification follows the data through storage, transport, derivation, export, backup, and deletion.
- Health data and direct identifiers receive the strongest default handling.
- Country production datasets are isolated by project, service, key scope, backup scope, and access policy.
- Encryption does not replace authorization, minimization, retention, or monitoring.
- Pseudonymized data remains sensitive when re-identification is reasonably possible.
- Derived data inherits the highest classification of its material inputs unless a documented de-identification assessment proves otherwise.
- Production data is not copied into lower environments.
- Sensitive exports are exceptional, approved, attributable, time-bound, and monitored.
- Backups are governed data assets, not operational leftovers.
- Data-protection status remains **Designed** until configuration, tests, deployment, and evidence exist.

## Data domains

| Domain | Examples | Default owner |
|---|---|---|
| Patient and household data | names, contacts, demographics, household membership | country programme owner |
| Clinical and referral data | symptoms, assessments, diagnoses, referrals, outcomes | country clinical owner |
| Workforce data | staff identities, roles, access records | workforce or HR owner |
| Operational data | facilities, programmes, queues, service metrics | country operations owner |
| Security data | authentication events, audit logs, detections, incident evidence | security owner |
| Integration data | webhook payloads, partner identifiers, delivery records | integration owner and country data owner |
| Analytics data | aggregated metrics, pseudonymized extracts, model features | analytics owner with source-owner approval |
| Cryptographic material | keys, secrets, certificates, tokens | security platform owner |

## Document index

| Document | Status | Purpose |
|---|---|---|
| [`data-classification.md`](./data-classification.md) | Designed | Data classes, handling rules, ownership, and downgrade requirements |
| [`data-flow-and-inventory.md`](./data-flow-and-inventory.md) | Designed | Data assets, systems of record, approved flows, and flow registration |
| [`encryption-at-rest.md`](./encryption-at-rest.md) | Designed | Storage encryption, key scope, and service-specific controls |
| [`encryption-in-transit.md`](./encryption-in-transit.md) | Designed | TLS, service authentication, private transport, and certificate requirements |
| [`key-management.md`](./key-management.md) | Designed | Key hierarchy, ownership, rotation, separation of duties, and recovery |
| [`secrets-management.md`](./secrets-management.md) | Designed | Secret storage, access, rotation, detection, and emergency handling |
| [`database-protection.md`](./database-protection.md) | Designed | Database isolation, access, masking, audit, and maintenance controls |
| [`object-storage-protection.md`](./object-storage-protection.md) | Designed | Bucket design, object access, lifecycle, upload, and download protections |
| [`backup-and-recovery.md`](./backup-and-recovery.md) | Designed | Backup scope, encryption, isolation, restoration, and evidence |
| [`retention-and-deletion.md`](./retention-and-deletion.md) | Designed | Retention schedules, legal holds, erasure, and destruction verification |
| [`data-residency.md`](./data-residency.md) | Designed | Country boundaries, replication restrictions, and transfer exceptions |
| [`exports-and-analytics.md`](./exports-and-analytics.md) | Designed | Approved extracts, de-identification, analytics, AI use, and downstream controls |
| [`data-protection-monitoring.md`](./data-protection-monitoring.md) | Designed | Data-access, key-use, export, deletion, residency, and backup detections |

## Diagrams

- [`../diagrams/data-protection-flow.md`](../diagrams/data-protection-flow.md)
- [`../diagrams/key-management-flow.md`](../diagrams/key-management-flow.md)
- [`../diagrams/backup-recovery-flow.md`](../diagrams/backup-recovery-flow.md)

## Architecture decisions

- [`../../adr/ADR-010-data-classification-and-handling.md`](../../adr/ADR-010-data-classification-and-handling.md)
- [`../../adr/ADR-011-customer-managed-encryption-keys.md`](../../adr/ADR-011-customer-managed-encryption-keys.md)
- [`../../adr/ADR-012-country-data-residency.md`](../../adr/ADR-012-country-data-residency.md)

## Related architecture

- [`../identity/application-authorization.md`](../identity/application-authorization.md)
- [`../identity/workload-identities.md`](../identity/workload-identities.md)
- [`../network/private-service-access.md`](../network/private-service-access.md)
- [`../network/service-to-service-traffic.md`](../network/service-to-service-traffic.md)
- [`../../security-objectives.md`](../../security-objectives.md)
- [`../../security-control-matrix.md`](../../security-control-matrix.md)
- [`../../threat-model/threat-register.md`](../../threat-model/threat-register.md)

## Current status

The v0.5 data-protection and encryption architecture is **Designed**. No classification, encryption, key-management, secret-management, backup, retention, deletion, residency, export, analytics, or monitoring control is considered implemented until configuration, tests, deployment, and evidence exist.
