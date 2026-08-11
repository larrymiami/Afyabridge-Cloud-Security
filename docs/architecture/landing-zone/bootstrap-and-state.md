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

The broader bootstrap layer consists of:

- a dedicated bootstrap project;
- a remote Terraform state bucket;
- encryption configuration for state;
- workload identity federation for GitHub Actions;
- narrowly scoped deployment service accounts;
- initial APIs required for project and folder management;
- audit logging and budget controls for the bootstrap project;
- recovery documentation for state and deployment identities.

The bootstrap layer does not host application workloads, application secrets, business data, or shared runtime services.

The current `infra/terraform/bootstrap` root implements only the in-project Terraform control-plane subset: required services, the state bucket, state KMS resources, and the bootstrap Terraform service account. The bootstrap project itself must already exist, and GitHub federation is implemented separately.

## 4. Bootstrap project

The target bootstrap project naming pattern is represented by:

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

### 4.1 Live validation instance

The first live bootstrap validation was performed in the dedicated lab project:

```text
afyabridge-bootstrap-260808-lm
```

The validation instance is evidence for the bootstrap control design, not a claim that the later production-style organization hierarchy has been deployed. The live validation record is `docs/evidence/v0.7h-bootstrap-live-validation.md`.

## 5. Bootstrap sequence

Bootstrap occurs in staged steps because the project, remote backend, and future federation path cannot all be created by the same already-running Terraform control plane.

### 5.1 Stage 0A — project prerequisite

An approved, billing-enabled bootstrap project is established through the project-governance process outside `infra/terraform/bootstrap`.

The current Terraform bootstrap root consumes that existing project ID and does not create its own parent project.

### 5.2 Stage 0B — local Terraform control-plane bootstrap

Stage 0B is the only phase that may require a privileged human administrator to run the bootstrap Terraform root locally.

It creates inside the approved project:

1. required project APIs;
2. the remote state bucket;
3. state-encryption configuration;
4. the Terraform deployment service account; and
5. the initial bucket/KMS IAM required by those resources.

Stage 0B must use:

- a dedicated administrative identity;
- multi-factor authentication;
- a clean local environment;
- no committed credentials;
- a reviewed Terraform plan;
- an execution log retained as bootstrap evidence.

The committed root is the **post-migration steady-state form** and contains `backend "gcs" {}`. For a first-ever bootstrap, use a temporary local working copy with that backend block removed, preserve the local state securely, then restore the committed configuration and migrate the state into the newly created GCS backend. The temporary local-backend edit must not be committed.

The v0.7H live validation exercised this current Terraform bootstrap root and its state, KMS, service-account, project-service, and IAM resources.

### 5.3 Stage 0C — federation handoff

The separate federation configuration establishes:

- the GitHub Workload Identity Pool and Provider;
- separate Terraform plan and apply identities;
- fixed impersonation paths; and
- repository, ref, workflow, and environment trust restrictions.

This stage is implemented in the repository but remains pending live validation.

### 5.4 Stage 1 — CI/CD-managed landing zone

After federation is live-validated, GitHub Actions uses short-lived credentials to manage:

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
- retention/recovery protection appropriate to the lab lifecycle and backend locking model;
- encryption with a dedicated customer-managed key where practical;
- access logs or audit logs;
- lifecycle rules for noncurrent versions;
- no anonymous or all-users bindings.

The current live bootstrap uses object versioning, a seven-day soft-delete window, and lifecycle cleanup for noncurrent versions instead of a bucket retention policy that could interfere with backend lock-object deletion.

### 6.2 State prefixes

State is separated by layer and environment.

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

Prefixes are logical state boundaries, but IAM scope must still be reviewed. A bucket-wide backend grant is not automatically equivalent to prefix-level least privilege.

### 6.3 State isolation

Separate state boundaries reduce blast radius and prevent unrelated deployments from requiring the same permissions.

At minimum, state is separated into:

- bootstrap;
- organization and folder hierarchy;
- common shared services;
- non-production foundation;
- each production country foundation.

Application and service-level states will be introduced in later phases and must not share write access with the landing-zone state.

Before later roots or federated identities share the live bootstrap state bucket, backend permissions must be re-reviewed and extended additively.

## 7. State access model

### 7.1 Human access

Routine human write access to Terraform state is prohibited in the target model.

Human administrators may receive temporary read or recovery access only when required for:

- investigation;
- state recovery;
- import or migration;
- approved break-glass operations.

Every such access must be logged and documented.

The v0.7H lab currently retains a service-account-scoped Token Creator path for the operator so the bootstrap can be revalidated before GitHub federation is enabled. This is a transitional lab bridge, not the final production-style human access model; it should be removed or converted to time-bounded/JIT access after federation handoff.

### 7.2 Automation access

Each Terraform deployment identity receives access only to its assigned state and target resources.

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

The current bootstrap bucket backend binding is bucket-level rather than prefix-conditioned. This is acceptable only for the present bootstrap-only live boundary. Before additional state identities are enabled, backend permissions must be re-reviewed against the intended state boundaries.

### 7.3 Validated bootstrap execution identity

The live bootstrap validation uses:

```text
terraform-deployer@afyabridge-bootstrap-260808-lm.iam.gserviceaccount.com
```

Steady-state project refresh permissions were reduced to a nine-permission custom reader, while `storage.buckets.update` is isolated in a second custom role conditionally scoped to the protected state bucket. Backend object access remains governed separately at the bucket level.

This split was validated with a denied-before / allowed-after mutation test and a final zero-change Terraform plan after temporary discovery grants were removed.

The nine-permission reader is a **refresh contract**, not a general apply contract. Privileged operations such as API enablement, KMS IAM remediation, bucket IAM remediation, service-account mutation, or resource creation remain fail-closed until separately approved write permissions are granted.

The bucket updater is resource-scoped but not field-scoped. `storage.buckets.update` can authorize multiple metadata changes on the allowed bucket and must therefore be treated as an apply capability. Where standing mutation is unnecessary, JIT/time-bounded assignment is preferred.

### 7.4 State-bucket IAM ownership

Repository policy requires additive IAM management for the state bucket. The reviewer security gate rejected the earlier authoritative `google_storage_bucket_iam_policy.terraform_state` resource because a whole-policy write can remove unrelated principals.

The branch now manages the bootstrap backend principal with:

```text
google_storage_bucket_iam_member.terraform_state_object_admin
```

The migration includes:

```hcl
removed {
  from = google_storage_bucket_iam_policy.terraform_state

  lifecycle {
    destroy = false
  }
}
```

This hands the old authoritative policy resource out of Terraform state without deleting the live bucket policy. The additive member resource then takes ownership only of the `terraform-deployer` Object Admin membership.

The reviewer-hardened code still requires one live migration apply and a final zero-change plan before the latest branch head can be called live drift-free. The migration requires temporary, narrowly scoped bucket IAM write capability; that permission must be removed after the handoff.

Later plan/apply identities must be added through reviewed additive IAM resources and re-evaluated against the intended state/prefix isolation model.

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
- grant decrypt permission only to approved storage/service identities and recovery administrators;
- enable rotation;
- retain audit logs for key use;
- prevent workload identities from using the key;
- document recovery implications if the key is disabled or destroyed.

The live bootstrap grants the Cloud Storage project service agent, rather than the Terraform deployer, the KMS encrypter/decrypter permission required for the bucket's default CMEK operation.

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

The v0.7H bootstrap validation used local ADC plus short-lived service-account impersonation to validate the Google Cloud side of the execution-identity boundary. It did **not** validate GitHub OIDC token exchange, repository variables, provider attribute conditions, or protected-environment enforcement.

## 11. Terraform workflow

The standard post-bootstrap infrastructure workflow is:

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

Direct production applies from developer laptops are prohibited after bootstrap and federation handoff.

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

The design is validated incrementally. v0.7H has demonstrated that:

- the bootstrap Terraform root can refresh a live Google Cloud control plane through service-account impersonation without a downloaded key;
- the protected state bucket and KMS resources were live and drift-free at the end of the initial validation exercise;
- the bootstrap provider refresh contract can operate with a reduced custom read role;
- a controlled bucket mutation fails without `storage.buckets.update` and succeeds after that exact permission is granted; and
- temporary project-level bootstrap and discovery privileges can be removed without breaking steady-state Terraform refresh.

Reviewer validation subsequently rejected the authoritative state-bucket IAM resource. The additive IAM replacement is implemented in the branch and passes the repository policy model, but its live state migration and final zero-change plan remain pending.

The following remain to be demonstrated separately:

- the additive bucket-IAM migration completes without deleting or broadening backend access;
- the latest branch returns to a zero-change plan after migration and temporary IAM write access is removed;
- GitHub Actions authenticates without a service-account key;
- unapproved repositories and branches cannot federate;
- the transitional human Token Creator bridge is removed or converted to JIT after federation handoff;
- a non-production deployer cannot write production state;
- one country deployer cannot write another country’s state;
- application identities cannot read the state bucket;
- object versioning can recover a deleted or damaged test state;
- concurrent applies to the same boundary are blocked;
- public access to the state bucket is prevented through live negative testing; and
- Terraform changes are traceable end-to-end from reviewed GitHub commits through the live deployment path.

## 17. Evidence

Current live bootstrap evidence is recorded in:

```text
docs/evidence/v0.7h-bootstrap-live-validation.md
```

Additional expected evidence includes:

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

**Partially live-validated** — the protected Terraform bootstrap control plane has been provisioned and validated in a dedicated Google Cloud lab project, including remote state, CMEK protection, service-account impersonation, measured refresh permissions, a controlled mutation test, temporary project-level privilege cleanup, and a zero-change plan for the initially validated configuration.

The reviewer-hardened additive bucket-IAM model is implemented but still requires its live state handoff and final no-drift proof. The current human impersonation bridge and bucket updater remain transitional bootstrap-lab boundaries that must be revisited during federation handoff. GitHub Workload Identity Federation and the later foundation, network, workload, observability, and edge stacks remain implemented/design artifacts pending their own live validation.
