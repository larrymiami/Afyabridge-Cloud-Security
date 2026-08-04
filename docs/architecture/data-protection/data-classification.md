# Data Classification and Handling Model

## Status

**Designed**

## Purpose

This document defines the authoritative data-classification scheme for AfyaBridge and the minimum handling requirements attached to each class. Classification applies to source records, derived datasets, logs, backups, exports, messages, temporary files, caches, screenshots, and incident evidence.

## Classification levels

### Class 1 — Public

Information approved for unrestricted public release.

Examples:

- published clinic locations and opening hours;
- public programme descriptions;
- approved website content;
- public technical documentation that contains no sensitive configuration.

Minimum handling:

- release requires an accountable content owner;
- integrity and change control remain required;
- public status must not be inferred merely because information is internet-accessible.

### Class 2 — Internal

Non-public information whose disclosure would cause limited operational harm but would not ordinarily expose a person, patient, security control, or contractual secret.

Examples:

- internal operating procedures;
- non-sensitive project plans;
- aggregated service metrics that cannot identify individuals or small groups;
- routine architecture material without credentials or exploitable configuration.

Minimum handling:

- access limited to authenticated workforce members with a business need;
- external sharing requires owner approval;
- storage in approved collaboration systems only;
- retention follows the owning function's schedule.

### Class 3 — Confidential

Information whose disclosure, alteration, or loss could materially harm an individual, programme, partner, or AfyaBridge operation.

Examples:

- workforce personal data;
- partner contracts and commercial information;
- facility-level operational records;
- pseudonymized patient or household datasets;
- security findings that do not contain active credentials;
- non-production data derived from realistic but synthetic scenarios.

Minimum handling:

- least-privilege access and attributable identities;
- encryption in transit and at rest;
- approved systems and country or programme scope where applicable;
- controlled export and external sharing;
- access and administrative events logged;
- backup, retention, and deletion requirements documented.

### Class 4 — Restricted

Information requiring the strongest controls because unauthorized disclosure, modification, destruction, or cross-border movement could create serious harm or regulatory exposure.

Examples:

- identifiable health and referral records;
- names, phone numbers, addresses, national identifiers, precise household locations, or biometrics linked to care or programme participation;
- credentials, private keys, recovery material, signing keys, and authentication secrets;
- production database copies and backups containing restricted records;
- incident evidence containing patient data or live secrets;
- detailed vulnerability information that enables compromise of production systems.

Minimum handling:

- explicit purpose, owner, system of record, country, retention rule, and approved consumers;
- strong authentication and server-side authorization;
- country- and environment-scoped storage and access;
- encryption at rest and in transit, with customer-managed keys where the architecture requires them;
- no routine access through shared accounts or unmanaged devices;
- no plaintext use in source code, tickets, chat, email, logs, or analytics notebooks;
- export, bulk access, restoration, key use, and administrative operations monitored;
- deletion or destruction verified and evidenced;
- external or cross-country transfer prohibited unless an approved exception exists.

## Classification decision rules

The highest applicable rule determines the classification.

1. Data that identifies or can reasonably re-identify a patient, household member, or care recipient is **Restricted**.
2. Health, clinical, screening, referral, or treatment information is **Restricted**, even when a direct name is absent, unless a documented de-identification assessment supports a lower class.
3. Pseudonymization alone does not reduce data below **Confidential**.
4. Authentication secrets, private keys, signing material, recovery codes, and production credentials are **Restricted**.
5. Security logs are normally **Confidential** and become **Restricted** when they contain patient data, tokens, secrets, or exploitable details.
6. Aggregated analytics may be **Internal** only when small-group disclosure, singling out, linkage, and re-identification risks are acceptably controlled.
7. A dataset with mixed classes is handled at the highest class present.
8. Unclassified data is treated as **Confidential** until the owner assigns and records a classification.

## Inheritance and transformation

### Copies and replicas

Copies, backups, snapshots, caches, and exports inherit the source classification. A change in storage system does not reduce handling requirements.

### Derived data

Derived data inherits the highest classification of its inputs unless all of the following are documented:

- the transformation method;
- removal or generalization of identifiers;
- re-identification risk assessment;
- minimum aggregation thresholds;
- linkage constraints;
- approval by the source data owner and privacy or security reviewer;
- validation that the output cannot expose small groups or rare attributes.

### Redaction

Redaction may reduce classification only when the removed data cannot be reconstructed from metadata, filenames, document history, hidden fields, logs, or related datasets.

### Synthetic data

Synthetic data may be classified as **Internal** when it is generated without production records, secrets, or reversible mappings and has been tested for accidental similarity to real individuals. Masked or sampled production data is not synthetic.

## Handling matrix

| Requirement | Public | Internal | Confidential | Restricted |
|---|---:|---:|---:|---:|
| Named owner | Required | Required | Required | Required |
| Authenticated access | Optional | Required | Required | Required |
| Least privilege | Recommended | Required | Required | Required |
| Encryption in transit | Required for managed publication | Required | Required | Required |
| Encryption at rest | Platform default | Required | Required | Required with approved key model |
| Country scope | Not applicable | As required | Required where applicable | Mandatory unless exception approved |
| Access logging | Change events | Administrative events | Access and administrative events | Access, export, key, restore, and administrative events |
| External sharing approval | Publication approval | Owner approval | Owner and receiving-party controls | Formal exception and data-transfer approval |
| Production-to-nonproduction copy | Not applicable | Reviewed | Prohibited unless transformed | Prohibited |
| Retention schedule | Required | Required | Required | Required with verified deletion |

## Labels and inventory fields

Every governed data asset must record at least:

- asset identifier and description;
- classification;
- data owner and technical custodian;
- country and environment;
- source and system of record;
- purposes and lawful or organizational basis;
- data subjects or affected groups;
- approved workloads, roles, partners, and destinations;
- storage locations and replicas;
- encryption and key scope;
- retention and deletion rule;
- backup and recovery requirements;
- export and analytics eligibility;
- last review date and next review date.

## Downgrade and declassification

Classification reduction requires:

1. a documented reason and transformation;
2. evidence that identifiers and sensitive attributes were removed or sufficiently generalized;
3. re-identification and linkage assessment;
4. approval from the data owner;
5. security or privacy review for Restricted data;
6. update of inventories, labels, downstream contracts, and retention rules;
7. confirmation that earlier higher-class copies remain governed and are not silently reclassified.

Public release additionally requires explicit publication approval.

## Prohibited practices

- treating encrypted data as less sensitive solely because it is encrypted;
- moving production data to development or test environments;
- using patient or household identifiers in object names, URLs, log messages, metrics labels, or support tickets;
- sharing Restricted data through personal email, consumer storage, unmanaged messaging, or public links;
- reducing classification solely because names were removed;
- storing secrets in source control, container images, CI variables without an approved secret store, or documentation;
- retaining temporary exports without an owner, expiry, and deletion evidence.

## Validation and evidence

Implementation evidence must include:

- a current data inventory with classification and ownership;
- automated or manual checks for required labels;
- samples showing Restricted data absent from logs and lower environments;
- access-policy and export-control tests;
- de-identification assessment records for downgraded datasets;
- deletion and retention evidence;
- periodic owner certification of classification accuracy.
