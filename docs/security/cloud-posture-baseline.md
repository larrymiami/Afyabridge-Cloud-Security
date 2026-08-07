# Cloud security posture baseline

## Purpose

v0.10A establishes a machine-readable cloud security posture profile for AfyaBridge without claiming that Google Cloud posture has already been observed in a live organization.

The existing `docs/security-control-matrix.md` remains the authoritative project control catalogue and source of stable control identifiers. `security/cloud-posture-controls.json` does not create a competing control taxonomy; it selects posture-relevant controls from that matrix and adds the operational fields needed for automated posture evaluation: category, severity, owner, scope, implementation references, detection method, validation state, live-validation boundary, and exception constraints.

`security/cloud-posture-governance.json` defines the policy applied to that profile.

## Security question

Earlier milestones answer questions such as:

- what should be designed;
- what has been implemented in application or Terraform code;
- what repository checks prevent unsafe changes; and
- what supply-chain evidence proves how an artifact was built.

v0.10 asks a different question:

> How do we continuously know that the intended cloud controls still exist, remain correctly configured, have an accountable owner, and have not drifted?

v0.10A provides the baseline needed to answer that question before live cloud inventory is available.

## Posture model

The posture model separates four layers that must not be conflated:

1. **Control intent** — the stable requirement in `docs/security-control-matrix.md`.
2. **Reviewed desired state** — Terraform, workflows, policy-as-code, architecture decisions, and repository governance that express the intended control.
3. **Repository validation** — CI checks that can prove structural or configuration properties before deployment.
4. **Live cloud validation** — Cloud Asset Inventory, Security Command Center, Cloud Logging, effective IAM/policy state, drift tests, and remediation evidence after the v0.7 foundation is actually deployed.

A control can therefore be `ci-enforced` while still carrying `live_validation_required: true`. That means the repository prevents or detects a class of unsafe change, but the project does not yet claim that the equivalent Google Cloud runtime/effective-state control has been observed.

## Authoritative control lifecycle

The posture profile reuses IDs from `docs/security-control-matrix.md`, and the matrix lifecycle remains authoritative:

| Matrix status | Meaning for v0.10A |
|---|---|
| `Planned` | The control must not be presented as an active posture-baseline control. |
| `In progress` | Implementation or material validation is underway; this is used for the CSPM controls whose cloud/drift/finding outcome is not complete. |
| `Implemented` | The control is configured or coded, but its full matrix validation condition may still require live or negative testing. |
| `Validated` | Reserved for controls whose required positive and negative validation has actually passed. |
| `Accepted` / `Deferred` | Must not silently remain in the active posture profile without a separate reviewed lifecycle decision. |

The v0.10A catalogue currently maps to 13 `Implemented` and five `In progress` matrix controls. No posture control was promoted to `Validated` merely because Terraform or CI configuration exists.

The executable validator rejects an active posture entry whose authoritative matrix row is still `Planned`, `Accepted`, or `Deferred`. This prevents the machine-readable posture view from drifting ahead of the project's source of truth.

## Validation states

The machine-readable profile permits three current validation modes:

| Mode | Meaning |
|---|---|
| `repository-static` | Reviewed Terraform, workflow, documentation, or policy expresses the intended posture, but the full behaviour is not yet executable in the current environment. |
| `ci-enforced` | Repository CI actively fails when the reviewed repository-level invariant is violated. This still does not imply live cloud effectiveness unless `live_validation_required` is false. |
| `live-pending` | The material control outcome depends on deployed Google Cloud state and cannot honestly be represented as validated yet. |

Any control that requires future cloud validation must retain a substantive `pending_reason`.

## Governance policy

The baseline defines four severity classes and maximum remediation targets:

| Severity | Maximum remediation target | Merge blocking |
|---|---:|---|
| Critical | 24 hours | Yes |
| High | 7 days | Yes |
| Medium | 30 days | No by default |
| Low | 90 days | No by default |

These are governance targets for posture findings, not a guarantee that remediation has already been operationalized. v0.10C will implement the finding lifecycle, ownership, due-date, exception, and closure-evidence workflow around them.

The validator fails if Critical or High policy is weakened beyond the reviewed baseline.

## Scope

The v0.10A posture profile covers posture anchors across:

- workforce/deployment and workload identity;
- private data-service networking;
- approved public edge and DNS routing;
- KMS and Secret Manager boundaries;
- protected CI/CD and immutable build dependencies;
- public exposure, IAM, service-account-key, and configuration posture;
- approved deployment/data locations;
- drift detection;
- cloud asset ownership and metadata;
- finding governance and security exceptions; and
- centralized security-relevant logging.

The first profile intentionally reuses existing matrix IDs such as `IAM-C01`, `NET-C01`, `CSPM-C01`, and `GOV-C03` rather than introducing `POSTURE-*` aliases.

## Ownership

The governance profile currently permits the following control owners:

- `cloud-security` — cloud IAM, infrastructure security policy, posture policy, deployment trust, and cloud governance;
- `platform` — resource-factory and platform metadata standards;
- `application-security` — application/runtime secret and application security boundaries; and
- `security-operations` — security telemetry and operational detection ownership.

A posture control without an approved owner fails validation.

## Exceptions

The posture baseline reuses the existing `security/exceptions.json` governance mechanism rather than creating an unrelated exception system.

The validator binds the profile to that exact registry and to the reviewed fields `id`, `scope`, `rationale`, `compensating_controls`, `owner`, `approved_by`, `tracking_url`, `created_on`, and `expires_on`. Redirecting the profile to another JSON registry or removing a required field fails validation.

The global exception ceiling remains 90 days. Individual posture controls can prohibit exceptions or set a stricter maximum. Critical posture controls that permit exceptions are capped at 30 days by the executable validator.

An exception is not equivalent to a passing control. Future posture reporting must distinguish:

- passing controls;
- failing controls;
- accepted, non-expired exceptions; and
- expired or invalid exceptions.

v0.10A validates the contract. v0.10C will extend the finding-to-exception lifecycle where necessary while preserving independent approval and compensating-control requirements.

## Executable validation

`scripts/validate-cloud-posture-catalogue.mjs` fails when the posture profile loses required properties, including when:

- a posture control ID is duplicated or does not exist in the authoritative security control matrix;
- an active posture control's matrix lifecycle falls back to `Planned`, `Accepted`, or `Deferred`;
- a required control or posture category disappears;
- an unknown country, environment, owner, validation mode, or detector is introduced;
- an implementation reference points outside the repository or to a missing reviewed file;
- Critical or High remediation governance is weakened;
- the profile is redirected away from the reviewed security-exception registry or loses a required exception-governance field;
- a repository-baseline profile claims Cloud Asset Inventory, Security Command Center, Cloud Logging, or Terraform drift detection is already live;
- a live-pending control loses its pending rationale;
- a control exception exceeds the global or Critical-control limit; or
- the profile silently stops acknowledging that live Google Cloud validation remains outstanding.

Run locally with:

```bash
node scripts/validate-cloud-posture-catalogue.mjs
```

## Negative compromise and governance tests

`scripts/test-cloud-posture-catalogue.mjs` creates mutated in-memory posture fixtures and proves the validator fails closed. Each deny case also asserts the expected error text, so a mutation cannot be counted as successful merely because an unrelated validation happened to fail first.

The current suite contains one passing baseline and fourteen denied mutations covering:

- duplicate control IDs;
- IDs not present in the authoritative control matrix;
- an active posture entry pointing at a real matrix control still marked `Planned`;
- unknown country scope;
- unapproved control owners;
- removal of required category coverage;
- weakened Critical remediation SLA;
- redirecting exceptions away from `security/exceptions.json`;
- removal of the required exception approval field;
- falsely activating Cloud Asset Inventory at repository-baseline stage;
- falsely claiming a live cloud detector on an individual control;
- removing a live-validation rationale;
- pointing implementation evidence at a missing repository path; and
- exceeding the reviewed exception lifetime.

The suite currently reports **15 scenarios passed**: one allowed baseline plus fourteen expected denials.

Run locally with:

```bash
node scripts/test-cloud-posture-catalogue.mjs
```

## Live Google Cloud boundary

Cloud Asset Inventory and Security Command Center are deliberately marked `planned` in v0.10A.

They must not be changed to `active` merely because the Terraform or documentation exists. Activation requires, at minimum:

1. live Workload Identity Federation and deployment IAM validation;
2. application of the reviewed v0.7 Google Cloud foundation in a controlled environment;
3. reviewed enablement of CAI/SCC data sources and permissions; and
4. evidence from real positive, negative, drift, remediation, and closure tests.

The executable validator enforces this honesty boundary while the profile stage is `repository-baseline`.

Fifteen of the eighteen current posture controls explicitly retain `live_validation_required: true`. That is intentional evidence of the project's current boundary rather than a deficiency hidden from the posture report.

## Planned progression

v0.10 is intentionally split so the machine-readable baseline exists before live posture automation:

- **v0.10A — posture baseline:** control profile, governance contract, authoritative lifecycle traceability, executable validation, negative tests, and documentation.
- **v0.10B — posture and drift checks:** evaluate reviewed IaC and, once available, live asset/effective configuration for IAM, network, DNS, logging, encryption, data location, and drift.
- **v0.10C — governance lifecycle:** finding ownership, SLA, exceptions, compensating controls, remediation, expiry, and closure evidence.
- **v0.10D — posture reporting:** machine-readable findings and human-readable posture summaries, trends, evidence, and threshold decisions.

## Current claim

v0.10A can claim that AfyaBridge has a version-controlled, machine-readable posture baseline tied to the project's authoritative control IDs and lifecycle, and that CI can fail closed when that baseline, its ownership, its evidence references, its severity/exception governance, or its live-validation boundary is weakened.

v0.10A does **not** claim that a live Google Cloud asset inventory has been queried, that Security Command Center findings have been ingested, that effective organization policy or IAM has been measured, that a real console drift event has been detected, or that a cloud finding has been remediated through the full governance lifecycle.
