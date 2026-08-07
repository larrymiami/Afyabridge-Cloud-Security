# Cloud posture evaluation and drift detection

## Purpose

v0.10B turns the v0.10A posture catalogue into executable posture decisions without pretending that a live Google Cloud organization has already been measured.

The design separates **collection** from **evaluation**:

```text
reviewed repository state                         future deployed GCP state
        |                                                  |
        v                                                  v
repository posture collector                  CAI / SCC / effective-state collector
        |                                                  |
        +---------------- normalized posture snapshot -----+
                                   |
                                   v
                         cloud posture rule evaluator
                                   |
                         +---------+----------+
                         |                    |
                         v                    v
                    JSON findings       Markdown evidence
```

The repository collector is operational in v0.10B. A live Google Cloud collector remains pending the v0.7 deployment path. Keeping the evaluator independent from the collector means future live state can be evaluated against the same control/finding model instead of creating a second CSPM system.

## Repository posture snapshot

`scripts/collect-repository-cloud-posture.mjs` derives normalized facts from reviewed Terraform modules and environment contracts. Current facts cover:

- service-account key creation/upload organization-policy intent;
- service-account-key, primitive-role, and public-principal Terraform resources/bindings;
- dedicated Cloud Run runtime identity;
- private Cloud SQL networking;
- Cloud Run ingress restrictions;
- Cloud Storage public-access prevention and uniform bucket-level access;
- KMS rotation, destruction delay, and destroy protection;
- Secret Manager use without Terraform-managed secret payload versions;
- Cloud Armor, WAF, rate limiting, TLS, HTTPS redirect, DNS, and backend logging;
- project metadata, default-network prohibition, and production deletion protection;
- centralized organization logging plumbing; and
- country/environment input guardrails.

This is **desired-state evidence**. It is not Cloud Asset Inventory or effective IAM evidence.

## Rule evaluation

`security/cloud-posture-rules.json` maps executable posture rules back to the existing v0.10A control IDs. `scripts/evaluate-cloud-posture.mjs` loads:

1. a normalized posture snapshot;
2. the executable rule set;
3. `security/cloud-posture-controls.json`; and
4. `security/cloud-posture-governance.json`.

Severity, ownership, merge-blocking policy, and the live-validation boundary therefore continue to come from the governed posture catalogue rather than being duplicated in the evaluator.

A repository rule may pass while its mapped control still has `live_validation_required: true`. The evidence explicitly reports both states.

## Fail-closed behavior

Critical and High rule failures inherit `merge_blocking: true` from the v0.10A governance profile. The security workflow runs the repository collector/evaluator inside `Security governance validation`, which feeds the protected-main `Security gate verdict`.

The negative suite mutates normalized security facts and verifies the expected rule fails as a blocking finding. Current scenarios cover service-account keys, primitive roles, public IAM, Cloud SQL public networking, Cloud Run public ingress, Cloud Armor removal, KMS rotation, secret payloads in Terraform, storage public exposure safeguards, project ownership labels, centralized logging, and country scope.

## Terraform drift adapter

`scripts/evaluate-terraform-drift.mjs` evaluates `terraform show -json` plan output in **drift mode**:

- `no-op` and data-source `read` actions are clean;
- unexpected managed-resource `create` or `update` actions are High findings;
- managed-resource `delete` or replacement actions are Critical findings.

The evaluator is intentionally not wired to claim live drift yet. A drift plan is meaningful only when generated against deployed remote state with no intentional configuration change. v0.10B therefore validates the decision logic with synthetic plan objects while the live v0.7 foundation remains pending.

## Evidence produced in CI

The security-gate evidence bundle will include:

- `cloud-posture-snapshot.json` — normalized desired-state facts;
- `cloud-posture-evaluation.json` — machine-readable rule results; and
- `cloud-posture-evaluation.md` — reviewer-readable summary and evidence boundary.

The evaluator exits non-zero for blocking Critical/High findings, so these artifacts are not advisory-only reports.

## Current boundary

v0.10B can claim automated repository desired-state posture evaluation and tested Terraform drift decision logic.

It does **not** yet claim:

- Cloud Asset Inventory queries;
- Security Command Center findings;
- effective organization-policy or IAM measurement;
- live resource-location inventory;
- a Terraform plan generated against deployed remote state for drift purposes;
- a real console/manual change detected and reconciled; or
- live finding remediation and closure.

Those claims remain gated on the v0.7 deployment path and later v0.10 operational validation.
