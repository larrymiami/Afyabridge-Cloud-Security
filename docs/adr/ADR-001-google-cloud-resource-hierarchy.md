# ADR-001: Google Cloud Resource Hierarchy

- **Status:** Accepted
- **Date:** 2026-07-25
- **Decision owners:** Platform Engineering, Security Engineering

## Context

AfyaBridge requires a Google Cloud structure that supports:

- multiple production countries;
- separate production and non-production environments;
- shared security, logging, networking, CI/CD, artifact, and DNS services;
- central governance without granting unrestricted access across countries;
- repeatable onboarding of additional countries;
- clear cost, ownership, policy, and audit boundaries.

A flat project structure would be easy to start but would make inherited policy, delegated administration, country isolation, and environment governance difficult to manage.

A folder-only design without project separation would also be insufficient because Google Cloud projects provide important IAM, quota, billing, API, logging, and lifecycle boundaries.

## Decision

AfyaBridge will use a combined folder-and-project hierarchy.

The hierarchy will include:

- a dedicated bootstrap project;
- a common-services folder containing narrowly scoped shared-service projects;
- a production folder containing one folder per country;
- separate application, data, and operations projects within each production country;
- a non-production folder containing shared development and staging projects;
- an isolated sandbox area for short-lived experiments.

Representative structure:

```text
organisation
├── bootstrap project
├── common/
│   ├── security project
│   ├── logging project
│   ├── networking project
│   ├── CI/CD project
│   ├── artifacts project
│   └── DNS project
├── production/
│   ├── kenya/
│   │   ├── app project
│   │   ├── data project
│   │   └── ops project
│   ├── ghana/
│   │   ├── app project
│   │   ├── data project
│   │   └── ops project
│   └── south-africa/
│       ├── app project
│       ├── data project
│       └── ops project
├── non-production/
│   ├── development project set
│   └── staging project set
└── sandbox/
```

No application workload will be placed directly under the organisation root or in the bootstrap project.

## Rationale

The chosen model provides:

- policy inheritance through folders;
- project-level IAM and service isolation;
- country-specific cost and audit boundaries;
- independent data and workload lifecycle management;
- central shared services with explicit access paths;
- a scalable pattern for onboarding new countries;
- compatibility with Terraform project-factory automation.

## Alternatives considered

### Flat project structure

Rejected because it weakens policy inheritance, delegated administration, and organisational clarity.

### One project per environment

Rejected because country, application, data, and operational boundaries would be too coarse.

### One project per microservice

Deferred because it would create unnecessary project count, IAM, quota, and operational overhead at the current scale.

### Fully separate Google Cloud organisation per country

Rejected for the initial design because it would fragment central security, governance, billing, and delivery capabilities. It may be reconsidered where future legal or contractual requirements require full organisational separation.

## Consequences

### Positive

- Stronger country and environment isolation.
- Clear inherited policy boundaries.
- Better cost attribution.
- Easier central security and logging integration.
- Repeatable country onboarding.

### Negative

- More projects and IAM relationships to manage.
- Increased Terraform and bootstrap complexity.
- Shared-service interfaces require careful design.
- Some organisation-level controls may not be executable in a limited lab account.

## Implementation requirements

- Project creation must be automated through a project-factory pattern.
- Required labels and ownership metadata must be attached at creation time.
- Folder and project IAM must use groups and dedicated service identities.
- Primitive `Owner` and `Editor` roles must not be used for routine access.
- Production and non-production deployment identities must remain separate.
- Central log sinks and asset inventory must preserve source project, country, and environment metadata.

## Validation

The decision will be validated through:

- Terraform hierarchy plans;
- inherited policy tests;
- IAM boundary tests;
- project inventory by country and environment;
- budget and label verification;
- successful simulated onboarding of an additional country.

## Related documentation

- [`../architecture/landing-zone/resource-hierarchy.md`](../architecture/landing-zone/resource-hierarchy.md)
- [`../architecture/landing-zone/environment-separation.md`](../architecture/landing-zone/environment-separation.md)
- [`../architecture/landing-zone/shared-services.md`](../architecture/landing-zone/shared-services.md)
- [`ADR-002-country-isolation-model.md`](./ADR-002-country-isolation-model.md)
