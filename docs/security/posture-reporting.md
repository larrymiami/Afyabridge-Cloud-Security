# Cloud security posture reporting and metrics

## Purpose

v0.10D turns the v0.10A control catalogue, v0.10B executable posture evaluation, and v0.10C governed finding lifecycle into a repeatable reporting and decision layer.

The reporting layer answers four questions:

1. What does the reviewed repository desired state currently prove?
2. What governed findings, remediation deadlines, risk acceptances, and verification work remain?
3. Does the current state produce a `pass`, `attention`, or `block` decision?
4. Is there enough trusted history to claim a trend, and if so, is that trend repository evidence or operational live-cloud evidence?

The current profile remains `repository-baseline`. v0.10D does **not** promote the project to live-cloud CSPM or claim operational performance.

## Inputs

The reporting engine consumes governed inputs rather than inventing a separate dashboard model:

- `security/cloud-posture-governance.json` — owners, severity/SLA policy, lifecycle states, finding sources, live-source boundary;
- `security/cloud-posture-controls.json` — reviewed control severities and exceptionability;
- `security/posture-findings.json` — operational finding lifecycle registry;
- `security/exceptions.json` — active and historical security exceptions;
- `security/posture-reporting-policy.json` — reporting thresholds, attention conditions, trend metrics, and evidence boundary;
- `security/posture-metrics-history.json` — governed trend history registry; and
- the current `cloud-posture-evaluation.json` produced from the v0.10B repository posture evaluator.

The committed finding registry and metrics-history registry intentionally begin empty. An empty registry means no operational finding has been recorded; it does not mean the live Google Cloud environment has been proved clean.

## Decision model

The reporting policy has three outcomes.

### PASS

`PASS` means the current governed repository evidence does not trigger a block or attention condition.

At the current repository-baseline stage, PASS can coexist with explicit live-validation debt. For example, all 11 repository posture rules can pass while all 11 still require later live Google Cloud validation.

A PASS therefore means:

> Reviewed repository desired state and governed lifecycle state satisfy the current repository-scoped decision policy.

It does **not** mean:

> Google Cloud effective state is fully compliant in production.

### ATTENTION

`ATTENTION` is used for governed state that does not currently block the repository but still requires explicit visibility. The reviewed conditions are:

- Medium/Low unaccepted active findings;
- valid time-bounded risk-accepted findings;
- non-blocking repository posture failures; and
- posture exceptions expiring within seven days.

Risk acceptance is not converted into PASS. It remains visible as ATTENTION until the risk is remediated and independently closed.

### BLOCK

The following thresholds are fixed at zero:

| Blocking condition | Maximum |
|---|---:|
| Overdue open/in-remediation findings | 0 |
| Unaccepted Critical/High findings | 0 |
| Repository merge-blocking posture failures | 0 |

A standalone report also fails closed when its upstream `Security governance validation` precondition is not `success`. This prevents the `always()` evidence job from publishing a misleading PASS report after governance validation fails.

## Reporting outputs

Each successful security-gate evidence run produces:

- `posture-report.json` — machine-readable decision, findings, SLA, exception, trend, category, and boundary data;
- `posture-report.md` — human-readable posture summary for GitHub Actions and review;
- `posture-metrics-snapshot.json` — the compact governed metric set for future trend comparison;
- the v0.10B cloud posture evaluation and normalized snapshot; and
- the existing machine-readable and human-readable security-gate evidence.

The report summarizes findings by status, severity, owner, and source. It reports SLA state, active/historical posture exceptions, seven-day expiry warnings, and pending independent verification.

The repository posture section reports:

- rules evaluated, passing, failing, and blocking;
- the number of rules still requiring live validation;
- a **repository desired-state pass percentage**; and
- category-level desired-state coverage.

The percentage is intentionally described as a **desired-state pass rate**, not a live cloud-security score.

## Evidence identity

Every report and compact metrics snapshot carries portable GitHub evidence context:

- repository;
- workflow;
- run ID;
- run attempt;
- event;
- ref; and
- commit checked out by the workflow.

For pull-request workflows, GitHub evaluates the synthetic PR merge ref. Therefore the report may contain a `refs/pull/<n>/merge` ref and its merge commit rather than the feature-branch head SHA. Both are useful: the PR head identifies the reviewed source revision, while the merge-ref context identifies exactly what GitHub Actions evaluated against the current base branch.

## Evaluation consistency

The report generator does not trust only the summary counters from the posture evaluator. It independently verifies that:

- the number of per-rule results equals `rules_evaluated`;
- per-rule pass/fail states reproduce the summary pass/fail totals;
- per-rule blocking states reproduce the summary blocking count; and
- per-rule live-validation flags reproduce the live-validation-pending count.

A modified summary therefore cannot make failing per-rule evidence look clean.

## Severity and exceptionability trust

Reporting decisions depend on the classification beneath them, so v0.10D anchors the reviewed control-security semantics rather than only validating that a severity is syntactically allowed.

The reporting governance validator pins the reviewed severity of all 18 active posture controls. A Critical control cannot silently become High, and a High control cannot silently become Medium to avoid a merge-blocking decision.

The validator also pins the reviewed exception boundary for all 18 controls:

- a non-exceptionable control cannot become exceptionable;
- an allowed exception lifetime cannot be extended beyond the reviewed maximum; and
- stricter changes, such as prohibiting an exception previously allowed or shortening its lifetime, remain permitted.

This prevents the reporting layer from being weakened by changing the classification or waiver policy underneath it.

## Trend model

The governed trend window is 30 days and requires at least two snapshots. The compact metrics are:

- active findings;
- overdue findings;
- risk-accepted findings;
- closed findings;
- repository failing rules; and
- repository blocking findings.

For all metrics except `closed_findings`, lower is better. For `closed_findings`, higher is better.

When fewer than two governed snapshots exist, the report emits:

```text
trend.status = insufficient-history
```

and does not fabricate an improving, worsening, or stable direction.

Synthetic tests exercise improving, worsening, and stable trend behavior, but synthetic history is test evidence only.

## Anti-fabrication history boundary

While the profile remains `repository-baseline`, the committed `security/posture-metrics-history.json` registry must remain empty.

This is deliberate. Without that rule, a pull request could add invented historical snapshots and manufacture an apparently improving trend. Repository CI still emits a metrics snapshot as an evidence artifact on every run, but those snapshots are not automatically promoted into trusted operational history.

Activating persistent trend history requires a future reviewed live-stage governance change that defines the trusted collection/retention mechanism and evidence provenance.

## Repository evidence versus operational evidence

v0.10D hard-codes the current reporting evidence mode as `repository-baseline`. Merely toggling one planned live source to `active` cannot cause a report to self-promote to `live-operational`.

A future operational reporting stage must be an explicit reviewed design change after the live v0.7 deployment path and appropriate CAI/SCC/remote-state collectors have been validated.

Current repository evidence may therefore show:

```text
Decision: PASS
Repository desired-state pass rate: 100%
Live validation pending: 11
Trend: insufficient-history / repository-evidence
Operational trend available: no
```

Those statements are compatible and intentional.

## CI enforcement path

v0.10D is part of the same required security path that protects `main`:

```text
exception governance
        |
        v
finding lifecycle governance
        |
        v
reporting-policy / history / severity / exceptionability governance
        |
        v
v0.10A / v0.10B posture validation
        |
        v
repository posture evaluation
        |
        v
governed posture decision report
        |
        v
reporting negative controls
        |
        v
Security gate evidence
        |
        v
Security gate verdict
```

The evidence job runs with `if: always()` so failed checks remain auditable, but it passes the upstream governance result to the report generator. A failed governance precondition therefore produces a BLOCK report instead of an independent clean PASS.

## Current evidence boundary

v0.10D proves repository reporting mechanics, threshold decisions, lifecycle/SLA summaries, exception visibility, anti-fabrication history controls, evidence identity, evaluation consistency, and synthetic trend logic.

It does not yet prove:

- live Cloud Asset Inventory or Security Command Center posture;
- effective IAM or organization-policy state in Google Cloud;
- real Terraform remote-state drift;
- operational remediation SLA performance;
- a real finding flowing through the complete lifecycle;
- trusted multi-run operational trend history; or
- a live dashboard driven by production cloud findings.

Those claims remain gated on the pending live v0.7 deployment and later shift-right/runtime validation.
