# Encryption at Rest

## Purpose

This document defines how AfyaBridge protects stored data across databases, object storage, backups, logs, queues, caches, analytics datasets, local devices, and temporary processing locations.

Encryption at rest is one layer in a broader protection model. It does not replace access control, data minimization, country isolation, retention enforcement, or monitoring.

## Design principles

- All stored customer data must be encrypted at rest.
- Restricted and Confidential production data requires documented key ownership and service coverage.
- Customer-managed encryption keys are used where the service supports them and the operational risk is justified.
- Country production data uses country-scoped keys and must not depend on another country's key hierarchy.
- Production and non-production resources never share encryption keys.
- Backups, replicas, exports, temporary files, dead-letter payloads, caches, and restored copies inherit the source data classification.
- Encryption status is verified through configuration evidence rather than assumed from platform defaults.
- Key access is separate from data access.
- Key destruction is a controlled data-destruction action, not a routine administrative shortcut.

## Protection layers

| Layer | Control | Purpose |
|---|---|---|
| Platform encryption | Google-managed encryption at rest | Baseline protection for supported Google Cloud services |
| Customer-managed encryption | Cloud KMS keys used by supported services | Key ownership, access control, auditability, disablement, and rotation |
| Application-level encryption | Envelope encryption for selected fields or payloads | Additional protection for narrowly defined high-impact data |
| Device encryption | Platform storage encryption plus application controls | Protection for approved offline data on managed devices |
| Backup encryption | Service-integrated encryption with country-scoped keys where supported | Protection of recovery copies and restored datasets |

## Key scope model

CMEK keys are separated by:

1. country;
2. environment;
3. data-service class;
4. operational purpose;
5. recovery or backup use where separation is required.

A single global production key is prohibited.

Illustrative production key scopes:

- `ke-prod-db`
- `ke-prod-object`
- `ke-prod-backup`
- `gh-prod-db`
- `gh-prod-object`
- `gh-prod-backup`
- `za-prod-db`
- `za-prod-object`
- `za-prod-backup`

Actual resource names follow the repository naming standard and remain subject to Google Cloud naming constraints.

## Service coverage

### Databases

Production databases containing Restricted data must use an approved encryption mechanism supported by the selected database service. Where CMEK integration is supported and operationally viable, the database uses a country-scoped database key.

Database replicas, point-in-time recovery data, snapshots, and exports must be included in the coverage assessment. A primary database protected by CMEK is not considered sufficient evidence that all recovery artifacts use the same control.

### Object storage

Buckets containing Restricted or Confidential production data must use country- and environment-scoped encryption settings. Default bucket keys, object-level overrides, lifecycle transitions, replication targets, and temporary upload locations must be reviewed.

Objects must not be written with an unapproved customer-supplied key or an unmanaged application key.

### Backups

Backup encryption is defined independently from primary-resource encryption. Backup vaults, snapshots, export buckets, archive copies, and restored resources require explicit key and residency validation.

A restore test must confirm that authorized recovery operators can use the required key while unauthorized environments and countries cannot.

### Logs and telemetry

Logs must avoid Restricted payloads wherever possible. When sensitive logs are unavoidable, the destination, retention period, access model, and encryption coverage must be documented.

Central security logging does not permit unrestricted storage of raw health records or authentication secrets.

### Messaging and queues

Message payloads, retry queues, dead-letter topics, and event archives inherit the classification of the contained data. Restricted payloads must be minimized and should use references or opaque identifiers instead of complete records where the workflow permits.

### Caches and temporary storage

Caches, temporary filesystems, batch-processing workspaces, local disks, and staging buckets are governed storage locations. They require encryption, bounded retention, and secure cleanup.

Restricted data must not be placed in unmanaged developer workstations, browser storage, CI runners, or build caches.

### Offline devices

Approved offline data must be protected by device encryption and application-level controls. Stored records must be:

- user- and device-bound;
- encrypted with platform-protected key material;
- minimized to the active assignment;
- unavailable after logout, revocation, or assignment expiry where technically feasible;
- securely removed following successful synchronization or retention expiry.

## Application-level encryption

Application-level encryption is reserved for data elements whose compromise impact justifies added operational complexity, such as selected identity-linking values, especially sensitive notes, or externally exchanged payloads.

The design must define:

- the exact fields or payloads;
- the threat addressed;
- the encryption boundary;
- the key-encryption key and data-encryption key lifecycle;
- search and indexing implications;
- backup and restore behaviour;
- rotation and re-encryption procedures;
- failure and recovery behaviour.

Application-level encryption must not be introduced as an undocumented substitute for access control or database design.

## Resource creation controls

Infrastructure policy should prevent or detect:

- production data resources without required CMEK configuration;
- use of non-production keys by production resources;
- use of another country's key;
- public or unmanaged storage for Restricted data;
- creation of persistent disks or snapshots outside approved projects or regions;
- disabling required encryption settings without an approved exception;
- key IAM bindings granted directly to broad human groups.

## Key access separation

Data readers and application workloads do not automatically receive key-administration permissions.

The minimum separation is:

| Capability | Expected principal |
|---|---|
| Use a key for an approved service | Service agent or workload identity |
| View key metadata | Security or platform read-only role |
| Change key IAM | Restricted key administrator role |
| Create or rotate key versions | Key management operator |
| Disable a key version | Privileged, approved operator |
| Destroy a key version | Two-person controlled process |

## Availability and failure behaviour

CMEK introduces a dependency between protected resources and Cloud KMS. Designs must account for:

- key-region compatibility;
- service-agent permissions;
- accidental disablement;
- IAM removal;
- rotation behaviour;
- deleted projects or keys;
- disaster-recovery access;
- regional service disruption;
- operational access during incident response.

The system must fail closed for unauthorized key use, while runbooks must support safe recovery from configuration errors.

## Rotation and re-encryption

Key rotation creates a new primary key version. Rotation alone does not prove that historical data has been re-encrypted under the new version.

For each service, the implementation plan must document:

- how new writes select the current primary version;
- whether existing data is re-encrypted automatically;
- whether manual rewrite or migration is required;
- how old versions remain available for reads and restores;
- when an old version may be disabled;
- how rollback is tested.

## Exceptions

A service may use Google-managed encryption instead of CMEK when:

- the service does not support CMEK;
- the data classification and threat assessment justify the baseline control;
- replacement architecture would create disproportionate availability or delivery risk;
- the exception has an owner, scope, expiry, and compensating controls.

Exceptions do not permit unencrypted storage.

## Validation requirements

Before marking encryption-at-rest controls implemented, evidence must show:

1. an inventory of covered data resources;
2. classification and country ownership;
3. the effective encryption configuration;
4. the key resource and location;
5. authorized key users and administrators;
6. successful service operation with the key;
7. denied cross-country and cross-environment use;
8. rotation behaviour;
9. backup and restore coverage;
10. alerting for key disablement, destruction, IAM change, and policy drift.

## Status

This architecture is **Designed**. No storage resource, CMEK binding, application encryption control, or device encryption requirement is considered implemented until configuration, testing, and evidence exist.
