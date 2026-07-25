# Organization Policies

## Purpose

This document defines the preventive policy baseline for the AfyaBridge Google Cloud landing zone. Organization policies are intended to reduce unsafe configuration choices before workloads are deployed and to support the security objectives established in v0.1.

The policy set is applied progressively. Constraints are first evaluated in non-production, then enforced at the highest safe level after compatibility testing.

## Policy principles

1. Prefer managed constraints where Google Cloud provides an equivalent to a legacy constraint.
2. Apply policies as high in the resource hierarchy as practical.
3. Use folder-level exceptions only when a documented requirement cannot be satisfied by the organization baseline.
4. Treat every exception as time-bound, owned, approved, and reviewable.
5. Validate policies through negative tests before representing them as enforced.
6. Manage policy definitions and assignments through Terraform.
7. Avoid blanket enforcement that prevents required Google-managed service agents from functioning.

## Enforcement stages

| Stage | Meaning |
|---|---|
| Proposed | Constraint selected and rationale documented |
| Evaluated | Impact assessed against target services and projects |
| Tested | Applied to a non-production folder or project and validated |
| Enforced | Applied at the intended hierarchy level |
| Exception | Scoped override approved with compensating controls |

## Baseline policy catalogue

### Identity and service-account controls

| Policy objective | Intended control | Default scope | Validation |
|---|---|---|---|
| Prevent user-managed service-account key creation | Disable creation of service-account keys except approved break-glass cases | Organization | Attempt key creation and confirm denial |
| Prevent service-account key upload | Disable uploading external public keys to service accounts | Organization | Attempt key upload and confirm denial |
| Prevent automatic broad grants to default service accounts | Disable automatic IAM grants for default service accounts | Organization | Create eligible project and inspect IAM policy |
| Restrict external IAM principals | Allow only approved identity domains and explicitly required service agents | Organization with controlled exceptions | Attempt unauthorized external grant |
| Restrict cross-project service-account use | Limit attachment or use of service accounts across project boundaries | Production folders | Attempt prohibited attachment |

Workload Identity Federation is the standard authentication mechanism for GitHub Actions. Service-account keys are not an accepted CI/CD credential mechanism.

### Resource-location controls

| Policy objective | Intended control | Default scope | Validation |
|---|---|---|---|
| Restrict location-based resources | Allow approved locations defined in the region strategy | Production and common folders | Attempt deployment in an unapproved region |
| Keep country data within approved architecture locations | Apply country-folder location policy where supported | Country production folders | Validate allowed and denied resource creation |

The location policy applies only to services supported by the relevant constraint. Unsupported or global services require service-specific design review.

### Network controls

| Policy objective | Intended control | Default scope | Validation |
|---|---|---|---|
| Prevent default networks | Skip or remove default VPC creation through project-factory controls | All managed projects | Confirm new project has no default network |
| Prevent broad external exposure | Restrict public IP and public access patterns where supported | Production folders | Attempt prohibited public configuration |
| Require approved connectivity architecture | Use Shared VPC and controlled service networking | Production and non-production folders | Connectivity and attachment tests |
| Limit unmanaged protocol forwarding | Restrict risky forwarding and peering patterns where supported | Production folders | Negative deployment test |

Not every network requirement is enforceable through Organization Policy. Firewall policy, IAM, Shared VPC design, service configuration, and policy-as-code checks remain necessary.

### Storage and data controls

| Policy objective | Intended control | Default scope | Validation |
|---|---|---|---|
| Prevent public Cloud Storage access | Enforce public-access prevention for managed buckets | Production and common folders | Attempt anonymous access grant |
| Require uniform bucket-level access | Enforce uniform access for managed buckets | Production and common folders | Attempt object-level ACL configuration |
| Restrict unapproved retention changes | Protect selected log, state, backup, and evidence stores | Relevant projects | Attempt prohibited retention reduction |
| Require approved encryption posture | Use customer-managed encryption where required by design | Data, logging, bootstrap, and security projects | Inspect configuration and denied key-use tests |

### Platform and workload controls

| Policy objective | Intended control | Default scope | Validation |
|---|---|---|---|
| Restrict unapproved services | Maintain an approved service catalogue and API profile | Project factory | Request a prohibited service profile |
| Prevent unsafe deployment paths | Require reviewed Terraform and approved deployment identities | Production folders | Attempt deployment from a development identity |
| Restrict external image sources | Permit production deployment only from approved Artifact Registry repositories | Production workloads | Attempt unapproved image deployment |
| Enforce trusted artifacts | Integrate signing, provenance, and deployment policy in later phases | Production workloads | Attempt unsigned deployment |

## Policy inheritance

The intended inheritance model is:

```text
Organization baseline
  -> common folders
  -> production folder
      -> country folder
          -> workload project
  -> non-production folder
  -> sandbox folder
```

Country folders may add stricter location, IAM, network, and key controls. Child resources must not weaken inherited production controls without an approved exception.

## Exceptions

Every exception record must include:

- policy or constraint identifier;
- affected resource and scope;
- business or technical reason;
- owner;
- approving authority;
- start and expiry date;
- compensating controls;
- validation evidence;
- removal plan.

Permanent undocumented overrides are not permitted.

## Change process

1. Propose the policy change in a pull request.
2. Review service compatibility and blast radius.
3. Test the constraint in sandbox or development.
4. Record negative and positive validation evidence.
5. Apply to staging or a limited folder.
6. Enforce at the intended scope.
7. Monitor failures and exception requests.
8. Reassess after significant platform changes.

## Evidence

Expected evidence includes:

- Terraform policy resources;
- policy inheritance output;
- denied configuration attempts;
- successful approved deployments;
- exception records;
- Cloud Audit Logs for policy changes;
- periodic policy inventory exports.

## Mapped objectives and threats

Primary objectives:

- `CSPM-03`
- `CSPM-04`
- `GOV-01`
- `GOV-02`
- `GOV-03`
- `GOV-04`
- `NET-01`
- `NET-03`
- `SEC-01`

Primary threats:

- `TH-003`
- `TH-004`
- `TH-005`
- `TH-006`
- `TH-009`
- `TH-013`
- `TH-016`
- `TH-017`

## Implementation status

**Designed** — the policy baseline and rollout method are documented. Individual constraints remain **Planned** until they are applied and validated in a Google Cloud environment.
