# Data Flow and Inventory Architecture

## Status

**Designed**

## Purpose

This document defines how AfyaBridge identifies data assets, establishes systems of record, registers approved data flows, constrains replication, and records ownership across Kenya, Ghana, South Africa, and shared non-production environments.

A flow is not approved merely because two systems can communicate. Each movement of sensitive data must have an owner, purpose, classification, source, destination, country, identity, transport control, retention rule, and monitoring expectation.

## Inventory model

The authoritative data inventory must cover:

- databases, schemas, tables, views, and materialized views;
- object-storage buckets and prefixes;
- message topics, subscriptions, queues, and dead-letter stores;
- caches and temporary processing stores;
- backups, snapshots, replicas, and recovery copies;
- analytics datasets, reports, notebooks, and extracts;
- application logs, audit logs, traces, and security events;
- local mobile or offline caches;
- partner integrations and transfer locations;
- keys, secrets, certificates, and recovery material;
- generated exports and temporary files.

## Required inventory attributes

| Attribute | Requirement |
|---|---|
| Asset ID | Stable identifier independent of display name |
| Asset type | Database, bucket, queue, log, backup, export, key, secret, or other governed type |
| Description | Business and technical purpose |
| Classification | Highest classification present |
| Data owner | Accountable business, clinical, programme, security, or operational owner |
| Technical custodian | Team responsible for configuration and operation |
| Country | Kenya, Ghana, South Africa, shared non-production, or explicitly approved shared scope |
| Environment | Production, staging, development, sandbox, or recovery |
| System of record | Authoritative source or explicit non-authoritative copy |
| Data subjects | Patients, household members, workforce, partners, or none |
| Approved consumers | Workloads, roles, partners, or analytics processes |
| Storage location | Project, region, service, database, bucket, topic, or external destination |
| Encryption scope | Provider-managed or customer-managed key reference and transport requirements |
| Retention rule | Duration, trigger, legal hold conditions, and deletion method |
| Backup requirement | Recovery objective, copy scope, location, and restoration owner |
| Export eligibility | Prohibited, restricted, aggregated only, or explicitly approved |
| Monitoring | Required access, export, restore, deletion, key-use, and anomaly events |
| Review date | Last certification and next required review |

## Systems of record

A system of record is the authoritative source for a defined data domain. Other copies are replicas, caches, derived datasets, exports, or recovery assets and must not silently become authoritative.

Initial logical systems of record are:

| Data domain | Logical system of record | Country scope |
|---|---|---|
| Patient and household identity | country production application datastore | one production country |
| Clinical, screening, and referral records | country production clinical datastore | one production country |
| Programme and facility configuration | country production operational datastore | one production country |
| Workforce cloud identities | approved workforce identity provider and group directory | organizational with scoped assignments |
| Application role assignments | country-aware application authorization datastore | country and programme scoped |
| Security audit evidence | central security logging platform with source-country metadata | centrally governed, access restricted |
| Cryptographic keys | approved country or shared security key-management scope | key purpose and country scoped |
| Data inventory and flow register | governed architecture or compliance repository | organizational |

The physical technology for each logical record will be selected during implementation. The designation above does not claim a deployed datastore.

## Flow registration

Every Restricted or Confidential data flow must record:

1. flow identifier and owner;
2. source asset and system of record;
3. destination asset and receiving owner;
4. data fields or schema categories transferred;
5. classification before and after transformation;
6. country and environment boundaries crossed;
7. business or security purpose;
8. initiating workload, user role, partner, or scheduled process;
9. authentication and authorization method;
10. transport and encryption requirements;
11. expected frequency, volume, and timing;
12. retention and deletion behavior at the destination;
13. error, retry, dead-letter, and replay behavior;
14. logging and alerting requirements;
15. expiry date or review cadence;
16. exception or transfer approval where required.

Unregistered flows involving Confidential or Restricted data are unauthorized.

## Approved high-level flows

### Community health worker capture

1. A registered application user authenticates.
2. The application validates role, country, programme, facility, and assignment scope.
3. Data is captured over protected transport.
4. Offline data, when required, is encrypted and bound to the authenticated user and device session.
5. Sync submits records to the matching country production service.
6. The server revalidates authorization and schema.
7. The country datastore records the authoritative version and audit event.
8. Local temporary data is removed according to the offline retention rule.

### Clinical or supervisory review

1. The user requests a record through the application service.
2. Server-side authorization verifies country, programme, facility, assignment, and record scope.
3. Only the minimum fields required for the task are returned.
4. Access to Restricted records is logged with the named user and purpose context where supported.
5. Updates are validated, versioned, and written to the country system of record.

### Referral integration

1. The source service selects only approved referral fields.
2. The destination partner and country are checked against the flow register.
3. The payload is authenticated, encrypted, and assigned a correlation identifier.
4. Retries are bounded and idempotent.
5. Failed payloads enter a protected dead-letter path with limited retention.
6. Delivery and partner response metadata are recorded without unnecessary patient data.

### Security logging

1. Workloads produce structured security and audit events.
2. Sensitive payloads, tokens, secrets, and unnecessary clinical fields are excluded.
3. Logs include source country, environment, service, workload identity, actor identity where applicable, event type, and outcome.
4. Events are routed to the approved security logging scope.
5. Access to central logs is restricted and monitored.
6. Retention reflects investigative need and data minimization.

### Analytics

1. The source owner approves the data purpose and fields.
2. A controlled transformation removes direct identifiers and applies aggregation or pseudonymization.
3. Re-identification risk is assessed.
4. The output is written to an approved country or explicitly approved shared analytics scope.
5. Analysts receive access to the minimum dataset rather than the production system of record.
6. Export and query activity is logged.
7. The dataset expires or is reviewed according to its registered retention rule.

### Backup and recovery

1. The production asset creates an encrypted backup within its approved country and key scope.
2. Backup metadata records source, classification, creation time, retention, and recovery owner.
3. Backup administration is separated from routine application access.
4. Restore occurs only into an approved isolated recovery target.
5. Access and validation are logged.
6. Temporary restored data is destroyed after the recovery objective is met.

## Prohibited flows

- production data copied into development, sandbox, developer laptops, personal accounts, or public test services;
- direct country-to-country replication of patient, household, clinical, or referral records without an approved exception;
- unrestricted replication into a central shared database or analytics lake;
- logs or traces containing access tokens, secrets, full clinical payloads, or unnecessary identifiers;
- bulk exports to email, unmanaged storage, chat, local downloads, or personal devices;
- partner transfers without a registered destination, owner, purpose, retention rule, and authentication method;
- backups stored outside the approved country or key scope without a documented decision;
- manual database copies used as a substitute for a governed backup or migration process;
- derived datasets treated as low sensitivity without a de-identification assessment;
- temporary files, dead-letter messages, or failed payloads retained indefinitely.

## Country boundaries

### Production

Each country production environment owns its patient, household, clinical, referral, and programme data. The default rule is:

- Kenya production data remains in the Kenya production boundary.
- Ghana production data remains in the Ghana production boundary.
- South Africa production data remains in the South Africa production boundary.

Cross-country visibility, replication, analytics, support, or incident access requires an explicit purpose, legal and organizational review, minimum necessary fields, time-bound approval, and evidence.

### Shared organizational data

The following may use an approved shared scope when classification and purpose permit:

- public reference data;
- organization-wide workforce identity records;
- centrally governed security events with source-country metadata and minimized payloads;
- aggregated metrics that pass disclosure and re-identification review;
- global configuration that contains no country patient or clinical data.

A shared service does not automatically authorize shared storage of country data.

## Non-production data

Non-production environments must use synthetic or formally de-identified datasets. Controls must prevent accidental production imports through:

- separate projects and identities;
- restricted restore permissions;
- export and bucket policies;
- CI/CD checks;
- inventory reconciliation;
- detection of production identifiers or known data patterns;
- periodic review of staging and development datasets.

## Offline and edge data

Offline support creates temporary copies and therefore requires:

- device and user binding;
- encryption using platform-supported secure storage;
- minimum necessary records and fields;
- local authorization checks and server revalidation after sync;
- bounded offline retention;
- revocation behavior for lost, reassigned, or compromised devices;
- conflict handling that preserves auditability;
- secure deletion after successful sync or expiry;
- no sensitive data in notification previews, filenames, diagnostics, or backups outside the application control.

## Data-flow change control

Changes requiring review include:

- new source or destination;
- new country or environment boundary;
- additional fields or higher classification;
- increased volume or frequency;
- new partner or subprocesser;
- new analytics purpose;
- change in authentication, encryption, retention, backup, or deletion;
- new dead-letter or temporary storage;
- changed system of record;
- new cross-country access path.

A change is not approved solely because it passes functional testing.

## Reconciliation and drift detection

The implementation should compare the declared inventory and flow register with deployed resources and observed activity, including:

- unregistered databases, buckets, datasets, topics, snapshots, keys, or secrets;
- storage resources without owner, country, classification, or retention labels;
- cross-project or cross-country transfers not present in the flow register;
- exports or downloads inconsistent with expected volume;
- dormant assets still retaining Restricted data;
- public access, public IPs, or broad sharing on governed assets;
- backup or replica locations outside approved boundaries;
- application logs containing prohibited fields;
- data flows that continue after their approval or contract expires.

## Evidence requirements

Before a flow or inventory control is marked implemented, evidence must include:

- a current inventory export;
- owner and country labels;
- approved flow records;
- access and transport configuration;
- sample logs demonstrating attribution without sensitive payload leakage;
- negative tests for prohibited country and environment transfers;
- retention and deletion tests;
- reconciliation results showing no unexplained governed assets or flows.
