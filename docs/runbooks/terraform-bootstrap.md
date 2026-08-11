# Terraform bootstrap runbook

## Purpose

Create the protected Terraform control plane used by later AfyaBridge infrastructure stacks. The bootstrap stack provisions the remote-state bucket, the state-encryption key, and the non-human Terraform execution identity.

## Scope and safety boundary

This runbook applies only to `infra/terraform/bootstrap`.

It does not create organization folders, country projects, Shared VPCs, application workloads, databases, or deployment federation.

The committed bootstrap root represents the **post-migration steady-state form** and therefore contains `backend "gcs" {}`. A first-ever bootstrap into an empty project is a one-time Stage-0 exception: create the bucket and KMS-backed state controls from a temporary local working copy with the backend block removed, preserve the local state securely, then restore the committed backend block and migrate that state to GCS. Do not commit the temporary local-backend edit.

## Preconditions

- An approved Google Cloud bootstrap project exists and has billing enabled.
- The operator is authenticated with an approved, phishing-resistant workforce identity.
- The operator has only the temporary permissions required to enable services and create the bootstrap resources.
- Terraform matches the version in `/.terraform-version`.
- No service-account JSON key is present locally or in the repository.
- A peer has reviewed the intended project ID, location, labels, soft-delete window, noncurrent-state history lifecycle, and execution identity.

## Prepare the configuration

```bash
cd infra/terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars
```

Populate `terraform.tfvars` with the approved bootstrap values. Do not commit the file.

Confirm that the project, bucket, key-ring, key, and service-account names follow `docs/standards/terraform-naming-and-labeling.md`.

Mandatory governance labels are reserved by the bootstrap root and must not be overridden through `var.labels`.

## Initialize and validate

### Existing or already-migrated bootstrap

Create a local ignored backend configuration such as:

```hcl
bucket             = "REPLACE_WITH_STATE_BUCKET"
prefix             = "bootstrap/core"
kms_encryption_key = "REPLACE_WITH_KMS_KEY_RESOURCE_NAME"
```

Then initialize the committed GCS backend:

```bash
terraform init -reconfigure -backend-config=backend.hcl
terraform fmt -check
terraform validate
```

### First-ever Stage-0 bootstrap

The remote backend cannot be initialized before its bucket exists. For the initial creation only:

1. make a temporary working copy of `infra/terraform/bootstrap` outside source control;
2. remove only the `backend "gcs" {}` block from that temporary copy;
3. initialize and apply using the default local backend;
4. keep the resulting local state on the encrypted operator workstation;
5. restore the committed post-migration configuration; and
6. migrate the local state to the protected GCS backend using the migration procedure below.

The temporary edit must never be committed, and the local state must not leave the approved workstation.

Review the generated `.terraform.lock.hcl` and commit it before applying the stack.

## Create and review the plan

```bash
terraform plan -out=bootstrap.tfplan
terraform show -no-color bootstrap.tfplan > bootstrap-plan.txt
```

Review the plan for:

- the expected bootstrap project only;
- no destructive actions;
- public access prevention on the state bucket;
- uniform bucket-level access;
- object versioning, soft delete, and noncurrent-version lifecycle;
- CMEK encryption using the intended Cloud KMS key;
- deletion protection or `prevent_destroy` on state and key resources;
- no primitive project roles;
- only the documented state and KMS permissions for the Terraform identity;
- no secrets, credentials, or real health data in resource metadata.

A second reviewer must approve the plan before apply.

## Apply the bootstrap stack

```bash
terraform apply bootstrap.tfplan
```

Immediately record the outputs:

```bash
terraform output
```

Capture the state bucket name, KMS key resource name, and Terraform service-account email in the validation evidence. Do not copy credentials or state contents into evidence files.

## Verify controls after apply

Verify through Terraform outputs and Google Cloud inventory that:

- the state bucket is not publicly accessible;
- public access prevention is enforced;
- uniform bucket-level access is enabled;
- versioning is enabled;
- the noncurrent-version lifecycle and soft-delete window are configured as reviewed;
- the default KMS key is the bootstrap state key;
- the key and bucket are in the approved location;
- the Terraform service account has no user-managed keys;
- IAM bindings match the reviewed plan;
- audit logging is available for storage, KMS, IAM, and service-account administration.

## Establish the steady-state execution handoff

The initial administrative bootstrap may need broader, temporary permissions than Terraform should retain for routine refresh and reviewed mutations.

The first live validation derived the following steady-state bootstrap read contract from actual provider behavior:

```text
resourcemanager.projects.get
serviceusage.services.get
serviceusage.services.list
cloudkms.keyRings.get
cloudkms.cryptoKeys.get
cloudkms.cryptoKeys.getIamPolicy
iam.serviceAccounts.get
storage.buckets.get
storage.buckets.getIamPolicy
```

Create the project custom reader with a short-lived administrative identity:

```yaml
title: "AfyaBridge Terraform Bootstrap Reader"
description: "Least-privilege steady-state read permissions for the AfyaBridge Terraform bootstrap stack."
stage: "GA"
includedPermissions:
- resourcemanager.projects.get
- serviceusage.services.get
- serviceusage.services.list
- cloudkms.keyRings.get
- cloudkms.cryptoKeys.get
- cloudkms.cryptoKeys.getIamPolicy
- iam.serviceAccounts.get
- storage.buckets.get
- storage.buckets.getIamPolicy
```

The validated live role ID is:

```text
afyabridgeTerraformBootstrapReader
```

Bucket metadata mutation is deliberately separated from the read contract. The validated live updater role contains only:

```text
storage.buckets.update
```

with role ID:

```text
afyabridgeTerraformStateBucketUpdater
```

Bind the updater only to the protected Terraform state bucket using a resource condition equivalent to:

```text
resource.type == 'storage.googleapis.com/Bucket'
&& resource.name == 'projects/_/buckets/<STATE_BUCKET_NAME>'
```

Do not replace these custom roles with broad `roles/storage.admin`, `roles/editor`, or other convenience roles.

### Important updater boundary

`storage.buckets.update` is resource-scoped by the IAM condition, but it is **not field-scoped**. On the allowed bucket it can authorize multiple classes of bucket metadata change, not only label edits. Treat it as an apply capability, not as part of the read-only plan contract.

Where routine bucket mutation is not required, prefer granting the updater just in time for an approved change window and removing it afterward. The v0.7H label test proves that this permission is required for the tested bucket metadata mutation; it does not claim that every metadata field should be permanently writable.

Bucket IAM mutation remains a separate privilege and requires its own reviewed permissions when Terraform must change the bucket policy.

### Operator impersonation

The operator must not use a downloaded service-account key. Grant `roles/iam.serviceAccountTokenCreator` on the individual Terraform service account, not project-wide, to the approved operator or later federation principal that needs to impersonate it.

Verify impersonation with short-lived credentials before Terraform execution:

```bash
gcloud auth application-default print-access-token \
  --impersonate-service-account="$TF_SA" \
  >/dev/null
```

Terraform can then use the same impersonation path through `GOOGLE_IMPERSONATE_SERVICE_ACCOUNT`.

The v0.7H lab retained this service-account-scoped human impersonation path so the live bootstrap can be revalidated before GitHub federation is enabled. It is a transitional lab capability, not the final production-style identity path. Remove standing human impersonation once the reviewed Workload Identity Federation plan/apply identities are live, or make human impersonation time-bounded/JIT for break-glass and recovery use.

### Administrative ownership boundary

The custom roles, their project bindings, and the service-account-level impersonation policy are Stage-0 administrative handoff artifacts. The routine `terraform-deployer` identity must not be granted permission to broaden or rewrite its own execution role merely so the bootstrap root can self-manage IAM.

Until a separately reviewed administrative Terraform root or equivalent control plane owns these handoff artifacts, recreate or change them only through this documented, peer-reviewed, temporary-privilege procedure and retain evidence of the change.

### State-bucket IAM ownership boundary

The current bootstrap resource `google_storage_bucket_iam_policy.terraform_state` is authoritative for the bucket-level IAM policy and currently grants backend object administration only to `terraform-deployer`.

That is acceptable for the present bootstrap-only validation boundary, but it creates an explicit future integration requirement: before separate federated plan/apply identities or later Terraform roots use this bucket, either:

1. manage every required state principal centrally in the authoritative bootstrap policy; or
2. migrate the bucket policy to reviewed non-authoritative IAM member resources.

Do not add later bucket principals out of band and assume they will survive a bootstrap apply. The selected ownership model must be reviewed before the shared state bucket is used by additional deployment identities.

## Validate least privilege

A steady-state validation must include both positive and negative evidence.

For refresh:

```bash
terraform plan
```

Expected result after discovery grants are removed:

```text
No changes. Your infrastructure matches the configuration.
```

For a new mutation permission, do not infer access from a predefined role. Use a reversible test where practical:

1. attempt the reviewed mutation without the candidate write permission;
2. record the exact denied permission;
3. grant only that permission at the narrowest practical scope;
4. repeat the same mutation;
5. revert the test change through Terraform; and
6. rerun a final zero-change plan.

The v0.7H bucket-label test proved `storage.buckets.update` using this denied-before / allowed-after method.

The steady-state reader is a refresh contract, not a promise that every future drift-remediation apply will succeed without additional approved JIT permissions. For example, API enablement and IAM-policy remediation remain privileged mutations and should fail closed until their exact write permissions are deliberately granted.

## Migrate bootstrap state to GCS

The committed root already contains the reviewed `backend "gcs" {}` block. From the Stage-0 local working state, create a temporary ignored backend configuration file:

```hcl
bucket             = "REPLACE_WITH_STATE_BUCKET"
prefix             = "bootstrap/core"
kms_encryption_key = "REPLACE_WITH_KMS_KEY_RESOURCE_NAME"
```

Restore the committed post-migration configuration, then migrate:

```bash
terraform init -migrate-state -backend-config=backend.hcl
```

Approve the migration only after Terraform identifies the intended bucket and prefix.

After migration:

```bash
terraform state list
terraform plan -detailed-exitcode
```

Expected result: the state lists the bootstrap resources and the plan exits with code `0`.

Securely delete the local state files and migration configuration after confirming the remote object and its encrypted version exist.

## Rollback and recovery

Do not destroy the state bucket or KMS key as a rollback mechanism.

For a failed resource apply before state migration:

1. preserve the local state securely;
2. record the failure and the last successful action;
3. correct the configuration;
4. run a new reviewed plan;
5. resume apply.

For a failed state migration:

1. stop all Terraform operations;
2. preserve both local and remote state versions;
3. compare serial and lineage metadata without editing state manually;
4. restore the last verified state version;
5. rerun `terraform init -migrate-state` under peer review.

Manual state modification requires an incident or approved change record.

## Evidence to retain

- reviewed plan summary;
- apply timestamp and operator identity;
- commit SHA and Terraform/provider versions;
- output resource identifiers;
- post-apply verification results;
- state-migration result;
- denied and allowed permission tests used for least-privilege discovery;
- final custom-role permission definitions and scopes;
- proof that temporary discovery/administrative bindings were removed;
- final zero-change plan;
- reviewer and exception records.

Evidence must not contain state contents, access tokens, credentials, secrets, or real patient data.

The first live bootstrap evidence record is `docs/evidence/v0.7h-bootstrap-live-validation.md`.
