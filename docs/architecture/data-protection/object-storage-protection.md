# Object Storage Protection

## Purpose

This document defines security requirements for object storage used by AfyaBridge for documents, attachments, exports, backups, audit artifacts, generated reports, analytics outputs, and temporary processing files.

Object storage is treated as a governed data platform rather than a generic file drop. Every bucket and object flow requires an owner, classification, purpose, country, environment, retention rule, access model, and monitoring plan.

## Design principles

- Buckets are separated by country, environment, purpose, and classification.
- Public access is prohibited unless the bucket is explicitly designed for Public content.
- Restricted and Confidential objects use private access paths.
- Access is identity-based, least-privilege, and attributable.
- Production data is not copied into development or sandbox buckets.
- Signed access is short-lived, purpose-specific, and revocable through policy or object removal.
- Temporary objects have explicit expiry.
- Backups and exports inherit the source classification and residency requirements.
- Object creation, retrieval, deletion, policy change, and bulk export activity are monitored.

## Bucket segmentation

Recommended bucket boundaries include:

| Bucket purpose | Example contents | Boundary expectations |
|---|---|---|
| Country production documents | referral attachments, clinical documents | Separate per country; Restricted; private |
| Country production exports | approved operational exports | Separate per country and export workflow; short retention |
| Country production backups | database or application backup objects | Separate per country; restricted restore access |
| Shared security evidence | approved audit evidence and configuration snapshots | No health records; restricted security access |
| Non-production synthetic assets | test documents and fixtures | Synthetic only; separate from production |
| Public assets | published static content | Explicitly approved Public data only |

A single organization-wide bucket containing mixed countries, environments, and classifications is prohibited.

## Naming and metadata

Bucket names follow the repository naming standard and identify country, environment, workload, and purpose without exposing patient or programme details.

Objects use opaque identifiers rather than names, phone numbers, record numbers, or health conditions in object keys.

Required metadata should include:

- data classification;
- country owner;
- environment;
- source system;
- retention category;
- creation workflow;
- legal-hold indicator where applicable;
- integrity or version information where required.

Sensitive values must not be placed in user-controlled metadata fields that may be broadly visible in logs or inventory systems.

## Access model

- Applications receive access only to the buckets and object prefixes required for their function.
- Upload permissions do not automatically include list, read, overwrite, or delete permissions.
- Download permissions do not automatically include bulk listing.
- Exporter identities cannot administer bucket IAM or retention policy.
- Backup identities cannot read unrelated document buckets.
- Human access to Restricted production objects is temporary, approved, country-scoped, and logged.
- Security reviewers may inspect policy and access telemetry without routine content access.

Legacy object-level ACLs are avoided where uniform policy enforcement is available. Access is governed through centralized IAM and condition-based restrictions where practical.

## Upload controls

Upload workflows must validate:

- authenticated uploader and approved application context;
- country and record assignment;
- declared content type and actual file signature;
- maximum object size;
- permitted file types;
- malware or content scanning requirements;
- object name generation;
- metadata classification;
- destination bucket and prefix;
- duplicate and overwrite behavior.

User-supplied filenames are treated as display metadata, not as trusted storage paths.

Uploaded files are quarantined or marked unavailable until mandatory validation completes. A failed scan or validation result does not move the object into the trusted document path.

## Download controls

Applications authorize every download using current application context. Possession of an object identifier is not sufficient authorization.

Preferred delivery patterns include:

- authenticated application streaming for highly sensitive or policy-heavy access;
- short-lived signed URLs after server-side authorization;
- one-time or narrowly scoped download tokens where supported.

Signed URLs must:

- expire quickly;
- be limited to the required HTTP method;
- refer to one object or narrow purpose;
- avoid embedding sensitive user information;
- be issued only after authorization;
- not be logged in full by application or analytics tooling.

Signed URLs are bearer capabilities and are therefore not equivalent to identity-bound access after issuance.

## Encryption

Objects are encrypted at rest according to the encryption architecture. Restricted production buckets use the approved country- and environment-scoped key model where CMEK is selected.

Transport encryption is required for upload, download, replication, backup, and administrative operations.

Client-side encryption is used only when a documented threat model justifies it and key recovery, metadata handling, malware scanning, search, and lifecycle operations are addressed.

## Versioning and overwrite protection

Versioning may be enabled where recovery from accidental or malicious overwrite is required. Versioning is not a substitute for backup because attackers or administrators may still delete versions if policy allows it.

High-risk backup and evidence buckets should consider retention controls, object holds, or immutable retention periods where operationally and legally appropriate.

Retention settings must be tested because misconfiguration can make data undeletable or permit premature removal.

## Lifecycle and deletion

Every bucket has a lifecycle policy aligned with the retention-and-deletion design.

Lifecycle rules cover:

- temporary upload quarantine;
- failed processing objects;
- completed exports;
- superseded document versions;
- backup generations;
- multipart or incomplete uploads;
- audit evidence;
- legal or investigation holds.

Application deletion and storage deletion are coordinated. Removing a database pointer without deleting or retaining the associated object according to policy creates orphaned sensitive data.

Deletion evidence records the object class, country, workflow, time, authorizing reason, and result without exposing the object contents.

## Export buckets

Exports are written to dedicated short-lived buckets or prefixes, not to general document storage.

Controls include:

- approved exporter identity;
- purpose and recipient validation;
- minimum necessary fields;
- encryption and integrity protection;
- short retention and automatic deletion;
- download limit or expiry where feasible;
- access logging;
- prevention of anonymous sharing;
- confirmation that the recipient accepted handling obligations.

Bulk export generation is a high-risk event and generates an alert or review record.

## Backups and recovery objects

Backup objects inherit the source classification and country boundary.

Restore permissions are narrower than ordinary object-read permissions. Restored data is placed into an isolated recovery environment until validation confirms the intended access, network, encryption, and logging controls.

Cross-country backup copies are prohibited unless explicitly approved by the residency architecture and legal review.

## Public content

Public buckets or public delivery paths contain only data classified Public and approved for publication.

Controls include:

- separate projects or buckets from sensitive storage;
- no wildcard upload rights;
- deployment through controlled automation;
- integrity and cache-control settings;
- inventory review for unexpected object types;
- prevention of accidental policy inheritance from public assets to private buckets.

A public website requirement never justifies making a mixed-content bucket public.

## Monitoring and detections

Priority detections include:

- public-access policy added to a non-public bucket;
- broad principal or wildcard IAM grant;
- disabled access logging or inventory;
- high-volume reads, writes, or deletes;
- bulk download of Restricted objects;
- signed URL issuance spikes;
- object access by an unexpected workload identity;
- production object creation in non-production;
- cross-country copy or replication;
- retention policy reduction or removal;
- deletion of backup or evidence objects outside policy;
- malware scan bypass or failed quarantine enforcement;
- bucket creation without required labels and owner.

## Validation requirements

Before this design is marked implemented, evidence must show:

1. Restricted production buckets are not public;
2. country and environment storage boundaries are enforced;
3. runtime identities have only required bucket and object permissions;
4. signed links expire and cannot be widened by the client;
5. upload validation rejects seeded unsafe files and metadata;
6. temporary exports expire automatically;
7. lifecycle rules delete seeded expired test objects;
8. cross-country and production-to-non-production copies are denied or detected;
9. backup retention and restore controls work as designed;
10. policy-change and bulk-access alerts reach an assigned owner.

## Status

**Designed.** No bucket, lifecycle rule, retention setting, signed-access mechanism, malware scan, IAM policy, or alert is considered implemented until configuration, tests, and evidence exist.
