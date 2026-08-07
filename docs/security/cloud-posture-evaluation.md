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
- service-account-key, primitive-role, and direct public-principal Terraform resources/bindings;
- dedicated Cloud Run runtime identity, non-public ingress, and public-invoker rejection;
- private Cloud SQL networking;
- Cloud Storage public-access prevention and uniform bucket-level access;
- KMS rotation/destruction fields, non-null reviewed defaults, and destroy protection;
- Secret Manager use without Terraform-managed secret payload versions;
- Cloud Armor, WAF, rate limiting, TLS, HTTPS redirect, DNS, and backend logging;
- project metadata, default-network prohibition, and production deletion protection;
- centralized organization logging plumbing; and
- country/environment input guardrails.

Generated `.terraform` directories are excluded from source scanning so downloaded provider/module caches do not become repository posture evidence.

This is **desired-state evidence**. It is not Cloud Asset Inventory, effective IAM, or effective organization-policy evidence.

### Collector boundary

The repository collector is intentionally a focused source-pattern collector over reviewed Terraform contracts, not a general HCL interpreter or a substitute for Terraform's effective plan/state model. It is used alongside Terraform validation, Trivy IaC scanning, OPA policy-as-code, the v0.10A control catalogue, and the future live-state collector.

Collector compromise tests mutate copied Terraform source and prove that relevant normalized facts change for unsafe configurations. This reduces the risk of a rule engine appearing healthy while its collector always emits safe values, but it does not turn source inspection into live cloud evidence.

## Governed executable rule set

`security/cloud-posture-rules.json` maps executable posture rules back to the existing v0.10A control IDs. `security/cloud-posture-governance.json` now also defines the reviewed executable posture contract:

- check-set identity;
- required rule/control bindings;
- allowed claim scopes;
- allowed snapshot sources; and
- allowed assertion operators.

`scripts/validate-cloud-posture-rules.mjs` anchors the 11 reviewed required rule/control bindings and fails if a required rule is deleted, remapped to another control, given an unsupported source/scope, stripped of assertions, or changed to an unsupported assertion operator. This prevents an empty or reduced rule set from silently reporting a clean posture result.

The rule-governance negative suite also tests deletion of a rule and its governance entry in the same mutation, plus remapping a required rule to a lower-severity control.

## Rule evaluation

`scripts/evaluate-cloud-posture.mjs` loads:

1. a normalized posture snapshot;
2. the executable rule set;
3. `security/cloud-posture-controls.json`; and
4. `security/cloud-posture-governance.json`.

Severity, ownership, merge-blocking policy, and the live-validation boundary therefore continue to come from the governed posture catalogue rather than being duplicated in the evaluator.

The reviewed v0.10B repository check set contains **11 rules and 39 assertions**. The current repository desired state passes **11/11** with zero blocking findings. All 11 mapped checks still report that live validation is pending because repository desired state is not equivalent to deployed Google Cloud effective state.

A Medium posture finding, such as removal of the project ownership label in the current policy model, is reported but is not merge-blocking by default. Critical and High findings remain merge-blocking. The evaluator tests both behaviors explicitly rather than assuming every severity has the same gate policy.

## Fail-closed behavior

Critical and High rule failures inherit `merge_blocking: true` from the v0.10A governance profile. The security workflow runs rule governance, repository collection, collector compromise tests, posture evaluation, evaluator decision tests, and drift tests inside `Security governance validation`, which feeds the protected-main `Security gate verdict`.

The current evaluator decision suite covers **17 scenarios** including:

- service-account key policy weakening and key creation;
- primitive roles and public principals;
- Cloud SQL public networking;
- unrestricted Cloud Run ingress and public invokers;
- Cloud Armor removal;
- KMS rotation/default and destruction-delay/default weakening;
- Terraform-managed secret payloads;
- storage public-access weakening;
- project metadata reporting behavior;
- centralized logging removal; and
- country-scope weakening.

The independent collector suite covers **13 scenarios**, including mutated Terraform and exclusion of generated `.terraform` cache content. The executable rule-governance suite covers **10 scenarios** including rule deletion/remapping and governance+rule deletion together.

## Terraform drift adapter

`scripts/evaluate-terraform-drift.mjs` evaluates `terraform show -json` plan output in **drift mode**:

- `no-op` and data-source `read` actions are clean;
- unexpected managed-resource `create` or `update` actions are High findings;
- managed-resource `delete` or replacement actions are Critical findings.

The drift decision suite covers **6 scenarios**: a clean no-op/read plan, update, create, delete, replacement, and ignored data-source read.

The evaluator is intentionally not wired to claim live drift yet. A drift plan is meaningful only when generated against deployed remote state with no intentional configuration change. v0.10B therefore validates the decision logic with synthetic plan objects while the live v0.7 foundation remains pending.

## Evidence produced in CI

The security-gate evidence bundle includes:

- `cloud-posture-snapshot.json` — normalized desired-state facts;
- `cloud-posture-evaluation.json` — machine-readable rule results; and
- `cloud-posture-evaluation.md` — reviewer-readable summary and evidence boundary.

The posture evaluation is also appended to the GitHub Actions job summary. The evaluator exits non-zero for blocking Critical/High findings, so these artifacts are not advisory-only reports.

## Current boundary

v0.10B can claim automated repository desired-state posture evaluation, fail-closed executable-rule governance, source-collector compromise testing, and tested Terraform drift decision logic.

It does **not** yet claim:

- Cloud Asset Inventory queries;
- Security Command Center findings;
- effective organization-policy or IAM measurement;
- live resource-location inventory;
- a Terraform plan generated against deployed remote state for drift purposes;
- a real console/manual change detected and reconciled; or
- live finding remediation and closure.

Those claims remain gated on the v0.7 deployment path and later v0.10 operational validation.
