# Terraform bootstrap runbook

## Purpose

Create the protected Terraform control plane used by later AfyaBridge infrastructure stacks. The bootstrap stack provisions the remote-state bucket, the state-encryption key, and the non-human Terraform execution identity.

## Scope and safety boundary

This runbook applies only to `infra/terraform/bootstrap`.

It does not create organization folders, country projects, Shared VPCs, application workloads, databases, or deployment federation.

The bootstrap stack starts with local state because its remote backend does not yet exist. Local state is sensitive and must remain on an encrypted operator workstation until migration is complete.

## Preconditions

- An approved Google Cloud bootstrap project exists and has billing enabled.
- The operator is authenticated with an approved, phishing-resistant workforce identity.
- The operator has only the temporary permissions required to enable services and create the bootstrap resources.
- Terraform matches the version in `/.terraform-version`.
- No service-account JSON key is present locally or in the repository.
- A peer has reviewed the intended project ID, location, labels, retention period, and execution identity.

## Prepare the configuration

```bash
cd infra/terraform/bootstrap
cp terraform.tfvars.example terraform.tfvars
```

Populate `terraform.tfvars` with the approved bootstrap values. Do not commit the file.

Confirm that the project, bucket, key-ring, key, and service-account names follow `docs/standards/terraform-naming-and-labeling.md`.

## Initialize and validate

```bash
terraform init
terraform fmt -check
terraform validate
```

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
- object versioning and retention;
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
- retention is configured as reviewed;
- the default KMS key is the bootstrap state key;
- the key and bucket are in the approved location;
- the Terraform service account has no user-managed keys;
- IAM bindings match the reviewed plan;
- audit logging is available for storage, KMS, IAM, and service-account administration.

## Migrate bootstrap state to GCS

Create a temporary backend configuration file outside source control:

```hcl
bucket      = "REPLACE_WITH_STATE_BUCKET"
prefix      = "bootstrap"
encryption_key = "REPLACE_WITH_KMS_KEY_RESOURCE_NAME"
```

Add the reviewed `backend "gcs" {}` block to the bootstrap root, then migrate:

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
- final zero-change plan;
- reviewer and exception records.

Evidence must not contain state contents, access tokens, credentials, secrets, or real patient data.
