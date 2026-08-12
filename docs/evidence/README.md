# Validation evidence index

AfyaBridge separates **design**, **implementation**, **static validation**, and **live validation** so that repository claims do not exceed the evidence available for a control.

This directory contains reviewed evidence records for the major implemented milestones. Individual files record the exact revision, workflow or cloud context, validation method, observed failures where relevant, and the boundary of what was **not** proven.

## How to read the evidence

- **Designed** — architecture or control intent is documented, but no implementation claim is implied.
- **Implemented** — the control exists in code or configuration.
- **Statically validated** — CI or local tooling validated configuration without proving live cloud enforcement.
- **Live validated** — the relevant cloud or execution path was exercised and the observed behavior was recorded.
- **Negative validated** — an intentionally invalid context was exercised to prove a trust boundary fails closed.

Evidence is intentionally cumulative. A later record can extend an earlier one without retroactively changing what the earlier test proved at the time.

## Application and repository security

| Evidence | State | Focus |
|---|---|---|
| [v0.6](./v0.6-validation.md) | Validated | Application-security baseline and CI validation |
| [v0.8](./v0.8-validation.md) | Validated in CI | Shift-left security gates and repository evidence |

## v0.7 — Infrastructure and secure Google Cloud deployment

### Static infrastructure validation

| Evidence | State | Focus |
|---|---|---|
| [v0.7A](./v0.7a-validation.md) | Static validation | Terraform bootstrap foundation |
| [v0.7B](./v0.7b-validation.md) | Static validation | Resource hierarchy, projects, policies, IAM, and budgets |
| [v0.7C](./v0.7c-validation.md) | Static validation | Country-isolated networking and perimeter controls |
| [v0.7D](./v0.7d-validation.md) | Static validation | Workloads, KMS, secrets, Cloud Run, Cloud SQL, and storage |
| [v0.7E](./v0.7e-validation.md) | Static validation | GitHub OIDC / WIF architecture and plan/apply workflow contracts |
| [v0.7F](./v0.7f-validation.md) | Static validation | Centralized observability, monitoring, and detections |
| [v0.7G](./v0.7g-validation.md) | Static validation | Public edge, Cloud Armor, DNS, certificates, and HTTPS routing |

### Live deployment-control validation

These records form the current live-validated deployment-control chain:

```text
Terraform bootstrap
       |
       v
protected CMEK-backed state
       |
       v
GitHub OIDC -> plan WIF -> terraform-plan
       |
       v
saved plan + checksum + provenance
       |
       v
GitHub production approval
       |
       v
GitHub OIDC -> apply WIF -> terraform-apply
       |
       v
protected state locking + exact saved-plan apply
       |
       v
controlled Google provider mutation
       |
       v
negative trust-boundary tests
```

| Evidence | State | Focus |
|---|---|---|
| [v0.7H — Bootstrap live validation](./v0.7h-bootstrap-live-validation.md) | Live validated | CMEK-backed remote state, impersonation, measured bootstrap IAM, controlled bucket mutation, and temporary-privilege cleanup |
| [v0.7I — GitHub WIF plan validation](./v0.7i-github-wif-live-validation.md) | Live validated | GitHub OIDC exchange, dedicated plan identity, protected-state reads, provider refresh, and measured read permissions |
| [v0.7J — Protected apply validation](./v0.7j-github-wif-apply-validation.md) | Live validated | Production approval, immutable saved-plan provenance, apply identity, state locking/persistence, and measured backend permissions |
| [v0.7K — Provider mutation validation](./v0.7k-github-wif-provider-mutation-validation.md) | Live validated | Controlled one-resource Google provider mutation and measured `iam.serviceAccounts.get` / `iam.serviceAccounts.update` permissions |
| [v0.7L — Negative trust validation](./v0.7l-github-wif-negative-trust-validation.md) | Negative validated | Plan-to-apply identity isolation, non-main production protection, and missing-production-environment WIF rejection |

### Current live boundary

The v0.7H–v0.7L sequence proves the **bootstrap and GitHub-to-GCP deployment-control plane**. It does not yet prove live enforcement for the broader country foundation, Shared VPC, workload, observability, detection, public-edge, recovery, or runtime controls.

Those later stacks remain pending their own reviewed deployment and effectiveness evidence.

## v0.10 — Cloud security posture and governance

| Evidence | State | Focus |
|---|---|---|
| [v0.10A](./v0.10a-validation.md) | Repository validation | Governed posture catalogue and fail-closed policy validation |
| [v0.10B](./v0.10b-validation.md) | Repository validation | Desired-state posture collection and Terraform drift decision logic |
| [v0.10C](./v0.10c-validation.md) | Repository validation | Finding lifecycle, SLA, exceptions, remediation, and independent closure controls |
| [v0.10D](./v0.10d-validation.md) | Repository validation | Posture reporting, threshold decisions, evidence binding, and trend semantics |

These v0.10 records intentionally do **not** claim live Google Cloud posture. Cloud Asset Inventory, effective IAM and organization-policy collection, real remote-state drift exercises, live findings, and operational trend history remain gated on the later v0.7 deployment path.

## Evidence principles

Public evidence must not contain:

- service-account JSON keys;
- access tokens or OIDC credentials;
- secret payloads;
- real patient or employee data;
- unredacted sensitive values that are unnecessary to prove a control.

Where a validation attempt fails, the failure is retained when it materially establishes the permission or trust boundary being measured. Expected failures are not rewritten as successes; later evidence records the remediation and retest separately.

For overall project status, see [ROADMAP.md](../../ROADMAP.md). For the public project overview, see [README.md](../../README.md).
