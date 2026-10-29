# Dedicated foundation plan identity bootstrap

## Status

Prepared configuration only. The optional `foundation_plan` extension to the existing federation root is null by default. Existing federation callers therefore create no new identity or grants. Neither this module nor its disabled provider has been deployed by the agent.

This builds on PR #87's main-only hierarchy rehearsal. It creates a distinct `terraform-foundation-plan` service account, `github-foundation-plan` pool, provider, scoped impersonation and read-oriented grants. It creates no apply identity, folders, projects, keys, or new state bucket.

## Operator observations — 2026-10-29

The operator supplied CLI and Admin console evidence establishing:

- Domain organization exists and the bootstrap project is directly under it; billing is enabled.
- Default CLI service-account impersonation is unset; explicit impersonation of `terraform-deployer` successfully reads bootstrap project metadata.
- The organization policy grants Organization Administrator to `gcp-org-admins@larrymiami.com`; the directory UI confirms this group exists and contains `larry@larrymiami.com` directly.
- The directory UI also confirms membership in `gcp-billing-admins@larrymiami.com`. This is group-membership evidence, not proof of that group's Cloud Billing role bindings.
- The user's direct service-account list request was denied. Project IAM confirms separate bootstrap, federation-plan and federation-apply reader roles and a condition limiting the bootstrap updater to bucket metadata on the protected state bucket. No broad replacement grant is required by these observations.
- Impersonated bucket metadata reads confirm configured CMEK, public access prevention, uniform access, versioning, seven-day soft deletion and a noncurrent-version lifecycle rule.
- Impersonated KMS metadata reads confirm an enabled primary symmetric key with 90-day rotation.
- The Cloud Identity CLI group lookup failed, but the Admin console independently confirms the group and membership. The lookup failure's cause remains undiagnosed.

These are operator-supplied observations, not agent-authenticated cloud checks. They do not prove current state-object decryption, dedicated CI trust, or effective foundation permissions. Keep raw policies, organization/billing IDs and live plan/state material private.

## Desired execution permissions

| Scope | Additive grant | Purpose / boundary |
|---|---|---|
| Reviewed organization | `roles/resourcemanager.folderViewer` | Folder/project metadata and organization-policy reads; no hierarchy or policy writes |
| Existing identity host project | `roles/serviceusage.serviceUsageConsumer` | Quota consumption for provider API calls; no resource-creation authority |
| Existing protected state bucket | `roles/storage.bucketViewer` | Bucket metadata reads |
| Same bucket, conditional | `roles/storage.objectViewer` | Foundation state content reads; object listing at bucket scope |
| New service account only | `roles/iam.workloadIdentityUser` | Impersonation only from the dedicated pool/repository attribute, subject to the provider condition |

The bucket object condition permits content reads only under `foundation/project-factory/`. Object listing uses the bucket resource and exposes object names and metadata throughout the shared state bucket. IAM `resource.name` conditions cannot restrict object listing to a prefix; do not claim full metadata isolation. If this visibility is unacceptable, provision a separately reviewed foundation state bucket before enabling trust, rather than relaxing object-content conditions.

No `storage.objects.create`, update or delete, lock-object mutation, bucket IAM mutation, token-creator role, or apply identity is granted to the new account. GCS performs CMEK decryption through the existing storage service agent; this module does not grant direct KMS access or alter its existing binding. Verify object reads separately during live validation.

`GOOGLE_BILLING_PROJECT` in the foundation workflow selects the identity host for API quota attribution. The root's billing-account input is configuration metadata only in the hierarchy-only profile; no billing role or project attachment is needed for this plan.

## Desired trust contract

The new provider condition requires all eight checks: immutable owner ID, immutable repository ID, exact repository name, exact foundation workflow ref on main, main branch ref, branch ref type, manual dispatch event, and `foundation-plan` environment. Trust starts disabled. Existing federation providers, service accounts and role sets are unchanged.

Do not add human impersonation to the new account as a workaround for CI validation; use the exact GitHub workflow once the protected environment has been independently configured and reviewed.

## Bootstrap execution procedure

1. Merge/review the readiness workflow and this bootstrap configuration; establish the exact source SHA and current successful security/validation checks. Review the shared-bucket listing visibility above.
2. Use an authorized operator with short-lived credentials. Preserve the existing federation root's private configuration and protected `federation/core` backend, bucket, and KMS settings. Do not initialize an empty replacement state or import/recreate existing federation resources.
3. Compare `foundation-plan.tfvars.example` and add only its `foundation_plan` block to the existing ignored configuration, with the operator-confirmed organization and bucket. Keep `provider_enabled = false`. Preserve existing `project_id`, role sets and environment values; omitting existing non-default values can revoke grants.
4. Review the operator's bootstrap capabilities separately from the execution identity. Required mutations include service-account and WIF pool/provider creation, new-account IAM, an additive organization reader binding, an additive quota grant, and additive bucket IAM members. The ordinary user can read organization/project policies but has already demonstrated that some project IAM operations are unavailable. Do not elevate `terraform-deployer`, `terraform-plan`, or `terraform-apply` to bootstrap this extension.
5. Where operator permissions are missing, prepare narrowly scoped, expiring bootstrap grants for review. Service-account and WIF administration belong only on the identity host; bucket IAM changes belong only on the protected bucket; the organization change is only the new account's reader binding. Organization Administrator is not proof of service-account/WIF or Storage administration. No broad Owner/Editor or unconditional Storage Admin workaround is prescribed here.
6. Initialize the existing federation backend with `-lockfile=readonly`, validate, and generate a saved plan under the approved operator path. Keep logs/plan private. The delta must be **eight added resources**, zero changes/replacements/deletions of existing resources: one account, one pool, one disabled provider, one account IAM member, one organization IAM member, one project IAM member and two bucket IAM members.
7. Review that exact plan, then apply it through the authorized operator path. Capture sanitized result counts and the source SHA. Recheck old federation trust and role bindings; remove temporary bootstrap grants and verify cleanup. This document is not evidence of an apply.
8. Confirm protected environment `foundation-plan` is main-only and requires review, with the expected provider/account/organization/billing/backend settings. Outputs are available with `terraform output foundation_plan`; keep infrastructure metadata in the protected configuration.
9. Produce and review a separate saved plan changing only `provider_enabled` from false to true. Apply only that reviewed provider activation; no new grant should appear. Dispatch the foundation workflow from reviewed main with the exact SHA.

The existing federation deployment workflows do not automatically load the local opt-in configuration. Do not dispatch them after bootstrapping without preserving that configuration: a missing block would propose removing the extension (and its deletion-protected resources would refuse destruction). Generalizing the federation workflow configuration is separate work; use the reviewed operator path for this slice.

## Live acceptance and rollback

Successful activation must prove that the exact foundation context can impersonate the new account, read only the intended state content, and plan the seven hierarchy/policy resources. Test denials for wrong branch, event, environment, workflow and repository identity; test writes and reads of non-foundation state content are denied. Offline tests validate desired configuration and scope guards, not Google token exchange or effective IAM.

A disabled provider should reject token exchange. Disabling the new provider is the first trust rollback; it does not revoke already issued short-lived credentials. Revoking the new account's grants is a separately reviewed response where immediate access reduction is needed. Preserve existing federation identities, state, KMS and unrelated bucket bindings. Do not delete the shared state bucket or its key as cleanup.

References: [Folder Viewer permissions](https://cloud.google.com/iam/docs/roles-permissions/resourcemanager), [Storage IAM Conditions and listing limits](https://cloud.google.com/storage/docs/access-control/iam), [GCS backend encryption](https://developer.hashicorp.com/terraform/language/backend/gcs).
