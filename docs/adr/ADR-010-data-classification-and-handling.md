# ADR-010: Data Classification and Handling Model

- **Status:** Accepted
- **Date:** 2026-08-04
- **Decision owners:** Security architecture and country data owners
- **Related milestone:** v0.5 Data protection and encryption architecture

## Context

AfyaBridge processes community-health, household, clinical, referral, identity, operational, security, and analytics data across Kenya, Ghana, and South Africa.

The platform needs one consistent handling model that can be applied to application records, databases, object storage, queues, logs, exports, backups, offline devices, analytics outputs, and third-party integrations.

Without an authoritative classification model, teams could:

- treat identifiable health data inconsistently;
- copy production data into development or sandbox;
- assume pseudonymized data is automatically low risk;
- apply encryption and retention controls unevenly;
- export more data than a business purpose requires;
- overlook sensitive data in logs, queues, caches, backups, or temporary files;
- create cross-country replication paths without explicit approval.

The classification model must be simple enough to operate, but precise enough to drive enforceable controls and evidence.

## Decision

AfyaBridge will use four authoritative data classes:

1. **Public**
2. **Internal**
3. **Confidential**
4. **Restricted**

Identifiable health, household, clinical, referral, credential, authentication-secret, private-key, and equivalent high-impact data is classified as **Restricted**.

Personal data that is not health data, sensitive operational information, contractual information, partner configuration, and security findings are generally **Confidential** unless their impact requires Restricted handling.

Data inherits the highest classification of its source content unless an approved transformation and documented re-identification assessment support a lower class.

Pseudonymized, tokenized, aggregated, or derived data is not automatically downgraded. The data owner must evaluate:

- remaining direct and indirect identifiers;
- linkability to source systems;
- population size and uniqueness;
- access to lookup tables or auxiliary datasets;
- intended use and recipient;
- geographic and regulatory constraints;
- consequences of re-identification.

Production Restricted data is prohibited from development and sandbox environments. Test and demonstration data must be synthetic or explicitly approved, transformed data that satisfies the required de-identification standard.

Each registered data flow must record:

- data owner;
- source and destination;
- country and environment;
- purpose;
- classification;
- legal or programme authority where applicable;
- minimum required fields;
- authentication and authorization model;
- encryption requirements;
- retention and deletion rule;
- monitoring owner;
- approved downstream use.

Country production systems remain separate systems of record. Cross-country replication or transfer of Restricted data is prohibited by default and requires a documented purpose, data-owner approval, architecture review, and residency assessment.

## Handling requirements

### Public

Public data may be published deliberately after ownership and accuracy review. Publication does not remove integrity, availability, copyright, or lifecycle responsibilities.

### Internal

Internal data is available only to the AfyaBridge workforce and approved systems with a legitimate business need. Public exposure is not permitted without reclassification approval.

### Confidential

Confidential data requires authenticated access, least privilege, approved storage and transfer services, encryption, bounded retention, controlled sharing, and monitoring appropriate to the risk.

### Restricted

Restricted data requires the strongest baseline controls:

- country- and environment-scoped storage;
- explicit authorization and assignment checks;
- encryption at rest and in transit;
- approved key-management controls where applicable;
- no production use in development or sandbox;
- minimized payloads and exports;
- controlled offline storage;
- enhanced logging and access review;
- documented retention, deletion, backup, and recovery treatment;
- formal approval for third-party or cross-border transfer.

## Scope

The decision applies to:

- primary databases;
- object storage;
- caches and temporary storage;
- queues, events, retry stores, and dead-letter messages;
- logs, traces, metrics, and support artifacts;
- backups, snapshots, replicas, and restored copies;
- offline mobile data;
- analytics datasets and reports;
- exports and extracts;
- partner and vendor integrations;
- secrets and cryptographic material;
- documentation containing real operational or security-sensitive information.

## Options considered

### Option 1: Four-class model

**Selected.**

Advantages:

- understandable across engineering, operations, security, and programme teams;
- sufficient distinction between ordinary internal data and high-impact health data;
- maps cleanly to handling requirements;
- avoids excessive classification complexity.

Disadvantages:

- some records require contextual judgement;
- data may need additional tags for country, retention, or purpose;
- classification alone cannot express every legal or contractual constraint.

### Option 2: Three-class model

Public, Internal, and Sensitive.

Advantages:

- simpler to communicate;
- fewer classification decisions.

Disadvantages:

- combines ordinary confidential business information with identifiable health data and secrets;
- makes proportional controls harder to define;
- risks overprotecting low-impact data or underprotecting high-impact data.

Rejected because the platform needs a clear high-impact Restricted class.

### Option 3: Highly granular health-sector taxonomy

A detailed taxonomy with many clinical, identity, operational, and regulatory categories.

Advantages:

- precise control mapping;
- supports specialized legal analysis.

Disadvantages:

- difficult to apply consistently;
- creates training and tooling overhead;
- increases misclassification risk;
- encourages role and policy explosion before the platform is implemented.

Rejected as the primary model. Additional metadata tags can express country, purpose, retention, and system-of-record context without multiplying top-level classes.

### Option 4: Classify only structured database records

Advantages:

- limited implementation scope;
- easier initial inventory.

Disadvantages:

- ignores logs, backups, queues, exports, devices, caches, and temporary files;
- leaves major leakage and retention paths uncontrolled.

Rejected because classification must follow the data across all storage and processing locations.

## Consequences

### Positive

- Health and identity data receive a consistent Restricted baseline.
- Encryption, key management, access review, retention, and monitoring can be driven by one model.
- Cross-country and non-production restrictions become explicit.
- Data-flow reviews have a standard evidence set.
- Derived and pseudonymized datasets receive deliberate re-identification assessment.
- Hidden copies in logs, queues, backups, exports, and devices become part of the governed inventory.

### Negative

- Teams must maintain classification and data-flow metadata.
- Some data products will require case-by-case judgement.
- Existing or future services may need redesign to prevent Restricted data entering unsupported locations.
- Stronger controls may increase implementation cost and operational complexity.
- Data downgrading requires evidence rather than developer assertion.

## Security implications

This decision reduces risk from:

- unauthorized disclosure of health records;
- production data copied into lower environments;
- uncontrolled exports;
- cross-country replication;
- sensitive payloads in telemetry;
- forgotten backup, cache, and dead-letter copies;
- mistaken assumptions about pseudonymization;
- inconsistent encryption and retention.

It does not replace:

- application authorization;
- country residency controls;
- encryption architecture;
- secrets management;
- retention and deletion policy;
- backup protection;
- incident response;
- legal and regulatory review.

## Implementation requirements

Implementation must provide:

1. a machine-readable or structured data inventory;
2. classification fields for data stores and data flows;
3. country, environment, owner, and purpose metadata;
4. policy checks for prohibited production-to-nonproduction paths;
5. approved synthetic-data generation for testing;
6. export and analytics review workflows;
7. monitoring for unregistered storage and replication;
8. handling guidance for logs, queues, backups, and devices;
9. exception records with owner and expiry;
10. periodic review by data owners and security.

## Validation

The decision is validated when:

- representative assets from every storage and processing class are classified;
- Restricted data paths are registered from collection through deletion;
- production Restricted data is absent from development and sandbox;
- cross-country replication is denied unless explicitly approved;
- pseudonymized outputs have documented re-identification assessments;
- backups, exports, logs, queues, and offline copies inherit correct classification;
- encryption, access, retention, and monitoring controls map to classification;
- drift and exception reporting exist.

## Review triggers

Review this ADR when:

- AfyaBridge enters a new country;
- new clinical or biometric data is introduced;
- analytics or AI processing materially changes re-identification risk;
- a new third-party data processor is added;
- legal or contractual obligations require a different handling category;
- the classification model proves too broad or too complex to enforce;
- implementation reveals a need for additional machine-readable tags.

## Status note

The classification and handling model is **Designed** and accepted as the architectural standard. It is not considered implemented until inventories, policies, tests, operating procedures, and evidence exist.
