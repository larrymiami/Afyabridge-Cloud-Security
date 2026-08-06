# Federated deployment identity

## Status

**Implemented and statically validated.**

This document describes the v0.7E trust model for GitHub Actions authentication to Google Cloud. The federation resources have not been applied, and no GitHub-issued token has been exchanged for Google credentials. The design is therefore not evidence of an operational deployment path.

## Objectives

The deployment path must:

- avoid service-account keys and other long-lived Google Cloud credentials;
- use short-lived GitHub OIDC credentials;
- distinguish read-oriented Terraform planning from write-capable apply operations;
- bind trust to the immutable GitHub repository and owner identifiers;
- restrict plans and applies by event, branch, pull-request target, and protected environment;
- require human approval before production apply;
- ensure the applied Terraform plan is the same plan that was reviewed;
- serialize production applies;
- preserve auditable deployment metadata without publishing sensitive plan contents.

## Trust components

The federation root creates:

- one Google Cloud Workload Identity Pool;
- a dedicated GitHub OIDC provider for Terraform plan jobs;
- a separate GitHub OIDC provider for protected apply jobs;
- one Terraform plan service account;
- one Terraform apply service account;
- additive project IAM grants supplied through reviewed role inputs;
- service-account impersonation bindings using `roles/iam.workloadIdentityUser`.

No service-account key resource is declared.

## Immutable repository binding

The providers validate all of the following claims:

- repository owner ID `97871935`;
- repository ID `1310793524`;
- repository name `larrymiami/Afyabridge-Cloud-Security`.

The numeric identifiers protect against repository or account renaming and name reuse. The repository-name check preserves human-readable intent and catches mismatched configuration.

## Plan trust path

The plan provider maps a fixed `deployment_role` value of `plan`. Tokens accepted by this provider can impersonate only the Terraform plan service account.

Accepted contexts are:

1. same-repository pull-request workflows targeting `main`; or
2. manually dispatched planning workflows running from `main`.

Fork pull requests do not receive the trusted plan path. The pull-request workflow also checks that the head repository is the same repository before requesting an OIDC token.

The plan workflow:

- receives `contents: read` and `id-token: write` only;
- uses short-lived credentials through `google-github-actions/auth@v3`;
- runs formatting, initialization, validation, and planning;
- reports only aggregate resource-change counts;
- does not upload the binary PR plan;
- removes generated credentials and plan files;
- skips safely until the federation resources and required repository variables exist.

## Apply trust path

The apply provider maps a fixed `deployment_role` value of `apply`. Tokens accepted by the plan provider cannot impersonate the apply service account.

The apply provider requires:

- repository owner and repository numeric IDs;
- the trusted repository name;
- `refs/heads/main`;
- branch ref type;
- the protected `production` GitHub environment;
- a push or manually dispatched workflow event.

The manual deployment workflow additionally requires:

- a complete 40-character commit SHA;
- an explicit `APPLY` confirmation;
- checkout of that exact commit;
- plan creation with the plan identity;
- a saved binary plan;
- a SHA-256 checksum;
- repository, ref, commit, and workflow-run provenance metadata;
- a protected-environment approval boundary;
- artifact checksum and provenance verification after approval;
- application of the exact saved plan using the apply identity.

## Environment protection

The `production` GitHub environment is an external control and is not created by Terraform in this repository.

Before enabling apply, configure:

- required reviewers;
- prevention of self-review where supported;
- deployment branches restricted to `main`;
- environment-scoped apply provider and service-account variables;
- no long-lived cloud secrets.

A workflow naming an environment is not evidence that reviewers or branch restrictions are configured. Those settings require repository-level verification.

## Plan provenance

The apply workflow separates planning and application into different jobs and identities.

The plan artifact contains:

- the binary Terraform plan;
- a checksum file;
- provenance metadata identifying the repository, commit, ref, run ID, run attempt, actor, workflow, and generation time.

The apply job verifies the checksum and expected provenance before invoking Terraform. Production concurrency is serialized, and in-progress apply jobs are not automatically cancelled.

The binary plan is treated as sensitive deployment material. It is retained for one day and is not rendered into job summaries or PR comments.

## IAM model

The reusable module accepts explicit additive project roles for plan and apply identities. It rejects:

- `roles/owner`;
- `roles/editor`;
- malformed role identifiers.

The example configuration intentionally grants no roles. Permissions must be derived from reviewed Terraform plans and target resources rather than from broad convenience roles.

Project-level roles are not always the narrowest possible grant. Where supported, deployment permissions should be scoped to folders, projects, service accounts, state buckets, key rings, repositories, or individual resources.

## Bootstrap boundary

Workload Identity Federation cannot create itself through a federation path that does not yet exist. Initial creation therefore requires a separately controlled administrative identity.

The bootstrap process must:

1. review the Terraform configuration and role inputs;
2. generate and review a plan using an approved administrative session;
3. apply only the federation root;
4. record the resource inventory and IAM bindings;
5. configure repository and environment variables from Terraform outputs;
6. configure the protected `production` environment;
7. test positive and negative token-exchange scenarios;
8. remove temporary bootstrap access.

Creating a service-account key to bypass this sequence is prohibited.

## Emergency disablement

Both OIDC providers expose a disabled control. In a suspected workflow or identity compromise:

1. disable the providers;
2. stop deployment workflows;
3. inspect GitHub and Google Cloud audit records;
4. review environment approvals, workflow changes, IAM, and service-account impersonation;
5. restore trust only after the cause is understood.

Disabling federation does not revoke permissions granted independently to the service accounts or other identities.

## Validation boundary

Static Terraform validation confirms syntax, module composition, and provider-schema compatibility. It does not prove:

- GitHub claim values;
- attribute-condition behavior;
- successful token exchange;
- service-account impersonation;
- effective least privilege;
- protected-environment enforcement;
- plan artifact confidentiality or integrity in a real run;
- remote-state access;
- successful apply or rollback;
- audit-log delivery.

Live federation and deployment tests are required before this control can be described as operational.