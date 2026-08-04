# Backup and Recovery Architecture

## Status

**Designed**

## Purpose

This document defines how AfyaBridge protects recoverable copies of production data, separates backup administration from workload administration, validates restoration, and prevents recovery processes from bypassing country, classification, retention, or access boundaries.

## Objectives

The backup and recovery design must:

1. Support recovery from accidental deletion, corruption, failed deployment, ransomware, and regional service disruption.
2. Keep Kenya, Ghana, and South Africa production backups separated.
3. Prevent production backups from becoming an uncontrolled source of Restricted data.
4. Protect backup data with encryption, least privilege, retention controls, and monitoring.
5. Define recovery objectives by service criticality.
6. Validate restoration through scheduled tests rather than assuming backup success implies recoverability.
7. Preserve audit evidence for backup creation, restore requests, restore execution, and post-restore validation.

## Backup scope

Backup coverage must include, where applicable:

- transactional databases;
- object-storage data;
- configuration required to reconstruct services;
- encryption and secret dependencies needed for restoration;
- infrastructure-as-code state and versioned configuration;
- audit and security logs according to their retention requirements;
- metadata required to interpret restored records;
- queues or durable event stores where loss would create clinical or operational inconsistency.

Ephemeral caches, rebuildable artifacts, and stateless runtime instances do not require backup when reconstruction is documented and tested.

## Recovery tiers

| Tier | Example workloads | Target RPO | Target RTO | Validation expectation |
|---|---|---:|---:|---|
| Tier 1 | Country clinical and referral systems of record | 15 minutes | 4 hours | Quarterly restore exercise and annual end-to-end recovery simulation |
| Tier 2 | Household, programme, and operational records | 4 hours | 12 hours | Semiannual restore exercise |
| Tier 3 | Derived analytics and rebuildable reporting data | 24 hours | 48 hours | Annual rebuild or restore validation |
| Tier 4 | Reproducible configuration and non-critical supporting data | Best effort | 72 hours | Recovery procedure reviewed annually |

These are architecture targets. Implemented values must be verified against selected services and operating cost before approval.

## Country separation

- Production backups remain associated with their source country.
- A country backup must not be restored into another country environment without an approved legal, security, and data-governance decision.
- Production backups must not be restored into development or sandbox environments.
- Shared recovery tooling may orchestrate jobs but must not receive unrestricted access to backup contents across countries.
- Backup identities, storage locations, keys, and restore permissions are scoped by country and environment.

## Backup isolation

Backups must be isolated from routine workload modification paths.

Required controls include:

- dedicated backup service identities;
- separate permissions for backup creation and restore execution;
- deletion protection or immutable retention where supported and justified;
- restricted administrative access;
- independent monitoring of backup policy changes and deletion attempts;
- protection against a compromised application identity deleting both primary and backup copies;
- no public access to backup repositories.

## Encryption and key dependencies

Backup copies inherit the source data classification.

- Restricted and Confidential backups require encryption at rest and in transit.
- Country production backups use country-scoped key hierarchies where CMEK is selected.
- Key-retention periods must cover all backups that depend on historical key versions.
- Key disablement or destruction requires analysis of backup and restoration impact.
- Recovery runbooks must identify the keys, secrets, service identities, and certificates needed to restore service.

## Restore authorization

Restore operations are privileged actions.

A restore request must include:

- incident or change identifier;
- business reason;
- source backup and restore point;
- target country and environment;
- expected data classification;
- proposed restore operator;
- independent approver;
- validation and rollback plan;
- deletion plan for temporary restored copies.

High-risk restores require two-person approval. Emergency restoration may use the break-glass process, but retrospective review remains mandatory.

## Restore patterns

### In-place recovery

Used only when the service supports controlled point-in-time recovery and the impact is understood. A verified pre-change recovery point should exist before destructive remediation.

### Side-by-side recovery

Preferred for investigation and validation. The backup is restored into an isolated, temporary recovery environment with no public exposure and tightly restricted access. Data is compared and validated before approved cutover or selective recovery.

### Partial data recovery

Selective record recovery must preserve referential integrity, audit history, classification, and authorization boundaries. Manual copy-and-paste recovery of Restricted records is prohibited.

## Recovery environment controls

Temporary recovery environments must:

- remain in the source country boundary;
- use isolated projects, networks, or service boundaries where practical;
- disable public access;
- use temporary, named access grants;
- restrict outbound connectivity;
- record all administrative and data access;
- inherit source encryption and classification requirements;
- be destroyed after validation and evidence capture.

## Restore validation

A restore is not successful until validation confirms:

- restored data is readable and internally consistent;
- required key versions and secrets are available;
- application authentication and authorization still function;
- country and tenant boundaries are preserved;
- expected record counts and integrity checks pass;
- dependent storage objects and references resolve;
- logging and monitoring are active;
- no prohibited external integrations were triggered;
- temporary elevated access has been removed.

Clinical or operational owners must participate when technical checks cannot establish business correctness.

## Testing programme

Scheduled recovery testing must include:

1. selection of representative backup sets;
2. restoration into an isolated target;
3. integrity and application validation;
4. measurement of actual RPO and RTO;
5. verification of key and secret dependencies;
6. confirmation that restored data remains country-scoped;
7. destruction of temporary recovery resources;
8. recording of gaps, owners, and remediation dates.

A successful backup job without a successful restore test is insufficient evidence of recoverability.

## Monitoring and alerts

Monitor and alert on:

- failed or delayed backup jobs;
- backup coverage gaps;
- disabled backup policies;
- shortened retention periods;
- unusual backup deletion activity;
- restore operations;
- access to backup repositories;
- key disablement affecting backup readability;
- restoration outside approved locations or projects;
- recovery tests that exceed target RPO or RTO.

## Evidence

Implementation evidence should include:

- backup policy configuration;
- resource inventory mapped to backup coverage;
- encryption and key associations;
- access-policy exports;
- successful backup records;
- restore-test reports;
- measured RPO and RTO;
- temporary environment deletion evidence;
- incident or change records for production restores;
- unresolved recovery risks.

## Prohibited patterns

- Treating replication as a substitute for backup
- Restoring production data into development for convenience
- Cross-country restores without formal approval
- Shared administrator accounts for restore activity
- Backup repositories writable by routine application identities
- Destroying key versions while dependent backups remain in retention
- Declaring recovery capability based only on backup-job success
- Retaining temporary recovery copies indefinitely

## Related documents

- [`data-classification.md`](./data-classification.md)
- [`encryption-at-rest.md`](./encryption-at-rest.md)
- [`key-management.md`](./key-management.md)
- [`retention-and-deletion.md`](./retention-and-deletion.md)
- [`data-residency.md`](./data-residency.md)
- [`../diagrams/backup-recovery-flow.md`](../diagrams/backup-recovery-flow.md)
