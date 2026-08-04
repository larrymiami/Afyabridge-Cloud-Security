# Data Protection Monitoring

## Status

**Designed**

## Purpose

This document defines the monitoring, detection, review, and evidence requirements for AfyaBridge data-protection controls across databases, object storage, encryption keys, secrets, backups, exports, analytics, and country data boundaries.

Monitoring must make sensitive-data access and policy drift visible without copying unnecessary Restricted data into logs.

## Monitoring objectives

AfyaBridge must be able to detect and investigate:

- unexpected access to Confidential or Restricted data;
- bulk reads, exports, downloads, or object listings;
- access from unusual identities, locations, devices, or times;
- privilege changes affecting data, keys, secrets, or backups;
- disabled logging or shortened retention;
- public or overly broad storage exposure;
- unapproved cross-country or production-to-nonproduction transfers;
- key disablement, destruction, policy changes, or anomalous decrypt use;
- secret reads and version changes inconsistent with workload operation;
- backup failures, restore attempts, and recovery-policy drift;
- retention, deletion, or legal-hold failures;
- undeclared analytics datasets, exports, or replicas;
- sensitive data written to logs, queues, temporary storage, or unsupported services.

## Telemetry sources

| Source | Required visibility |
|---|---|
| Cloud audit logs | Administrative and data-access activity for protected services |
| Database audit logs | Authentication, privileged queries, schema changes, bulk access, export activity |
| Object-storage logs | Reads, writes, listings, policy changes, signed-access events where observable |
| Cloud KMS logs | Encrypt, decrypt, key-policy, rotation, disablement, destruction, and restoration events |
| Secret Manager logs | Secret access, new versions, IAM changes, disablement, and destruction |
| Backup service logs | Job status, retention changes, deletions, copies, restores, and failures |
| Data pipeline logs | Source, destination, schema, classification, lineage, and policy-check outcomes |
| Application audit events | Record views, edits, exports, elevated access, and authorization decisions |
| DLP or discovery results | Sensitive-data findings in approved scanning scopes |
| Asset inventory | Deployed stores, locations, labels, encryption settings, public exposure, and ownership |
| Endpoint and device events | Offline-data creation, sync, expiry, local deletion, and device compromise signals |

## Logging requirements

- Logs must identify the acting workforce or workload identity.
- Sensitive operations must include country, environment, service, resource, action, and outcome.
- Application audit events should include record or case references using non-sensitive identifiers where practical.
- Logs must not contain plaintext secrets, credentials, tokens, encryption material, full health records, or unrestricted request bodies.
- Free text and error messages must be reviewed for accidental sensitive-data leakage.
- Access to security logs is separate from routine application administration.
- Log retention and storage location must align with classification, country, legal, and investigation requirements.
- Logging failures must generate operational alerts rather than silently reducing coverage.

## Detection catalogue

### Access anomalies

Detect:

- first-time access to a Restricted dataset;
- unusual volume or rate of reads;
- sequential enumeration of households, patients, referrals, or documents;
- access outside a user's country, programme, facility, or assignment;
- dormant or recently reactivated identity accessing sensitive data;
- production access by identities intended for development or testing;
- repeated authorization denials followed by successful access;
- support or administrative access without an active approved request.

### Export and exfiltration indicators

Detect:

- large query results or object downloads;
- creation of database dumps, snapshots, or export jobs;
- unusual signed-URL creation or repeated downloads;
- new analytical destinations or storage buckets;
- high-volume transfer to third parties;
- data written to unmanaged or unclassified destinations;
- exports without a matching approval record;
- use of manual credentials where workload identity is expected.

### Key and secret anomalies

Detect:

- broad KMS decrypt permission grants;
- key-policy changes outside the approved pipeline;
- key disablement or destruction requests;
- unexpected decrypt spikes;
- cross-country use of a country-specific key;
- production secret reads by humans;
- access to several unrelated secrets by one identity;
- new secret versions followed by authentication failures;
- secrets accessed from unexpected workloads or environments.

### Storage and database drift

Detect:

- public access or anonymous principals;
- allUsers or allAuthenticatedUsers bindings;
- databases or buckets without required labels;
- resources in unapproved locations;
- missing CMEK where the approved design requires it;
- disabled audit logging;
- unauthorized replicas, backups, or snapshots;
- long-lived temporary exports;
- non-production resources containing production-classified data;
- lifecycle, retention, versioning, or deletion-policy changes.

### Residency and transfer violations

Detect:

- country production data stored outside its approved service location;
- direct country-to-country replication;
- Restricted records entering shared analytics without an approved transformation;
- backups or logs copied to another country boundary;
- third-party destinations not present in the approved data-flow register;
- restore operations targeting an unauthorized environment.

## Alert severity

| Severity | Examples | Expected response |
|---|---|---|
| Critical | Public Restricted dataset, confirmed cross-country leak, key destruction, mass exfiltration | Immediate incident response and containment |
| High | Unapproved export, broad decrypt role, production data in nonproduction, anomalous bulk access | Urgent investigation and access containment |
| Medium | Missing labels, failed deletion job, unusual but limited secret access, backup-policy drift | Owner investigation within defined operational SLA |
| Low | Inventory mismatch, stale export approaching expiry, incomplete metadata | Backlog remediation with tracked due date |

Severity may increase based on data volume, classification, identity privilege, affected countries, persistence, and evidence of malicious intent.

## Response integration

Each actionable alert must identify:

- detection name and version;
- affected country and environment;
- resource and data class;
- acting identity;
- observed and expected behavior;
- supporting log references;
- immediate containment options;
- assigned owner;
- incident or investigation record;
- closure evidence and lessons learned.

Automated containment must be carefully scoped. Disabling keys, deleting data, revoking production identities, or stopping critical health workflows may cause material harm and therefore requires preapproved response logic or human authorization.

## Dashboards and reviews

Security and data owners should review:

- sensitive-data access volumes and top identities;
- human production access;
- export creation, access, expiry, and deletion;
- key and secret administrative activity;
- backup success and tested restore age;
- overdue retention and deletion actions;
- data-location and encryption compliance;
- undeclared stores and flow mismatches;
- open exceptions and legal holds;
- detection coverage and false-positive trends.

High-risk access and control changes require more frequent review than general trend reporting.

## Sensitive-data discovery

Discovery scans may be used to find likely sensitive data in supported stores, but they are not the authoritative classification mechanism. Scan scopes, sampling, findings storage, and reviewer access must avoid creating another uncontrolled copy of Restricted content.

Findings should identify resource, location, detector, confidence, classification implication, owner, and remediation status. Raw matched values should be suppressed or tightly controlled.

## Evidence requirements

Evidence for implementation includes:

- enabled audit and data-access logs;
- configured log sinks and retention policies;
- detection definitions under version control;
- test events and expected alert results;
- dashboards and review records;
- asset-inventory reconciliation output;
- export and data-flow register reconciliation;
- key, secret, backup, retention, and deletion review records;
- incident tickets and closure evidence;
- documented gaps, exceptions, and compensating controls.

## Prohibited patterns

- logging full Restricted payloads for convenience;
- relying only on application logs for cloud administrative activity;
- detections without named owners or response procedures;
- alerts sent only to personal mailboxes;
- logging disabled during troubleshooting without approval and restoration evidence;
- permanent suppression of high-risk alerts to reduce noise;
- storing monitoring data in an unapproved country or environment;
- treating successful backup jobs as proof that restores work;
- treating absence of alerts as proof that controls are effective.

## Validation expectations

The design is not implemented until representative authorized and unauthorized actions are generated, telemetry is captured without prohibited sensitive content, detections produce actionable alerts, owners respond through documented procedures, and evidence demonstrates coverage across all production countries and protected data services.
