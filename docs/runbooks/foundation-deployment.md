# Foundation deployment runbook

## Purpose

This runbook governs reviewed deployment of the v0.7B Google Cloud foundation: resource hierarchy, projects, baseline folder policies, additive project IAM, and project budgets.

The procedure assumes the v0.7A bootstrap state bucket and Terraform execution identity already exist.

## Preconditions

Before planning or applying:

- PR #8 or its successor has passed the Terraform foundation workflow;
- the foundation `.terraform.lock.hcl` is committed;
- the bootstrap state bucket, KMS key, and Terraform execution identity are available;
- the operator is authenticated through an approved short-lived identity flow;
- the billing account and organization identifiers are confirmed out of band;
- Google Groups and notification-channel identifiers have been reviewed;
- no service-account key file is present in the working tree;
- the change window and rollback owner are recorded.

## Prepare configuration

From the repository root:

```bash
cd infra/terraform/environments/foundation
cp terraform.tfvars.example terraform.tfvars
```

Replace synthetic values locally. Never commit `terraform.tfvars`.

Configure the protected GCS backend using reviewed backend arguments or a local ignored backend configuration file.

## Initialize

```bash
terraform init -reconfigure
terraform providers
terraform validate
terraform fmt -check -recursive ../..
```

Confirm that the selected providers match the committed lockfile.

## Create a reviewed plan

```bash
terraform plan \
  -input=false \
  -out=foundation.tfplan

terraform show -no-color foundation.tfplan > foundation-plan.txt
```

Review the plan for:

- expected shared-services, country, and environment folders;
- no folder or project deletion;
- no default network creation;
- correct project-to-folder placement;
- only approved APIs;
- additive IAM members only;
- no public IAM principals;
- expected service-account key restrictions;
- expected project budgets and thresholds;
- no unexpected provider replacement or state movement.

The binary plan and rendered plan may contain sensitive metadata. Store them only in the approved evidence location and never commit them.

## Apply

Apply only the reviewed saved plan:

```bash
terraform apply -input=false foundation.tfplan
```

Do not run an unreviewed direct `terraform apply`.

## Post-apply verification

Record and verify:

1. Folder hierarchy matches the approved structure.
2. Every project is attached to the correct shared, country, and environment folder.
3. Default networks are absent.
4. Required labels are present.
5. Managed APIs match the project inventory.
6. Service-account key creation and upload restrictions are effective at intended scopes.
7. IAM contains only approved groups and workload identities.
8. Public principals are absent.
9. Budgets and notification thresholds are configured.
10. Terraform reports no unexpected drift on a second plan.

Run:

```bash
terraform plan -detailed-exitcode -input=false
```

Expected exit code after a successful deployment is `0`.

## Failure handling

If planning fails, make no cloud changes. Correct configuration or permissions and regenerate the plan.

If apply partially fails:

1. preserve the state and apply logs;
2. do not delete state objects or force-unlock without confirming no active operation exists;
3. inspect the failed resource and cloud-side result;
4. run `terraform plan` to determine the remaining delta;
5. correct the narrowest safe cause;
6. obtain review before resuming.

## Rollback

Terraform rollback means applying a reviewed configuration that restores the prior approved state. Do not use ad hoc console deletion.

Folder and project deletion protection intentionally prevents destructive rollback. For incorrect placement or bindings:

- remove or correct the declaration in code;
- review the generated plan;
- apply the corrected plan;
- preserve evidence of the original and remediated state.

Organization-policy rollback must consider inherited behavior and access recovery. Validate that disabling a guardrail does not introduce an unreviewed credential or public-access path.

## Required evidence

Capture:

- source commit and PR;
- Terraform and provider versions;
- reviewed plan summary;
- apply result;
- folder and project inventory;
- effective policy checks;
- IAM checks;
- budget checks;
- post-apply no-drift plan;
- exceptions, failures, and remediation.

Do not capture secrets, access tokens, service-account keys, patient data, or unredacted sensitive identifiers in public repository evidence.
