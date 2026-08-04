# Retention and Deletion Architecture

## Status

**Designed**

## Purpose

This document defines how AfyaBridge assigns retention periods, applies legal or operational holds, deletes data across primary and secondary copies, and demonstrates that disposal has been completed without compromising auditability or recovery requirements.

## Principles

- Data is retained only for an approved purpose and period.
- Retention is defined by data category, country, system of record, and legal or contractual requirement.
- Longer retention requires documented justification.
- Deletion must propagate to replicas, indexes, caches, exports, object storage, queues, and temporary copies.
- Backup expiry is part of deletion, but active backups are not silently rewritten unless the platform and policy explicitly require it.
- Legal holds suspend scheduled deletion only for the affected scope.
- Destruction of encryption keys is not used as the routine substitute for record-level deletion.
- Deletion evidence must avoid reproducing the sensitive content being deleted.

## Retention schedule

The following table establishes design defaults rather than final legal determinations.

| Data category | Default retention approach | Owner |
|---|---|---|
| Clinical and referral records | Country-approved statutory or clinical period | Country data owner and legal/privacy function |
| Household and beneficiary records | Active programme period plus approved closeout period | Programme owner |
| Consent and authorization records | At least as long as the processing they authorize and any dispute period | Privacy owner |
| Identity and access records | Employment, contract, or account lifecycle plus security audit period | Identity owner |
| Security and audit logs | Risk-based period supporting investigation and compliance | Security owner |
| Financial and grant records | Contractual and statutory accounting period | Finance owner |
| Temporary uploads and processing files | Shortest operationally necessary period | Workload owner |
| Offline device records | Until successful sync, validation, and defined expiry | Product and security owners |
| Derived analytics | Approved analytical purpose and review period | Analytics data owner |
| Backups | Recovery policy period aligned to service tier | Service owner |

Each implemented retention rule must identify its authority, start event, duration, hold behavior, and deletion mechanism.

## Retention register

Every governed dataset must have a retention-register entry containing:

- dataset and system of record;
- country and environment;
- data owner;
- classification;
- processing purpose;
- legal, contractual, clinical, or operational authority;
- retention start event;
- retention period;
- deletion or anonymization action;
- backup treatment;
- hold capability;
- downstream copies;
- implementation owner;
- review date.

Datasets without an approved entry must not be assumed to have indefinite retention.

## Retention start events

Retention periods may begin from:

- record creation;
- last clinical encounter;
- programme closure;
- contract termination;
- user-account closure;
- consent withdrawal;
- case resolution;
- export creation;
- successful offline synchronization;
- backup creation.

The trigger must be machine-evaluable where automated deletion is expected.

## Deletion workflow

1. Identify records eligible for deletion.
2. Check legal, clinical, security, and operational holds.
3. Validate scope, country, tenant, and dependencies.
4. Create a deletion job with a unique identifier.
5. Delete or irreversibly anonymize primary records according to policy.
6. Propagate deletion to indexes, replicas, caches, search stores, queues, objects, and derived datasets.
7. Record pending expiry for retained backups.
8. Verify that application paths no longer return the deleted data.
9. Capture non-sensitive evidence and exceptions.
10. Close the job only after reconciliation succeeds.

## Deletion propagation

Deletion design must account for:

- relational and document databases;
- object-storage attachments;
- search indexes;
- analytics tables and materialized views;
- caches;
- event streams and dead-letter queues;
- offline device stores;
- exported reports;
- partner systems where AfyaBridge has contractual deletion rights;
- backup copies and restoration behavior.

A deletion API that affects only the primary database is incomplete.

## Backups and deletion

Backups are retained according to the approved recovery schedule and expire naturally unless a more immediate legally required process is technically and operationally supported.

During the backup-retention window:

- deleted records must not reappear in normal production access;
- restoring an older backup requires reapplication of completed deletion jobs before service return;
- recovery runbooks must include a deletion replay or reconciliation step;
- backup expiry dates must be recorded in deletion evidence;
- legal holds may extend backup retention for the defined scope.

## Legal and operational holds

A hold must include:

- requestor and approving authority;
- legal, regulatory, clinical, security, or investigation basis;
- affected datasets and record scope;
- country and environment;
- start date and review date;
- custodians;
- systems where deletion is suspended;
- release authority.

Holds must be narrowly scoped, reviewed periodically, and removed when the basis ends. A broad undocumented hold must not become indefinite retention.

## Anonymization and pseudonymization

Pseudonymization does not constitute deletion when re-identification remains reasonably possible.

Anonymization may satisfy a disposal requirement only when:

- direct identifiers are removed;
- indirect-identification risk is assessed;
- linkage keys are removed or separately destroyed;
- small groups and rare conditions are considered;
- downstream datasets are updated;
- the outcome is documented and approved.

## User and subject requests

Requests involving access, correction, restriction, objection, portability, or deletion must be routed through a documented privacy workflow. Engineering systems must not automatically promise deletion where another lawful or clinical retention obligation applies.

The decision and its basis must be recorded, including any data that cannot be deleted and the reason.

## Offline data

Offline records must have explicit expiry controls.

- Successfully synchronized data is removed after validation and a short recovery window.
- Abandoned drafts expire after an approved period.
- Device de-registration triggers local data revocation or deletion where technically possible.
- Lost-device response must support remote session revocation and minimize retained local content.
- Local deletion must include database records, files, caches, and temporary exports.

## Partner deletion

Contracts and integrations involving Restricted or Confidential data must define:

- partner retention limits;
- deletion-request mechanisms;
- deletion confirmation;
- backup treatment;
- subcontractor propagation;
- termination obligations;
- incident escalation when deletion fails.

## Monitoring

Monitor for:

- datasets without retention rules;
- failed or overdue deletion jobs;
- records retained beyond policy;
- legal holds beyond review dates;
- restoration of previously deleted records;
- abandoned exports or temporary files;
- partner deletion failures;
- offline records beyond expiry;
- unauthorized changes to retention configuration.

## Evidence

Implementation evidence should include:

- approved retention register;
- policy-as-code or lifecycle configuration;
- deletion-job logs and reconciliation results;
- legal-hold records;
- backup-expiry mapping;
- restored-backup deletion replay tests;
- partner deletion confirmations;
- exceptions and remediation records;
- periodic retention-review reports.

## Prohibited patterns

- Indefinite retention by default
- Using pseudonymization as automatic proof of deletion
- Deleting only the primary database record
- Restoring backups without replaying completed deletions
- Untracked spreadsheets or exports outside retention governance
- Legal holds with no owner or review date
- Logging full Restricted records as deletion evidence
- Routine key destruction as a substitute for selective deletion

## Related documents

- [`data-classification.md`](./data-classification.md)
- [`data-flow-and-inventory.md`](./data-flow-and-inventory.md)
- [`backup-and-recovery.md`](./backup-and-recovery.md)
- [`data-residency.md`](./data-residency.md)
- [`object-storage-protection.md`](./object-storage-protection.md)
