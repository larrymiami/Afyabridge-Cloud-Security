# Exports and Analytics Protection

## Status

**Designed**

## Purpose

This document defines how AfyaBridge creates, approves, transfers, stores, analyzes, and retires data exports and analytical datasets without weakening country, classification, or purpose boundaries.

Exports are treated as new governed data assets. They do not become less sensitive merely because they are CSV files, reports, dashboards, extracts, model inputs, or aggregated tables.

## Design principles

- Raw production data remains within the originating country boundary unless an approved transfer decision permits otherwise.
- Shared analytics receives minimized, transformed, or aggregated data rather than unrestricted production records.
- Every export has an owner, purpose, classification, destination, expiry, and deletion obligation.
- Manual exports are exceptional and more restrictive than automated governed pipelines.
- Pseudonymized data remains sensitive while re-identification is reasonably possible.
- Export access is time-bound and does not create a permanent alternative system of record.
- Analytical convenience does not override consent, legal, contractual, residency, or retention requirements.

## Export classes

| Export type | Typical classification | Default handling |
|---|---|---|
| Operational aggregate | Internal or Confidential | Country-scoped dashboard or approved shared analytics dataset |
| Pseudonymized programme dataset | Confidential or Restricted | Purpose-limited, controlled analytical workspace |
| Identifiable case extract | Restricted | Exceptional, country-local, named recipients, short expiry |
| Regulatory report | Determined by content | Approved template and documented disclosure authority |
| Support diagnostic extract | Confidential or Restricted | Minimized, temporary, ticket-linked, securely deleted |
| Research dataset | Confidential or Restricted | Formal protocol, ethics and legal review, controlled workspace |

## Export request record

Every export request must record:

- request identifier;
- requesting identity and sponsoring organization;
- country and source system;
- business or legal purpose;
- fields and record population;
- classification;
- lawful or contractual authority where applicable;
- minimization and de-identification method;
- recipient and destination;
- encryption and delivery mechanism;
- access duration and expiry;
- retention and deletion date;
- approvers;
- monitoring requirements;
- evidence of delivery and destruction.

Restricted exports require independent approval by the data owner or delegated authority and security or privacy review where the request changes a normal data flow.

## Automated analytical pipelines

Approved pipelines must:

1. read only registered source datasets;
2. use workload identities rather than shared credentials;
3. transform data within the source-country boundary when practical;
4. remove unnecessary direct identifiers;
5. apply deterministic or irreversible transformations only where justified;
6. write to a destination with explicit country, environment, and classification labels;
7. preserve lineage from source to output;
8. apply retention and deletion rules to intermediate and final datasets;
9. produce auditable pipeline and access logs;
10. fail closed when classification, schema, destination, or policy validation fails.

## Shared analytics boundary

A shared analytical environment may receive:

- country-approved aggregates;
- metrics with sufficiently large groups;
- transformed programme indicators;
- pseudonymous identifiers with controlled lookup separation;
- operational metadata that does not reveal Restricted records;
- approved research datasets under a documented transfer decision.

It must not receive unrestricted copies of country production databases, routine direct identifiers, authentication secrets, raw document stores, unfiltered event payloads, or backup archives.

## De-identification and aggregation

De-identification must be assessed against the full dataset and likely auxiliary information, not only the removal of names.

Controls may include:

- removal or generalization of direct identifiers;
- date and location coarsening;
- suppression of small groups;
- tokenization with lookup separation;
- field-level redaction;
- aggregation thresholds;
- exclusion of free-text fields;
- review of rare combinations and outliers;
- contractual restrictions on re-identification.

A dataset remains Restricted when re-identification risk is material or when its source purpose requires Restricted handling.

## Manual exports

Manual production exports are permitted only through an approved workflow. They must not be created on unmanaged workstations, personal storage, consumer file-sharing services, email attachments, or chat platforms.

Where a manual export is unavoidable:

- the query or extraction procedure is reviewed;
- the smallest practical dataset is produced;
- the file is encrypted in transit and at rest;
- access is limited to named recipients;
- download and access events are logged;
- the file has an automatic expiry where supported;
- local copies are prohibited or governed;
- deletion is confirmed after the approved period.

## Dashboards and business intelligence

Dashboards must enforce row, country, programme, organization, facility, and role restrictions appropriate to the dataset. Hidden filters or client-side controls are not authorization boundaries.

Dashboard exports, scheduled email reports, cached extracts, and downloadable underlying data must be separately authorized. A user who may view a chart does not automatically receive permission to export its source rows.

## Machine learning and AI use

Production data must not be submitted to an external model or AI service without an approved data-flow assessment. The assessment must cover:

- provider and processing location;
- data retention and training use;
- subcontractors;
- encryption and access controls;
- deletion capability;
- prompt and response logging;
- cross-border transfer implications;
- model-output sensitivity;
- fallback and incident procedures.

Training datasets, embeddings, prompts, evaluation sets, model outputs, and vector indexes inherit source classification unless a documented assessment supports a different classification.

## Third-party disclosures

Third-party export destinations require:

- a valid agreement and defined processing purpose;
- recipient identity and access controls;
- approved transfer mechanism where cross-border;
- data minimization;
- secure transfer;
- retention and deletion obligations;
- breach notification requirements;
- audit or assurance rights proportionate to risk;
- evidence that disclosure ended when the purpose ended.

## Monitoring and evidence

Evidence should include:

- export requests and approvals;
- pipeline definitions and data lineage;
- destination policy and IAM configuration;
- access and download logs;
- de-identification assessments;
- schema and classification checks;
- retention and deletion records;
- third-party delivery receipts;
- expired-link or revoked-access evidence;
- periodic reconciliation of export inventories against actual storage.

## Prohibited patterns

- unrestricted database dumps for analysis;
- production data in spreadsheets without governed storage and access;
- permanent analyst copies of Restricted data;
- shared links without named access and expiry;
- production data in development notebooks;
- direct identifiers in shared analytics without explicit approval;
- dashboard authorization implemented only through presentation-layer filters;
- AI or model submission without a registered and approved data flow;
- export files without an owner or deletion date.

## Validation expectations

The design is not implemented until tests demonstrate that unauthorized users cannot create, access, or download sensitive exports; analytical destinations reject unregistered data; lineage is traceable; expiry and deletion operate as intended; and prohibited cross-country or non-production transfers are detected or blocked.
