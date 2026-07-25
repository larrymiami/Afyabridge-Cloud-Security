# ADR-003: Terraform State and Bootstrap

## Status

Accepted

## Date

2026-07-25

## Context

AfyaBridge Cloud Security requires a controlled way to establish and manage its Google Cloud landing zone.

The infrastructure-management plane must support:

- reproducible provisioning;
- reviewed infrastructure changes;
- separation between environments and countries;
- remote Terraform state;
- recovery from accidental state change;
- keyless CI/CD authentication;
- limited privileged human access;
- auditable project creation and baseline enforcement.

Storing production state locally or using downloadable service-account keys would create unnecessary risks. A single monolithic state would also increase blast radius and couple unrelated environments.

The bootstrap process presents a dependency problem: the remote backend and CI/CD identity must exist before the full landing zone can be managed through that backend and identity.

## Decision

AfyaBridge Cloud Security will use a dedicated bootstrap project and a two-stage bootstrap process.

### Bootstrap project

The project `afyabridge-bootstrap-core` will contain:

- the remote Terraform state bucket;
- state-encryption configuration;
- the GitHub Actions workload identity pool and provider;
- bootstrap and project-factory deployment service accounts;
- minimum APIs and logging required for infrastructure management.

It will not host application workloads or business data.

### Stage 0

A privileged administrator may run a small, reviewed Terraform configuration locally to create the bootstrap prerequisites.

This is the only normal case where infrastructure may be applied locally with elevated privileges.

### Stage 1 and later

After bootstrap, landing-zone changes will run through reviewed CI/CD workflows using workload identity federation.

No routine deployment will use a downloadable Google Cloud service-account key.

### State storage

Terraform state will be stored in a private Google Cloud Storage bucket with:

- uniform bucket-level access;
- public-access prevention;
- object versioning;
- recovery controls;
- audit logging;
- lifecycle management;
- customer-managed encryption where practical.

### State separation

State will be split by management boundary, including:

- bootstrap;
- organization and folder hierarchy;
- common shared services;
- non-production foundation;
- each production country foundation.

Application workloads will use separate state introduced in later phases.

### Access model

Each deployment identity will have access only to its assigned state and target resources.

Application workload identities will have no access to Terraform state.

Human access will be limited to temporary investigation, recovery, and break-glass operations.

### Concurrency

CI/CD workflows will enforce one apply at a time per state boundary and will reject stale plans.

## Alternatives considered

### Local Terraform state

Rejected because it would:

- make collaboration and recovery unreliable;
- increase the risk of state loss;
- encourage production applies from developer workstations;
- weaken auditability.

### Single monolithic remote state

Rejected because it would:

- expand the blast radius of errors;
- require broad deployment permissions;
- couple countries and environments;
- increase lock contention;
- complicate recovery.

### Downloadable service-account keys in GitHub

Rejected because long-lived credentials can be leaked, copied, or used outside the intended workflow.

### Manual infrastructure management after bootstrap

Rejected because it would create configuration drift and weaken review, traceability, and repeatability.

### Separate bootstrap project per country

Deferred because the initial landing zone does not require that level of duplication. Country-specific deployment identities and state boundaries provide sufficient isolation for the current design.

## Consequences

### Positive

- CI/CD can authenticate without long-lived credentials.
- Terraform state is centrally protected and recoverable.
- Country and environment state boundaries reduce blast radius.
- Infrastructure changes remain traceable to reviewed commits.
- Application identities cannot access management-plane state.
- Bootstrap responsibilities remain isolated from workloads.

### Negative

- Stage 0 still requires careful privileged human execution.
- Multiple state boundaries add backend and workflow complexity.
- Recovery depends on preserving access to both the state bucket and its encryption key.
- Workload identity federation conditions require careful testing.
- The bootstrap project becomes a critical management-plane dependency.

### Risks

- Overly broad bootstrap IAM could compromise the entire hierarchy.
- Incorrect federation conditions could allow untrusted workflows to authenticate.
- State may contain sensitive infrastructure metadata.
- A disabled or destroyed encryption key could prevent state recovery.
- Concurrency failures could corrupt or desynchronize state.

## Required controls

- multi-factor authentication for privileged bootstrap administrators;
- reviewed Stage 0 Terraform plan;
- no committed credentials;
- public-access prevention on state storage;
- state versioning and recovery testing;
- least-privilege state access;
- dedicated deployment identities;
- repository, branch, workflow, and environment restrictions in federation;
- audit logging for state, IAM, and KMS access;
- pipeline concurrency controls;
- break-glass recovery procedure;
- periodic verification that no user-managed CI/CD keys exist.

## Validation

The decision will be validated by demonstrating that:

- GitHub Actions successfully authenticates through workload identity federation;
- no service-account key is stored in GitHub;
- unapproved branches or repositories cannot federate;
- non-production identities cannot read or write production state;
- one country identity cannot modify another country’s state;
- application identities cannot access the state bucket;
- a deleted test state can be recovered from an earlier version;
- concurrent applies against the same state are prevented;
- all apply operations are traceable to approved commits.

## Related documents

- [`../architecture/landing-zone/bootstrap-and-state.md`](../architecture/landing-zone/bootstrap-and-state.md)
- [`../architecture/landing-zone/project-factory.md`](../architecture/landing-zone/project-factory.md)
- [`ADR-001-google-cloud-resource-hierarchy.md`](ADR-001-google-cloud-resource-hierarchy.md)
- [`ADR-002-country-isolation-model.md`](ADR-002-country-isolation-model.md)
- [`../security-objectives.md`](../security-objectives.md)
- [`../threat-model/threat-register.md`](../threat-model/threat-register.md)

## Implementation status

**Designed** — the decision is accepted, but the bootstrap project, state backend, and federation configuration have not yet been provisioned or tested.