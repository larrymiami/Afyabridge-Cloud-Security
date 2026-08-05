# Terraform naming and labeling standard

## Purpose

Provide deterministic names and labels for AfyaBridge Google Cloud resources so that ownership, country boundaries, environments, cost, security controls, and lifecycle can be identified without relying on tribal knowledge.

## Naming principles

Resource names must be:

- deterministic from reviewed inputs;
- lowercase unless the Google Cloud API requires otherwise;
- composed of letters, numbers, and hyphens where supported;
- free of personal names, secrets, health information, ticket numbers, and mutable descriptions;
- unique at the scope required by the target service;
- stable across routine Terraform refactoring.

Names must not encode data-classification values more specific than the approved label vocabulary.

## Canonical tokens

| Token | Allowed values or format | Meaning |
|---|---|---|
| `org` | `afyabridge` or `afb` | Project identity |
| `country` | `ke`, `gh`, `za`, `global` | Jurisdiction or global shared scope |
| `environment` | `dev`, `stg`, `prod`, `bootstrap`, `shared` | Deployment boundary |
| `system` | short stable system name | Owning platform or service |
| `component` | short stable component name | Resource purpose |
| `region` | approved short region token | Physical deployment region when needed |
| `instance` | two-digit sequence or stable discriminator | Collision avoidance |

## Default resource pattern

Where service rules allow:

```text
<org>-<country>-<environment>-<system>-<component>[-<region>][-<instance>]
```

Examples:

```text
afb-global-bootstrap-tf-state
afb-ke-prod-community-api
afb-gh-prod-data-postgres
afb-za-stg-network-nat-01
```

Globally unique resources may add a non-secret deterministic suffix derived from the organization or project ID. Random suffixes are permitted only when global uniqueness cannot be achieved predictably and the generated value is persisted in Terraform state.

## Google Cloud project IDs

Project IDs follow:

```text
afb-<country>-<environment>-<purpose>-<stable-suffix>
```

Examples:

```text
afb-global-bootstrap-core-1234
afb-ke-prod-host-1234
afb-gh-prod-app-1234
```

Project display names may be more readable, but must retain country, environment, and purpose.

## Service accounts

Service-account IDs follow:

```text
tf-<scope>-<purpose>
run-<system>-<component>
ops-<scope>-<purpose>
```

Examples:

```text
tf-bootstrap-admin
tf-ke-prod-deployer
run-community-api
ops-global-log-export
```

Do not include the word `owner`, a person's name, or a team member's email in a service-account ID.

## Storage buckets

Bucket names follow the default pattern and include a stable uniqueness suffix when required:

```text
afb-global-bootstrap-tf-state-1234
```

Bucket names must not contain confidential programme names or data subjects.

## KMS resources

Key rings:

```text
<country>-<environment>-<purpose>
```

Crypto keys:

```text
<system>-<data-domain>-<purpose>
```

Examples:

```text
global-bootstrap-terraform
terraform-state-encryption
community-household-database
```

Key names describe the protected domain, not individual datasets or records.

## Required labels

Every supported resource must receive these labels:

| Label | Requirement |
|---|---|
| `managed_by` | Must be `terraform` |
| `project` | Must be `afyabridge-cloud-security` |
| `environment` | Approved environment token |
| `country` | Approved country token or `global` |
| `system` | Stable owning system |
| `component` | Stable resource purpose |
| `data_classification` | `public`, `internal`, `confidential`, or `restricted` |
| `cost_center` | Approved finance or programme code |
| `owner` | Stable team or function, never an individual |
| `lifecycle` | `persistent`, `ephemeral`, or `bootstrap` |

Optional labels include `region`, `repository`, `compliance_scope`, and `backup_tier` when applicable.

## Label rules

- Label keys and values use lowercase letters, numbers, underscores, and hyphens as allowed by Google Cloud.
- Labels must not contain secrets, access tokens, personal data, health data, email addresses, or issue descriptions.
- Country-specific resources must not use `global` merely to avoid choosing a boundary.
- `restricted` is required for infrastructure directly storing or processing synthetic representations of health data in this reference implementation.
- Module defaults may provide stable values, but root configurations must explicitly supply country, environment, system, cost center, and owner.

## Terraform contract

Reusable modules accept a common `labels` map and merge it with module-specific labels. Required labels cannot be silently overwritten by callers.

Root modules validate canonical tokens and expose names through outputs rather than duplicating naming expressions across stacks.

Renaming a persistent resource requires a reviewed migration plan because a name change may force replacement. Terraform `moved` blocks or import procedures are preferred over uncontrolled recreation.

## Exceptions

A naming or labeling exception requires:

- the affected resource and service constraint;
- the proposed alternative;
- security, audit, cost, and migration impact;
- an owner and expiry date;
- approval in the relevant pull request or risk record.
