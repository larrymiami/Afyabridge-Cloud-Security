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

AfyaBridge Cloud Security will use a dedicated bootstrap project and a staged bootstrap process.

### Bootstrap project

The target bootstrap project naming pattern is represented by `afyabridge-bootstrap-core`. It will contain:

- the remote Terraform state bucket;
- state-encryption configuration;
- the GitHub Actions workload identity pool and provider;
- bootstrap and project-factory deployment service accounts;
- minimum APIs and logging required for infrastructure management.

It will not host application workloads or business data.

The first live bootstrap validation uses the dedicated lab project `afyabridge-bootstrap-260808-lm` to exercise the control design without claiming that the later production-style organization hierarchy has been deployed.

The current `infra/terraform/bootstrap` root consumes an **existing** approved bootstrap project. Project creation and billing association are prerequisites handled outside that root.

### Stage 0A — project prerequisite

An approved, billing-enabled bootstrap project is established through the project-governance process.

The Terraform bootstrap root does not create its own parent project.

### Stage 0B — local Terraform bootstrap

A privileged administrator may run the small, reviewed bootstrap Terraform configuration locally to create the management-plane resources inside the approved project.

This is the only normal case where infrastructure may be applied locally with elevated privileges.

The live bootstrap exercise used short-lived service-account impersonation and temporary, time-bounded administrative grants rather than a downloaded service-account key. Temporary project-level grants were removed after validation.

The committed root represents its post-migration state and contains the GCS backend declaration. A first-ever bootstrap therefore uses a temporary local working copy without that backend block, followed by reviewed state migration into the protected bucket.

### Stage 0C — federation handoff

The separate federation configuration establishes GitHub Workload Identity Federation, plan/apply service accounts, and the reviewed repository/ref/environment trust conditions.

This stage is implemented in code but remains pending live validation.

### Stage 1 and later

After federation is validated, landing-zone changes will run through reviewed CI/CD workflows using workload identity federation.

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

Human access should be limited to temporary investigation, recovery, and break-glass operations once the federated path is live.

For the live bootstrap identity, steady-state provider refresh permissions were reduced to a custom nine-permission reader. Bucket metadata mutation is separated into a second custom role containing only `storage.buckets.update` and conditionally scoped to the protected state bucket. Backend object access is governed separately at the bucket level.

The `storage.buckets.update` permission is resource-scoped by the condition but not field-scoped; it remains an apply capability and should be made JIT/time-bounded where standing bucket mutation is unnecessary.

The human Token Creator binding used during v0.7H is scoped to the single Terraform service account and retained only as a transitional lab bridge before federation is live. It is not the final production-style operator access model.

Bucket backend IAM must be managed additively. The reviewer security gate rejected the authoritative bucket-policy resource, so the branch now uses `google_storage_bucket_iam_member.terraform_state_object_admin`. The state handoff from the earlier authoritative policy is declared with `removed { destroy = false }` to avoid clearing the live bucket policy while management moves to the additive member resource.

### Concurrency

CI/CD workflows will enforce one apply at a time per state boundary and will reject stale plans.

## Alternatives considered

### Local Terraform state

Rejected as a steady-state design because it would:

- make collaboration and recovery unreliable;
- increase the risk of state loss;
- encourage production applies from developer workstations;
- weaken auditability.

A temporary local state is accepted only for the one-time Stage-0 bootstrap before the remote backend exists.

### Single monolithic remote state

Rejected because it would:

- expand the blast radius of errors;
- require broad deployment permissions;
- couple countries and environments;
- increase lock contention;
- complicate recovery.

### Downloadable service-account keys in GitHub

Rejected because long-lived credentials can be leaked, copied, or used outside the intended workflow.

### Authoritative state-bucket IAM policy

Rejected after reviewer validation. A whole-policy resource can remove unrelated bucket principals and conflicts with the repository policy requiring additive IAM management.

The bootstrap root therefore uses an additive IAM member for its backend principal. Additional state principals must also be introduced through reviewed additive IAM ownership rather than by replacing the whole bucket policy.

### Manual infrastructure management after bootstrap

Rejected because it would create configuration drift and weaken review, traceability, and repeatability.

Temporary administrative handoff operations remain acceptable only where the Terraform execution identity cannot safely own or broaden its own IAM.

### Separate bootstrap project per country

Deferred because the initial landing zone does not require that level of duplication. Country-specific deployment identities and state boundaries provide sufficient isolation for the current design.

## Consequences

### Positive

- CI/CD can authenticate without long-lived credentials once federation is enabled.
- Terraform state is centrally protected and recoverable.
- Country and environment state boundaries reduce blast radius.
- Infrastructure changes can remain traceable to reviewed commits.
- Application identities cannot access management-plane state.
- Bootstrap responsibilities remain isolated from workloads.
- Live provider permissions can be measured rather than approximated with broad administrative roles.
- Additive bucket IAM avoids whole-policy replacement when later state principals are introduced.

### Negative

- Stage 0 still requires careful privileged human execution.
- The committed post-migration root needs a documented local-backend exception for first-ever creation.
- Multiple state boundaries add backend and workflow complexity.
- Recovery depends on preserving access to both the state bucket and its encryption key.
- Workload identity federation conditions require careful testing.
- The bootstrap project becomes a critical management-plane dependency.
- `storage.buckets.update` cannot be restricted to labels or one metadata field through the custom role alone.
- The reviewer-driven IAM resource migration requires one additional live state handoff and temporary bucket-IAM write capability before the latest branch can again be considered drift-free.

### Risks

- Overly broad bootstrap IAM could compromise the entire hierarchy.
- Incorrect federation conditions could allow untrusted workflows to authenticate.
- State may contain sensitive infrastructure metadata.
- A disabled or destroyed encryption key could prevent state recovery.
- Concurrency failures could corrupt or desynchronize state.
- A compromised apply-capable bootstrap identity could alter protected bucket metadata within the scope of its bucket updater permission.
- Incorrect migration from authoritative to additive IAM could disturb backend access if the old policy were destroyed rather than removed from state without remote deletion.

## Required controls

- multi-factor authentication for privileged bootstrap administrators;
- reviewed Stage-0 Terraform plan;
- no committed credentials;
- public-access prevention on state storage;
- state versioning and recovery testing;
- least-privilege state access;
- dedicated deployment identities;
- repository, branch, workflow, and environment restrictions in federation;
- audit logging for state, IAM, and KMS access;
- pipeline concurrency controls;
- break-glass recovery procedure;
- periodic verification that no user-managed CI/CD keys exist;
- additive state-bucket IAM management;
- a reviewed `removed { destroy = false }` handoff for the historical authoritative bucket-policy state;
- final no-drift validation after the additive IAM migration; and
- removal or JIT conversion of standing human bootstrap impersonation after federation handoff.

## Validation

The decision is validated incrementally.

The v0.7H live bootstrap exercise has demonstrated that:

- the bootstrap control plane can be provisioned and refreshed in live Google Cloud;
- Terraform can authenticate through short-lived service-account impersonation without a downloaded service-account key;
- remote bootstrap state is protected by a dedicated Cloud Storage bucket and Cloud KMS key;
- steady-state provider read requirements can be reduced to a measured custom role;
- a reversible bucket mutation is denied without `storage.buckets.update` and succeeds after that exact permission is granted;
- the mutation can be reverted cleanly; and
- temporary project-level bootstrap and discovery grants can be removed while that validated configuration remains drift-free.

Reviewer validation subsequently found the authoritative bucket-IAM resource and rejected it through the OPA `terraform-no-authoritative-iam-policy` rule. The branch has been corrected to additive IAM, but the live state handoff and final zero-change plan for that reviewer fix remain pending.

The following remain pending validation:

- the additive bucket-IAM state migration completes without clearing or broadening live access;
- a final zero-change plan succeeds after that migration and temporary IAM-write permission is removed;
- GitHub Actions successfully authenticates through workload identity federation;
- unapproved branches or repositories cannot federate;
- the standing human lab impersonation path is removed or converted to JIT after federation handoff;
- non-production identities cannot read or write production state;
- one country identity cannot modify another country’s state;
- application identities cannot access the state bucket;
- a deleted test state can be recovered from an earlier version;
- concurrent applies against the same state are prevented; and
- later CI/CD apply operations are traceable end-to-end to approved commits.

## Related documents

- [`../architecture/landing-zone/bootstrap-and-state.md`](../architecture/landing-zone/bootstrap-and-state.md)
- [`../architecture/landing-zone/project-factory.md`](../architecture/landing-zone/project-factory.md)
- [`../evidence/v0.7h-bootstrap-live-validation.md`](../evidence/v0.7h-bootstrap-live-validation.md)
- [`ADR-001-google-cloud-resource-hierarchy.md`](ADR-001-google-cloud-resource-hierarchy.md)
- [`ADR-002-country-isolation-model.md`](ADR-002-country-isolation-model.md)
- [`../security-objectives.md`](../security-objectives.md)
- [`../threat-model/threat-register.md`](../threat-model/threat-register.md)

## Implementation status

**Partially live-validated** — the protected Terraform bootstrap control plane, remote state, CMEK protection, scoped service-account impersonation, measured steady-state IAM, controlled mutation behavior, and temporary project-level privilege cleanup have been exercised in a dedicated Google Cloud lab project.

The reviewer-hardened additive bucket-IAM resource model is implemented but still needs its live state handoff and final no-drift proof. The current human impersonation path and bucket updater remain transitional bootstrap-lab capabilities. GitHub Workload Identity Federation, final plan/apply separation, and the foundation, network, workload, observability, and edge deployment paths remain pending live validation.
