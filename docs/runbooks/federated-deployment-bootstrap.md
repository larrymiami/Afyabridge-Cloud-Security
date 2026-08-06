# Federated deployment bootstrap

## Status

**Implemented as configuration; not deployed or runtime validated.**

This runbook defines the one-time bootstrap and repository controls required before GitHub Actions can use Google Cloud Workload Identity Federation for Terraform plans and applies.

## Security boundary

The federation stack cannot deploy itself through identities that do not yet exist. An authorized operator must perform the first reviewed deployment through an approved administrative path. After that deployment, GitHub Actions uses short-lived OIDC credentials and no service-account key files.

Do not add a JSON service-account key, access token, refresh token, or other long-lived Google Cloud credential to GitHub secrets as a bootstrap shortcut.

## Required repository variables

Configure these repository variables after the federation stack has been applied:

| Variable | Purpose |
|---|---|
| `GCP_FEDERATION_PROJECT_ID` | Project that owns the workload identity pool and deployment identities. |
| `GCP_WIF_PLAN_PROVIDER` | Full resource name of the plan workload identity provider. |
| `GCP_TERRAFORM_PLAN_SERVICE_ACCOUNT` | Email of the Terraform plan service account. |

The pull-request plan workflow skips until all three variables are present.

## Required production-environment variables

Create a GitHub environment named `production` and configure:

| Variable | Purpose |
|---|---|
| `GCP_WIF_APPLY_PROVIDER` | Full resource name of the protected apply workload identity provider. |
| `GCP_TERRAFORM_APPLY_SERVICE_ACCOUNT` | Email of the Terraform apply service account. |

`GCP_FEDERATION_PROJECT_ID` may remain a repository variable because it is not a credential. The apply provider and service-account email are also not secrets, but keeping them in the protected environment couples their availability to the deployment gate.

## Production environment protection

Configure the `production` environment with:

1. required reviewers;
2. prevention of self-review where supported;
3. deployment branches restricted to `main` only;
4. no unreviewed environment secrets;
5. no bypass for normal deployment operations.

The workflow declaration references `environment: production`, but the repository administrator must configure these protection rules in GitHub. A workflow file cannot prove that required reviewers or branch restrictions are active.

## One-time Google Cloud bootstrap

Use a reviewed administrative identity to:

1. confirm the federation project exists and the IAM Credentials and Security Token Service APIs are enabled;
2. create or select the Terraform state backend required by the federation root;
3. review `infra/terraform/environments/federation/terraform.tfvars.example`;
4. define explicit plan and apply role sets;
5. reject primitive `Owner` and `Editor` roles;
6. run Terraform formatting, initialization, validation, and plan;
7. obtain approval for the plan;
8. apply the federation stack;
9. record the workload identity pool, providers, service accounts, IAM bindings, operator, commit, and plan evidence;
10. configure the GitHub repository and environment variables from the Terraform outputs.

The example role sets are empty by design. The exact permissions depend on the state backend and infrastructure roots that the identities will manage. Add permissions only after mapping each Terraform operation to the smallest suitable predefined or custom role.

## Pull-request plan path

The pull-request workflow:

- accepts only same-repository pull requests targeting `main`;
- requests `contents: read` and `id-token: write` only;
- authenticates through the plan provider;
- impersonates only the plan service account;
- does not upload the binary Terraform plan;
- publishes only aggregate resource-change counts;
- removes generated credentials and local plan files.

Fork pull requests do not receive the federated plan identity.

## Protected apply path

The apply workflow is manually dispatched from `main` and requires:

- the full expected commit SHA;
- the literal confirmation value `APPLY`;
- repository and commit provenance checks;
- a saved Terraform plan created by the plan identity;
- a SHA-256 checksum and metadata record;
- an immutable GitHub Actions artifact retained for one day;
- approval through the `production` environment;
- re-verification of the artifact checksum, repository, commit, ref, and workflow run;
- application of that exact saved plan with the apply identity;
- serialized deployment concurrency with cancellation disabled.

A saved Terraform plan can contain sensitive values. The workflow does not print the plan contents, uses one-day artifact retention, and uploads only the files required for verification and apply. Do not use this pattern for roots that place plaintext secrets in Terraform state or plans.

## Activation checklist

Before enabling a real plan or apply:

- [ ] federation Terraform has been deployed through a reviewed bootstrap path;
- [ ] plan and apply service accounts have reviewed non-primitive permissions;
- [ ] no service-account keys exist for either identity;
- [ ] repository and owner numeric IDs match the intended GitHub repository;
- [ ] plan provider accepts only trusted pull-request or manual-main claims;
- [ ] apply provider accepts only protected `production` jobs on `main`;
- [ ] repository variables are configured;
- [ ] the `production` environment exists;
- [ ] required reviewers and branch restrictions are active;
- [ ] Terraform backend access is separated appropriately between plan and apply identities;
- [ ] a negative test confirms the plan identity cannot impersonate the apply account;
- [ ] a negative test confirms non-main and unprotected jobs cannot obtain apply credentials;
- [ ] audit evidence is recorded without credential material.

## Rollback and disablement

For an immediate federation stop:

1. disable both workload identity providers through the module input;
2. remove the GitHub repository and environment variables;
3. cancel active deployment runs;
4. inspect IAM Credentials and Security Token Service audit logs;
5. review recent service-account impersonation events;
6. remove excessive project roles without deleting the protected pool or service accounts during the incident;
7. re-enable only after claim conditions and IAM bindings have been reviewed.

Do not delete the pool, providers, or service accounts as an emergency first step. The module protects them from accidental Terraform destruction, and preserving the resources supports investigation and controlled recovery.
