# Terraform Bootstrap and State

## 1. Purpose

This document defines how AfyaBridge Cloud Security bootstraps its Google Cloud foundation, authenticates infrastructure automation, stores Terraform state, and recovers the infrastructure-management plane.

The bootstrap layer is intentionally small, tightly controlled, and separate from workload projects. It establishes only the prerequisites required to manage the landing zone safely.

## 2. Design objectives

The bootstrap design must:

- avoid long-lived Google Cloud credentials in CI/CD;
- keep production Terraform state out of developer workstations;
- separate bootstrap administration from routine workload deployment;
- support independent state boundaries for production and non-production;
- preserve state history and support recovery from accidental change;
- prevent workloads from reading or modifying Terraform state;
- maintain an auditable path from source change to infrastructure change;
- allow the environment to be rebuilt from documented code and procedures.

## 3. Bootstrap boundary

The bootstrap layer consists of:

- a dedicated bootstrap project;
- a remote Terraform state bucket;
- encryption configuration for state;
- workload identity federation for GitHub Actions;
- narrowly scoped deployment service accounts;
- initial APIs required for project and folder management;
- audit logging and budget controls for the bootstrap project;
- recovery documentation for state and deployment identities.

The bootstrap layer does not host application workloads, application secrets, business data, or shared runtime services.

## 4. Bootstrap project

The initial bootstrap project is:

```text
afyabridge-bootstrap-core
```

Its responsibilities are limited to:

- storing Terraform state;
- hosting the workload identity pool and provider used by GitHub Actions;
- hosting bootstrap and project-factory deployment identities;
- enabling APIs required to manage the resource hierarchy;
- recording audit events for infrastructure-management actions;
- supporting state backup and recovery.

The bootstrap project must have:

- a dedicated budget;
- mandatory ownership and classification labels;
- no public resources;
- no application runtime;
- no user-managed service-account keys;
- restricted human access;
- version-controlled configuration.

## 5. Bootstrap sequence

Bootstrap occurs in two stages.

### 5.1 Stage 0 — local administrative bootstrap

Stage 0 is the only phase that may require a privileged human administrator to run Terraform locally.

It creates:

1. the bootstrap project;
2. required APIs;
3. the remote state bucket;
4. state encryption configuration;
5. workload identity federation;
6. deployment service accounts;
7. minimum IAM bindings;
8. logging and budget configuration.

Stage 0 must use:

- a dedicated administrative identity;
- multi-factor authentication;
- a clean local environment;
- no committed credentials;
- a reviewed Terraform plan;
- an execution log retained as bootstrap evidence.

After Stage 0, routine infrastructure changes move to CI/CD.

### 5.2 Stage 1 — CI/CD-managed landing zone

Stage 1 uses GitHub Actions and workload identity federation to manage:

- folders;
- projects;
- baseline project configuration;
- organization policies where available;
- shared services;
- environment foundations;
- country production foundations.

No downloadable Google Cloud service-account key is required.

## 6. Terraform state design

Terraform state is stored in Google Cloud Storage.

Recommended bucket pattern:

```text
afyabridge-tfstate-<organization-or-lab-id>
```

The bucket name must remain globally unique and must not contain sensitive data beyond the project identifier.

### 6.1 Required bucket controls

The state bucket must use:

- uniform bucket-level access;
- public-access prevention;
- object versioning;
- soft-delete or equivalent recovery controls where available;
- retention protection appropriate to the lab lifecycle;
- encryption with a dedicated customer-managed key where practical;
- access logs or audit logs;
- lifecycle rules for noncurrent versions;
- no anonymous or all-users bindings.

### 6.2 State prefixes

State must be separated by layer and environment.

Example prefixes:

```text
bootstrap/core
landing-zone/organization
landing-zone/common
landing-zone/nonproduction
landing-zone/production/ke
landing-zone/production/gh
landing-zone/production/za
```

A single monolithic state file is not permitted.

### 6.3 State isolation

Separate state boundaries reduce blast radius and prevent unrelated deployments from requiring the same permissions.

At minimum, state is separated into:

- bootstrap;
- organization and folder hierarchy;
- common shared services;
- non-production foundation;
- each production country foundation.

Application and service-level states will be introduced in later phases and must not share write access with the landing-zone state.

## 7. State access model

### 7.1 Human access

Routine human write access to Terraform state is prohibited.

Human administrators may receive temporary read or recovery access only when required for:

- investigation;
- state recovery;
- import or migration;
- approved break-glass operations.

Every such access must be logged and documented.

### 7.2 Automation access

Each Terraform deployment identity receives access only to its assigned state prefix and target resources.

Examples:

| Identity | State scope | Resource scope |
|---|---|---|
| Bootstrap deployer | `bootstrap/core` | Bootstrap project only |
| Organization deployer | `landing-zone/organization` | Folders, policies, project creation |
| Common-services deployer | `landing-zone/common` | Common shared-service projects |
| Kenya production deployer | `landing-zone/production/ke` | Kenya production folder and projects |
| Ghana production deployer | `landing-zone/production/gh` | Ghana production folder and projects |
| South Africa production deployer | `landing-zone/production/za` | South Africa production folder and projects |

No application workload identity may read Terraform state.

## 8. State locking and concurrency

Terraform operations against the same state boundary must not run concurrently.

The delivery workflow must:

- use GitHub environment concurrency controls;
- allow only one apply per state boundary;
- cancel or queue conflicting runs;
- require a fresh plan before apply;
- reject stale plans when the branch or state has changed.

Remote state storage does not remove the need for pipeline-level concurrency controls.

## 9. Encryption and key management

Where practical, the state bucket uses a dedicated Cloud KMS key.

The key design must:

- separate key administration from state use;
- grant decrypt permission only to approved Terraform identities and recovery administrators;
- enable rotation;
- retain audit logs for key use;
- prevent workload identities from using the key;
- document recovery implications if the key is disabled or destroyed.

The KMS key must not be deleted while encrypted state or recoverable object versions depend on it.

## 10. Workload Identity Federation

GitHub Actions authenticates through a dedicated workload identity pool and provider.

Federation conditions must restrict trust by attributes such as:

- GitHub organization or repository;
- branch or tag;
- workflow file;
- GitHub environment;
- pull-request or deployment context.

Production deployment credentials must not be available to arbitrary branches, forks, or unreviewed workflows.

Recommended separation:

- plan identity for read and validation;
- non-production apply identity;
- production country-specific apply identities;
- project-factory identity;
- break-glass identity outside normal CI/CD.

## 11. Terraform workflow

The standard infrastructure workflow is:

1. create a feature branch;
2. run formatting and validation;
3. run static and policy checks;
4. create a Terraform plan;
5. review the plan in the pull request;
6. merge approved changes;
7. authenticate through workload identity federation;
8. create a fresh plan from the merged revision;
9. require environment approval for protected targets;
10. apply through the assigned deployment identity;
11. retain logs and plan/apply evidence.

Direct production applies from developer laptops are prohibited after bootstrap.

## 12. State recovery

Recovery procedures must cover:

- accidental object deletion;
- state corruption;
- incorrect state mutation;
- lost backend configuration;
- disabled deployment identities;
- KMS key-access failure;
- bootstrap project misconfiguration.

The recovery sequence is:

1. stop all Terraform applies for the affected state;
2. preserve logs and identify the last known-good state version;
3. validate the selected version before restoration;
4. restore the state object or backend access;
5. run `terraform plan` without applying;
6. compare the plan with the expected infrastructure;
7. resolve drift through reviewed code;
8. document the recovery event.

State recovery must not be performed by copying unreviewed local state over the remote backend.

## 13. State backup and retention

State protection relies on:

- object versioning;
- soft-delete or recovery windows where supported;
- controlled lifecycle policies;
- protected encryption keys;
- periodic recovery validation;
- export of critical bootstrap configuration to version control.

Old state versions contain sensitive infrastructure metadata and must not be retained indefinitely without purpose.

## 14. Secrets and sensitive values

Terraform state must be treated as restricted security data because it may contain:

- resource identifiers;
- service endpoints;
- IAM bindings;
- secret references;
- generated credentials or sensitive outputs;
- network details.

Sensitive values must not be intentionally stored in state when a reference to Secret Manager or another managed service is sufficient.

Marking a Terraform output as `sensitive` does not remove it from state.

## 15. Break-glass administration

Break-glass access must be:

- separate from routine deployment identities;
- strongly authenticated;
- disabled or unassigned by default where practical;
- monitored;
- documented when activated;
- reviewed after use.

Break-glass procedures may restore state access, federation configuration, or essential IAM bindings. They must not become a routine deployment path.

## 16. Validation

The design will be validated by demonstrating that:

- GitHub Actions authenticates without a service-account key;
- unapproved repositories and branches cannot federate;
- a non-production deployer cannot write production state;
- one country deployer cannot write another country’s state;
- application identities cannot read the state bucket;
- object versioning can recover a deleted or damaged test state;
- concurrent applies to the same boundary are blocked;
- public access to the state bucket is prevented;
- Terraform changes are traceable to reviewed commits.

## 17. Evidence

Expected evidence includes:

- Terraform backend configuration;
- bucket and KMS policy output;
- workload identity provider configuration;
- IAM policy tests;
- successful keyless workflow logs;
- denied federation and denied state-access tests;
- state recovery test logs;
- audit-log queries;
- budget and labeling configuration.

## 18. Threat and objective traceability

This design primarily addresses:

- `TH-004` — stolen or leaked CI/CD credentials;
- `TH-006` — secrets in source or build output;
- `TH-009` — insecure infrastructure-as-code changes;
- `TH-013` — compromised workload identity and lateral movement;
- `TH-016` — cloud posture drift;
- `TH-017` — disabled or bypassed audit logging.

Mapped objectives include:

- `IAM-01`;
- `IAM-02`;
- `IAM-04`;
- `IAM-05`;
- `CICD-01`;
- `CICD-03`;
- `GOV-02`;
- `GOV-03`;
- `GOV-05`;
- `MON-01`.

## 19. Implementation status

**Designed** — the bootstrap and state architecture is defined but has not yet been provisioned or validated.