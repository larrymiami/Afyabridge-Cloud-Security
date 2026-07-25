# ADR-002: Country Isolation Model

- **Status:** Accepted
- **Date:** 2026-07-25
- **Decision owners:** Platform Engineering, Security Engineering

## Context

AfyaBridge operates country programmes in Kenya, Ghana, and South Africa. Country administrators, CHWs, supervisors, facilities, workloads, data, logs, encryption keys, and operational processes must remain appropriately scoped.

A single shared production environment would reduce infrastructure cost but would increase the impact of broken authorisation, excessive IAM, network misconfiguration, key misuse, and operational mistakes.

Complete organisational separation per country would provide strong isolation but would duplicate security, delivery, billing, and governance capabilities beyond the needs of the current design.

## Decision

AfyaBridge will use layered country isolation inside one Google Cloud organisation.

Each production country receives:

- a dedicated country folder;
- separate application, data, and operations projects;
- country-scoped human groups and workload identities;
- country-specific application authorisation attributes;
- country-aware network segments and firewall policy;
- country-specific secrets and encryption-key assignments;
- country-tagged logs, findings, budgets, and assets;
- controlled access to centrally governed shared services.

Shared services remain outside country folders and expose only explicit, authenticated interfaces.

## Isolation layers

### Organisation and folder layer

Country folders provide policy inheritance, delegated administration, inventory, and governance boundaries.

### Project layer

Application, data, and operations projects separate workload execution, sensitive data, and operational tooling.

### Identity layer

Users and workloads receive country-scoped roles. Global roles are limited, justified, and auditable.

### Application layer

Server-side authorisation enforces country and programme context for every request. Guessed identifiers must not bypass access checks.

### Network layer

Country workloads use approved network segments. Cross-country routes and service calls are denied unless explicitly required.

### Data layer

Production data is stored in country-specific data projects or country-isolated stores. Cross-country analytics uses approved de-identification or aggregation paths.

### Encryption layer

Country workloads are assigned country-specific key resources where practical. A country workload must not decrypt another country’s protected data.

### Logging layer

Logs are centrally available for security operations while retaining country metadata and scoped operational views.

## Non-production decision

Development and staging are shared initially, but country boundaries remain represented through synthetic identities, claims, datasets, configuration, logs, and automated tests.

Shared non-production must not create a network, IAM, secret, key, or state path into production.

## Global access

Approved global functions may require cross-country visibility, including:

- aggregated programme reporting;
- central security monitoring;
- platform reliability operations;
- governance and audit.

Such access must be:

- read-only where possible;
- limited to the minimum dataset;
- separated from routine country administration;
- logged and reviewable;
- de-identified for analytics where appropriate;
- time-bound when privileged access is required.

## Alternatives considered

### Single shared production project

Rejected because the failure domain and access boundary would be too broad.

### Shared application project with country-specific databases

Rejected for the initial production design because a compromised runtime identity could create broad cross-country impact.

### Separate Google Cloud organisation per country

Deferred because it would add significant billing, federation, security, logging, and policy duplication. It remains an option where future legal, contractual, or sovereignty requirements demand it.

### Separate project for every service and country

Deferred because it would add excessive project and IAM complexity at the current scale.

## Consequences

### Positive

- Reduced blast radius for identity, network, runtime, and data failures.
- Clear country ownership and cost attribution.
- Stronger support for country-scoped administration.
- Easier validation of cross-country deny controls.
- New countries can follow a repeatable pattern.

### Negative

- More infrastructure modules and cross-project bindings.
- Shared-service integrations require explicit design.
- Global reporting requires a governed aggregation path.
- Some duplicated resources and costs are expected.

## Required controls

- Country claims must be derived from trusted identity and assignment data.
- Authorisation must be enforced server-side.
- Country administrators must not receive organisation-wide roles.
- Workload service accounts must be country and service specific.
- Cross-country network paths must be default-deny.
- Country keys and secrets must have separate IAM bindings.
- Shared logging access must preserve scoped country views.
- Analytics exports must be de-identified or aggregated before global use.
- All country resources must carry country metadata.

## Validation

The decision will be validated through:

- cross-country API requests returning `403`;
- denied IAM access between country projects;
- failed network connectivity across unapproved country paths;
- denied KMS use across country boundaries;
- asset and budget inventory grouped by country;
- log access tests for country and global roles;
- onboarding simulation for an additional country.

## Related objectives and threats

**Objectives:** IAM-03, APP-01, APP-02, NET-02, NET-03, KMS-01, CSPM-06, GOV-06  
**Threats:** TH-002, TH-003, TH-013, TH-014, TH-015, TH-016

## Related documentation

- [`../architecture/landing-zone/resource-hierarchy.md`](../architecture/landing-zone/resource-hierarchy.md)
- [`../architecture/landing-zone/environment-separation.md`](../architecture/landing-zone/environment-separation.md)
- [`../architecture/landing-zone/shared-services.md`](../architecture/landing-zone/shared-services.md)
- [`ADR-001-google-cloud-resource-hierarchy.md`](./ADR-001-google-cloud-resource-hierarchy.md)
