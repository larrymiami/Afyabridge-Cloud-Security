# Country Data Residency Architecture

## Status

**Designed**

## Purpose

This document defines how AfyaBridge keeps production health and beneficiary data within approved country boundaries, governs cross-border processing, and prevents shared services, analytics, support, backup, or recovery workflows from creating undeclared data transfers.

## Residency model

AfyaBridge operates separate production systems of record for:

- Kenya;
- Ghana;
- South Africa.

Each country production environment owns its identifiable health, household, referral, consent, identity, and operational records. Country separation applies to primary storage, replicas, backups, object storage, encryption keys, temporary recovery copies, and approved processing locations.

## Core rules

- Restricted production data remains in the approved country processing boundary unless a documented exception is approved.
- Production countries do not share databases, buckets, backup repositories, encryption keys, or unrestricted analytics datasets.
- Shared services may process metadata only when the data-flow register explicitly permits it.
- Cross-country support access does not authorize cross-country data replication.
- Country residency is enforced through resource placement, identity, network, encryption, data-flow, and monitoring controls together.
- A global service label does not prove that all stored or processed data remains in the selected country boundary.
- Technical design must be reconciled with applicable law, contract, funder terms, clinical obligations, and partner agreements before implementation.

## Country boundary contents

The country boundary includes:

- transactional databases;
- object-storage attachments;
- search indexes;
- caches containing identifiable records;
- durable queues and dead-letter messages;
- application logs containing sensitive context;
- backups and replicas;
- recovery environments;
- country encryption keys;
- offline synchronization services;
- locally scoped analytics containing identifiable or linkable data.

## Shared services

Central services may receive only the minimum approved data required for their function.

| Shared service | Allowed data | Prohibited by default |
|---|---|---|
| Central security monitoring | Security events, resource identifiers, actor identity, minimized request metadata | Clinical notes, household details, full payloads, access tokens |
| Central asset inventory | Project, service, region, owner, classification metadata | Record content |
| Central cost management | Billing and usage metadata | Beneficiary or clinical content |
| Shared CI/CD | Source code, build metadata, deployment identity | Production records, production secrets, database exports |
| Shared analytics | Approved aggregated or transformed datasets | Unrestricted raw country production tables |
| Central support tooling | Case metadata and redacted diagnostics | Full production screenshots or copied records unless explicitly approved |

## Cross-border transfer decision

Any proposed transfer of Confidential or Restricted data outside its country boundary requires:

1. defined business and processing purpose;
2. identification of data subjects and categories;
3. source and destination countries;
4. legal and contractual assessment;
5. data-owner and privacy approval;
6. security architecture review;
7. minimization and transformation analysis;
8. encryption and key-control design;
9. retention and deletion terms;
10. partner and subprocessors review;
11. monitoring and evidence plan;
12. expiry or reassessment date.

A technical ability to copy data is not approval to transfer it.

## Analytics

Shared analytics should use, in order of preference:

1. country-local queries with aggregated outputs;
2. approved country-local pseudonymization before export;
3. strongly minimized datasets with controlled linkage;
4. identifiable cross-border processing only where formally approved.

Aggregated data remains sensitive when small groups, rare conditions, facility identifiers, dates, or other attributes permit inference or re-identification.

## Support and administration

Authorized personnel may support more than one country, but access remains:

- country-scoped;
- role- and assignment-based;
- temporary for privileged actions;
- logged and reviewable;
- limited to the minimum records needed;
- prohibited from creating local unmanaged copies.

Screen captures, downloaded CSV files, copied logs, and support tickets can become cross-border transfers and must follow the same approval model.

## Backups and disaster recovery

- Backups remain within the source country boundary unless a separate cross-border recovery decision is approved.
- Recovery targets must use the source country's approved location and key hierarchy.
- A country backup must not be restored into another production country or non-production environment.
- Regional resilience inside an approved country boundary is preferred where supported.
- Where the required service cannot meet the residency design, the gap must be recorded and accepted before deployment.

## Third parties

Third-party processing must document:

- processing and storage locations;
- support-access locations;
- subprocessors;
- backup and disaster-recovery locations;
- encryption and key ownership;
- retention and deletion;
- incident notification;
- data-return and termination procedures.

A vendor's general security certification does not replace location-specific due diligence.

## Logs and telemetry

Logs exported to central security services must be minimized.

Controls include:

- structured logging with prohibited-field filtering;
- token, credential, and payload redaction;
- country and classification labels;
- restricted access to sensitive logs;
- retention appropriate to investigation needs;
- detection of fields that indicate accidental sensitive-data logging.

## Data-location register

Every production dataset must record:

- country owner;
- system of record;
- resource and service type;
- configured location;
- actual processing dependencies;
- replica and backup locations;
- key location and owner;
- downstream destinations;
- third parties and subprocessors;
- classification;
- approved exceptions;
- last validation date.

## Validation

Before a workload is considered compliant with the residency architecture, evidence must confirm:

- resources are deployed in approved locations;
- databases, buckets, backups, and keys are country-scoped;
- no undeclared replicas or exports exist;
- log sinks do not carry prohibited payloads;
- shared analytics receives only approved outputs;
- partner processing locations match the register;
- recovery tests remain within the source country boundary;
- access paths do not create unmanaged copies.

## Monitoring

Detect and investigate:

- resources created outside approved locations;
- cross-country database, bucket, or backup replication;
- exports to shared or personal storage;
- central logs containing Restricted fields;
- partner endpoint or processing-location changes;
- restore operations targeting another country or environment;
- data-transfer exceptions beyond expiry;
- unregistered analytics datasets;
- unmanaged local downloads by privileged users.

## Exceptions

A residency exception must be:

- specific to a dataset and flow;
- approved by accountable legal, privacy, security, and data owners;
- time-bound;
- documented with safeguards and residual risk;
- reviewed before renewal;
- removed when the processing purpose ends.

## Prohibited patterns

- One global production database for all countries
- Cross-country production replication by default
- Global backup storage without a documented residency decision
- Copying production data into shared analytics without transformation and approval
- Treating remote access as unrelated to data-transfer risk
- Using support tickets, chat, email, or screenshots as uncontrolled data-transfer channels
- Assuming a configured region fully describes all service processing locations
- Sharing country production encryption keys

## Related documents

- [`data-flow-and-inventory.md`](./data-flow-and-inventory.md)
- [`data-classification.md`](./data-classification.md)
- [`backup-and-recovery.md`](./backup-and-recovery.md)
- [`exports-and-analytics.md`](./exports-and-analytics.md)
- [`../../adr/ADR-012-country-data-residency.md`](../../adr/ADR-012-country-data-residency.md)
