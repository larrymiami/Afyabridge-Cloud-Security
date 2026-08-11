# Terraform deployment role matrix

## Purpose

This matrix defines the permission-review contract for the federated Terraform plan and apply service accounts introduced in v0.7E.

It does not prescribe a universal production role set. Exact permissions depend on the target stack, resource hierarchy, state backend, enabled Google Cloud services, and whether grants can be scoped below project level.

## Global rules

- No `roles/owner` or `roles/editor` grants.
- No service-account keys.
- Plan and apply identities must remain separate.
- Plan must not inherit write permissions merely because the provider performs read operations during refresh.
- Apply permissions must be limited to the resource types and projects managed by the selected Terraform root.
- State access must be granted separately from workload-resource access.
- Service-account impersonation must be explicit and limited to service accounts that Terraform genuinely manages or uses.
- Folder, project, resource, repository, bucket, key-ring, and service-account scope should be preferred over organization-wide grants where possible.
- New permissions require a reviewed change with rationale, affected roots, expiry or review date, and validation evidence.

## Identity responsibilities

| Capability | Plan identity | Apply identity |
|---|---:|---:|
| Read Terraform configuration | Yes | Yes |
| Exchange GitHub OIDC token | Yes, through plan provider | Yes, through apply provider |
| Read remote state | Required when remote state is enabled | Required when remote state is enabled |
| Write remote state | No | Required for apply |
| Refresh managed-resource state | Read only | Yes |
| Create, update, or delete resources | No | Only reviewed resource types |
| Modify IAM | No by default | Only reviewed bindings required by Terraform |
| Create service-account keys | Never | Never |
| Impersonate runtime identities | No by default | Only when a managed resource requires explicit attachment or IAM management |
| Read secret payloads | Never by default | Never by default |
| Write secret payloads | Never | Never; payloads remain outside Terraform |
| Approve own production deployment | Not applicable | Prohibited through environment review controls |

## State backend permissions

When the Google Cloud Storage backend is enabled, review a dedicated state-bucket policy rather than granting broad project storage roles.

Suggested capability split:

| State operation | Plan | Apply |
|---|---:|---:|
| List/read state objects | Required | Required |
| Acquire and release Terraform state lock | Required when backend implementation needs it | Required |
| Create/update state objects | No for ordinary PR planning | Required for apply |
| Delete historical state versions | No | No by default |
| Change bucket IAM, retention, lifecycle, or encryption | No | Managed only by the separate bootstrap/foundation owner of the state bucket |

The exact Cloud Storage roles must be verified against the backend behavior and bucket policy. Project-wide `roles/storage.admin` should not be the default.

## Stack-specific review areas

### Bootstrap

Potential apply capabilities may include narrowly scoped management of:

- the state project and bucket;
- KMS resources protecting state;
- the Terraform execution identity;
- required project services and IAM.

Bootstrap is high impact and should not share a general workload apply identity without an explicit decision.

### Foundation

Review permissions for:

- folders and projects;
- project billing association;
- service enablement;
- organization policies;
- budgets and notifications;
- additive IAM bindings.

Organization- and folder-level roles require especially careful scoping and should not be granted to a workload-only apply identity.

### Network

Review permissions for:

- Shared VPC host and service projects;
- networks, subnets, routes, routers, NAT, firewalls, DNS, private service access, and VPC connectors;
- project attachment and service-agent interactions.

Network apply rights should be limited to the country network projects managed by the root.

### Workloads

Review permissions for:

- Artifact Registry;
- Secret Manager metadata and IAM, excluding secret payloads;
- Cloud KMS key rings, keys, and reviewed IAM;
- Cloud Run services and runtime service-account attachment;
- Cloud SQL instances and private connectivity;
- Cloud Storage buckets and IAM.

Permissions should be split by country project where feasible. A single apply identity with unrestricted rights across Kenya, Ghana, and South Africa increases the blast radius and should be treated as a temporary implementation stage rather than an end state.

### Federation

The federation bootstrap identity needs permission to manage:

- workload identity pools and providers;
- the Terraform plan and apply service accounts;
- `roles/iam.workloadIdentityUser` bindings;
- the reviewed additive role grants.

After bootstrap, routine plan and apply identities must not be able to broaden their own trust conditions or grant themselves additional project roles unless that self-management risk is explicitly accepted and controlled.

## Recommended evolution

The current reusable module supports one plan and one apply identity. Before live multi-country deployment, evaluate splitting apply identities into:

- bootstrap/foundation administration;
- network administration;
- Kenya workloads;
- Ghana workloads;
- South Africa workloads.

This reduces cross-country and cross-layer blast radius, supports separate GitHub environments and reviewers, and allows narrower IAM.

## Permission review record

Each role addition should record:

| Field | Required content |
|---|---|
| Identity | Plan or apply service account |
| Scope | Organization, folder, project, or resource |
| Role | Predefined or custom role identifier |
| Required permissions | Specific Terraform operations requiring the role |
| Target roots | Bootstrap, foundation, network, workloads, or federation |
| Alternatives considered | Narrower scope or custom role analysis |
| Risk | Privilege escalation, cross-country access, destructive capability, or data access |
| Approval | Reviewer and date |
| Validation | Successful plan/apply and negative tests |
| Review date | Scheduled reassessment |

## Live bootstrap permission record

The bootstrap root now has a live-validated steady-state permission set for `terraform-deployer`.

The project-level read contract is implemented as the custom role:

```text
projects/afyabridge-bootstrap-260808-lm/roles/afyabridgeTerraformBootstrapReader
```

with:

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

Bucket metadata mutation is separated into:

```text
projects/afyabridge-bootstrap-260808-lm/roles/afyabridgeTerraformStateBucketUpdater
```

containing only:

```text
storage.buckets.update
```

and conditionally bound to the protected Terraform state bucket only.

This permission set was derived through live provider refresh behavior and a denied-before / allowed-after bucket-label mutation test. Temporary discovery roles were removed and a final Terraform refresh completed with no drift. See `docs/evidence/v0.7h-bootstrap-live-validation.md`.

## Current implementation boundary

The bootstrap execution identity now has a measured and live-validated steady-state permission set. This does not establish a universal role set for the foundation, network, workload, observability, edge, or GitHub-federated deployment identities.

Those later identities must continue to follow the same rule: exact roles and permissions are not considered least-privilege until they are configured, applied, observed in use, and tested for both required access and denied excess access.
