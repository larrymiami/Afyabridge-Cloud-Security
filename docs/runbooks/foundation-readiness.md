# Foundation live-validation readiness

## Status and scope

Organization existence and bootstrap-project ancestry were confirmed by operator CLI output on 2026-10-29. The bootstrap project is directly under the domain organization. Keep the actual organization and billing identifiers in the protected execution configuration, not public evidence.

Merged PRs #83 and #86 establish the reconciled baseline and tested dependency/image remediation. They do not establish current cloud permissions or deploy the foundation.

The next slice is a **manual hierarchy-only rehearsal plan**. The fixed `hierarchy-validation.tfvars.example` overrides the broader defaults with Kenya/dev and no new projects. Its expected managed inventory is:

- shared folder;
- Kenya folder;
- Kenya DEV folder;
- key-creation and key-upload restrictions on the shared and Kenya folders (four policies).

That is seven managed resources. This is a staged live-validation footprint, not a reduction of the multi-country architecture. Project creation, billing attachment, IAM bindings, project budgets, other countries, networks, databases and workloads need later reviewed profiles. Never use the empty project map against a foundation state already containing projects: the rehearsal rejects deletions and unexpected inventory rather than treating their removal as cleanup.

## Read-only operator inspection

Use the existing domain identity. Do not create credentials or grant roles for this inspection. From the configured operator terminal, substitute the confirmed organization ID in `ORG_ID`:

```bash
OPERATOR_ACCOUNT=larry@larrymiami.com
ORG_ID=REPLACE_WITH_CONFIRMED_ORGANIZATION_ID
BOOTSTRAP_PROJECT=afyabridge-bootstrap-260808-lm

gcloud config get-value auth/impersonate_service_account
gcloud organizations describe "$ORG_ID" --account="$OPERATOR_ACCOUNT"
gcloud projects get-ancestors "$BOOTSTRAP_PROJECT" --account="$OPERATOR_ACCOUNT"
gcloud billing projects describe "$BOOTSTRAP_PROJECT" --account="$OPERATOR_ACCOUNT"
gcloud resource-manager folders list --organization="$ORG_ID" --account="$OPERATOR_ACCOUNT"
gcloud storage buckets describe gs://afyabridge-tfstate-49662756213 --account="$OPERATOR_ACCOUNT"
gcloud kms keys describe terraform-state \
  --keyring=afyabridge-terraform-state --location=africa-south1 \
  --project="$BOOTSTRAP_PROJECT" --account="$OPERATOR_ACCOUNT"
```

An existing impersonation setting can change the effective caller even when `--account` is supplied. Record it before interpreting permission denials. Do not silently clear or replace the operator's configuration. A permission denial is evidence of missing visibility, not proof that a resource does not exist.

Inspect direct IAM bindings locally using `gcloud organizations get-iam-policy`, `gcloud projects get-iam-policy`, and service-account `get-iam-policy` as authorized. Record role names and binding scope, including conditions, group membership and inheritance; direct binding output alone is not an effective-permissions proof. Do not paste full IAM policies or billing identifiers into public issues. The initial output needed to advance is: billing enabled yes/no, existing folder names, bucket/KMS existence and protection status, current impersonation setting, and any denied operations.

## Trust and permission prerequisites

The existing federation provider accepts only the exact federation plan/apply workflow paths. Its successful tests do not authorize the new foundation workflow. Do not relax those existing conditions or point this workflow at the federation plan/apply identities.

Before activating `terraform-foundation-plan.yml`, separately review and provision a dedicated foundation plan identity and provider. The provider must enforce all of:

- immutable repository and owner IDs matching this repository;
- exact repository `larrymiami/Afyabridge-Cloud-Security`;
- exact workflow ref `larrymiami/Afyabridge-Cloud-Security/.github/workflows/terraform-foundation-plan.yml@refs/heads/main`;
- `workflow_dispatch`, branch ref `refs/heads/main`, and branch ref type;
- environment claim `foundation-plan`.

Grant `roles/iam.workloadIdentityUser` only for that dedicated trust on the dedicated service account. Keep apply-identity impersonation unavailable. The new provider and service account are **not provisioned by this PR**; permission inventory must precede their reviewed bootstrap change.

Map read operations for folders and organization policies to the new identity at the narrowest scopes that can inspect the planned hierarchy. Review protected backend bucket metadata/object reads and the state-encryption access path separately. Do not reuse the bootstrap mutation role, grant organization-wide Owner/Editor, or add write permissions merely to make planning pass. The workflow disables Terraform state locking so it needs no lock-object creation/deletion. It must not run concurrently with a foundation apply. An empty/new foundation state prefix is acceptable; an inaccessible existing prefix is not equivalent to empty state.

Separate operator/bootstrap authority from execution authority. Organization existence does not prove the human can create folders or grant roles, and it does not prove the CI identity can plan them.

## Protected execution configuration

Create/review the `foundation-plan` GitHub environment with main-only deployment branches, required review, and self-review prevention where supported. A workflow declaration does not prove those settings exist. Configure:

| Setting | Location | Value source |
|---|---|---|
| `GCP_FOUNDATION_PLAN_PROVIDER` | Environment variable | Dedicated reviewed provider resource name |
| `GCP_FOUNDATION_PLAN_SERVICE_ACCOUNT` | Environment variable | Dedicated read-oriented service-account email |
| `GCP_FOUNDATION_ORGANIZATION_ID` | Environment variable | Operator-confirmed organization |
| `GCP_FOUNDATION_BILLING_ACCOUNT_ID` | Environment secret | Confirmed billing account; required root input, no billing mutation in this profile |
| `GCP_FEDERATION_PROJECT_ID` | Repository/environment variable | Existing identity host project |
| `GCP_TERRAFORM_STATE_BUCKET` | Repository/environment variable | Existing protected backend |
| `GCP_TERRAFORM_STATE_KMS_KEY` | Repository/environment variable | Existing state key resource name |

No service-account keys or access tokens belong in configuration. Missing settings fail before authentication. The manual input is the full reviewed main commit SHA and must equal the dispatch revision. The workflow runs no apply, uses committed provider selections read-only, keeps the fixed backend prefix `foundation/project-factory`, and publishes aggregate counts only. Terraform output, plan and generated credentials are deleted on completion. Failure logs are intentionally not published because they can contain infrastructure metadata. Reproduce failures through the approved operator path with local protected logs; report only sanitized error categories.

This rehearsal is not an apply authorization or a saved-plan handoff. The temporary plan is deliberately not uploaded and cannot be reused later. A future apply workflow must regenerate a reviewed plan for its final approved scope and implement approval, immutable artifact/checksum/provenance verification, a separate apply identity, concurrency protection and post-apply no-drift verification.

## Cost and cleanup boundary

Planning creates no folders, projects or workload resources. Existing state storage, KMS and API operations can still incur usage charges. No numeric cost estimate is asserted without current billing data. The first proposed apply footprint would contain only folders/policies; no Cloud SQL, connector, load balancer, Cloud Run or Artifact Registry resources are included.

The `$250`/`$150` amounts in the broad foundation example are synthetic alert settings, not cost estimates or an approved personal spend limit. The Terraform budget module configures alert thresholds; it does not implement a spending shutdown. Confirm currency, monthly limit and recipients before introducing projects/budgets.

The rehearsal leaves only CI aggregate evidence. Never delete the bootstrap state bucket or KMS key as cleanup. Folders have deletion protection and later projects use `PREVENT`; destructive teardown is not an automatic rollback. Future apply review must explicitly cover retained hierarchy, policy restoration and any separately approved teardown.

## Exit criteria

1. Current organization, ancestry, backend/KMS and billing observations recorded privately.
2. Human bootstrap authority, plan identity permissions and dedicated WIF trust reviewed and tested.
3. Protected environment settings verified out of band.
4. Main-only rehearsal produces exactly the seven expected managed resources, or the same protected inventory without destructive actions. Partial/deferred plans fail.
5. No unexpected resource, policy relaxation, replacement, deletion or raw plan publication.
6. Only then prepare the final saved-plan/apply path. No foundation apply is authorized by this readiness document.

References: [Cloud organization setup](https://cloud.google.com/resource-manager/docs/creating-managing-organization), [remote Terraform state](https://cloud.google.com/docs/terraform/resource-management/store-state), [billing budgets](https://cloud.google.com/billing/docs/how-to/budgets).
