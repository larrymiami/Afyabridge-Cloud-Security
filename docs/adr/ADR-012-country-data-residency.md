# ADR-012: Country Data Residency

- **Status:** Accepted
- **Date:** 2026-08-04
- **Decision owners:** Platform Engineering, Security, Data Governance, Country Operations
- **Applies to:** Kenya, Ghana, and South Africa production environments

## Context

AfyaBridge processes identifiable health, household, referral, consent, identity, and operational data for multiple countries. A single shared production data plane would simplify some reporting and administration, but it would weaken country isolation, complicate legal and contractual obligations, increase the impact of compromise, and create hidden cross-border replication through backups, logs, support tooling, analytics, and disaster recovery.

The existing landing-zone, identity, and network architecture already treats each production country as a distinct security boundary. The data architecture must preserve that boundary throughout the complete data lifecycle.

## Decision

AfyaBridge will operate a separate production system of record and associated data-protection boundary for each country.

Kenya, Ghana, and South Africa production data will use country-scoped:

- databases and durable stores;
- object-storage repositories;
- replicas and backups;
- encryption-key hierarchies;
- recovery environments;
- runtime and administrative identities;
- data-flow registrations;
- retention and deletion controls.

Restricted production data will remain within its approved country processing boundary unless a specific cross-border transfer has received legal, privacy, security, and accountable data-owner approval.

Shared services may receive only explicitly approved, minimized metadata or transformed outputs. They must not become an implicit global production data plane.

## Detailed rules

1. Production countries do not share transactional databases, backup repositories, object-storage buckets, or encryption keys.
2. Cross-country replication is denied by default.
3. Production data is not restored into another country, development, staging, or sandbox.
4. Shared analytics receives approved aggregated, minimized, or pseudonymized outputs rather than unrestricted raw country tables.
5. Central security services receive minimized telemetry and must filter clinical, household, credential, and payload content.
6. Remote support access remains country-scoped and does not permit unmanaged local copies.
7. Third-party processing locations, subprocessors, backups, and support locations must be registered and approved.
8. Any exception is dataset-specific, purpose-specific, time-bound, reviewed, and monitored.
9. Service configuration alone is not sufficient evidence of residency; actual dependencies, replicas, backups, logs, exports, and support paths must be validated.

## Rationale

This decision:

- aligns the data layer with the established country folder, project, identity, and network boundaries;
- reduces the blast radius of data compromise or administrative error;
- makes country ownership, access review, backup, recovery, retention, and deletion easier to demonstrate;
- prevents global analytics and shared services from silently accumulating raw sensitive records;
- allows legal and contractual requirements to be evaluated per country and dataset;
- supports future expansion by repeating a defined country data-protection pattern.

## Alternatives considered

### One global production data platform

**Rejected.**

Although operationally simpler, it creates a broad shared blast radius, complicates country-specific controls, encourages global administrator access, and makes cross-border processing the default rather than an explicit decision.

### Regional African production platform

**Rejected as the default.**

A regional platform may reduce infrastructure duplication, but it still combines country data boundaries and does not remove the need for country-specific legal, contractual, operational, and incident handling.

### Country-local systems with unrestricted central replication

**Rejected.**

Country-local primaries do not provide meaningful residency if raw data is continuously copied into a central warehouse, backup repository, log platform, or support system.

### Country-local systems with approved transformed central analytics

**Accepted as part of the decision.**

Central analysis is permitted when the output is minimized, approved, registered, protected, and assessed for re-identification risk.

## Consequences

### Positive

- Clear country ownership and accountability
- Smaller compromise and misconfiguration blast radius
- Stronger isolation of health and beneficiary data
- Easier country-specific access reviews and incident response
- Independent backup, recovery, encryption, and deletion controls
- Explicit governance for shared analytics and external processors

### Negative

- Increased infrastructure and operational complexity
- More country-specific deployment and monitoring configuration
- Additional analytics transformation and aggregation work
- More complex support and recovery procedures
- Potential service limitations where country-local processing is unavailable
- Repeated legal and vendor assessments across countries

## Implementation requirements

Implementation must provide:

- country-specific projects and data stores;
- approved resource-location constraints where technically appropriate;
- separate encryption keys and key administrators;
- country-scoped workload and privileged identities;
- country-specific backup and restore policies;
- cross-country route and data-flow denial controls;
- a data-location register covering primaries, replicas, backups, logs, exports, and subprocessors;
- automated detection of resources or copies outside approved locations;
- approved transformation pipelines for shared analytics;
- documented exception and transfer-assessment workflows.

## Validation

The decision is considered implemented only when evidence demonstrates:

- production data resources exist in approved country locations;
- countries do not share production databases, buckets, backups, or keys;
- no undeclared cross-country replicas or exports exist;
- central logs and analytics contain only approved fields and outputs;
- recovery tests stay within the source country boundary;
- partner and subprocessor locations match the approved register;
- exceptions are current, scoped, and monitored;
- policy and configuration drift are detected.

## Security and operational risks

- Sensitive fields may leak into central logs despite country-local primary storage.
- Support staff may create unmanaged cross-border copies through downloads or screenshots.
- Aggregated data may remain re-identifiable.
- Managed-service dependencies may process metadata or data outside the expected boundary.
- Backup, replication, or disaster-recovery defaults may create undeclared copies.
- A fragmented architecture can reduce resilience if country-specific recovery is not tested.

These risks must be addressed through data-flow registration, log filtering, access controls, vendor review, recovery testing, monitoring, and periodic residency reconciliation.

## Exceptions

Exceptions require approval from:

- the accountable country data owner;
- privacy or legal authority;
- security architecture;
- the service owner.

Each exception must identify the dataset, purpose, destination, safeguards, retention period, subprocessors, residual risk, expiry date, and evidence requirements.

## Related documents

- [`../architecture/data-protection/data-residency.md`](../architecture/data-protection/data-residency.md)
- [`../architecture/data-protection/data-flow-and-inventory.md`](../architecture/data-protection/data-flow-and-inventory.md)
- [`../architecture/data-protection/backup-and-recovery.md`](../architecture/data-protection/backup-and-recovery.md)
- [`../architecture/data-protection/key-management.md`](../architecture/data-protection/key-management.md)
- [`ADR-007-shared-vpc-and-country-segmentation.md`](./ADR-007-shared-vpc-and-country-segmentation.md)
- [`ADR-011-customer-managed-encryption-keys.md`](./ADR-011-customer-managed-encryption-keys.md)
