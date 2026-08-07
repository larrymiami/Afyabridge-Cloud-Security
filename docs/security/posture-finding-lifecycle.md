# Cloud posture finding governance lifecycle

## Purpose

v0.10C governs what happens **after** a cloud-security posture issue is identified. The control catalogue and executable posture rules answer what should be secure and whether reviewed desired state satisfies that requirement; the finding lifecycle answers who owns a deviation, how quickly it must be handled, when risk may be accepted, and what evidence is required before closure.

The repository begins with an empty operational finding registry. Synthetic fixtures exercise the lifecycle until live Google Cloud sources are enabled through the pending v0.7 deployment path.

## Lifecycle

```text
                     +-------------------+
                     |       open        |
                     +---------+---------+
                               |
                 +-------------+-------------+
                 |                           |
                 v                           v
        +------------------+        +------------------+
        |  in-remediation  |<-------|  risk-accepted   |
        +--------+---------+        +---------+--------+
                 |                            |
                 +-------------+--------------+
                               |
                               v
                     +-------------------+
                     |     resolved      |
                     +---------+---------+
                               |
                    verification succeeds
                               |
                               v
                     +-------------------+
                     |      closed       |
                     +-------------------+

If independent verification fails:

resolved -> in-remediation -> resolved -> ... -> closed
```

`closed` is terminal. A later recurrence is a new finding rather than a mutation of closed history.

## Registry and identifiers

Operational findings live in `security/posture-findings.json` and use identifiers in the form `CSPM-FND-YYYY-NNN`. The identifier year must match the UTC year of `detected_at`.

Each finding records:

- source and mapped control;
- severity inherited from the active posture catalogue;
- approved owner;
- current status;
- detection timestamp and severity-derived remediation deadline;
- GitHub issue or pull-request tracking reference; and
- chronological lifecycle history.

Repository-posture findings must additionally name the executable `POSTURE-*` rule that produced the finding, and that rule must map to the same control ID.

## Source activation boundary

The governance profile distinguishes a source that is **known to the lifecycle schema** from one that is currently allowed to create operational findings.

Currently active sources are:

- `repository-posture`; and
- `manual-review`.

`terraform-drift` and `security-command-center` are recognized but inactive for operational findings. Terraform drift decision logic is currently validated only with synthetic plans, while Security Command Center remains planned until a live Google Cloud foundation exists. Activating either source requires a reviewed governance change and corresponding live evidence.

This prevents a committed finding from implying that a live integration exists before it has been demonstrated.

## Ownership and actors

Finding owners must be one of the approved governance owners:

- `cloud-security`;
- `platform`;
- `application-security`; or
- `security-operations`.

Lifecycle history actors are also governed. `security-automation` may create or update machine-generated lifecycle entries, while approved governance owners represent human/team actions. Arbitrary actor strings are rejected.

## Remediation SLA

The deadline derives from the v0.10A severity policy and cannot be extended in the finding record:

| Severity | Maximum remediation time | Merge-blocking posture severity |
|---|---:|---:|
| Critical | 24 hours | Yes |
| High | 168 hours / 7 days | Yes |
| Medium | 720 hours / 30 days | No |
| Low | 2160 hours / 90 days | No |

An `open` or `in-remediation` finding that remains unresolved after its deadline fails lifecycle validation.

A risk acceptance cannot be approved after the remediation deadline. This prevents an already-overdue finding from being retroactively made compliant by adding an exception.

A currently `risk-accepted` finding may remain past the baseline remediation deadline only while its linked exception is still active. That is intentional: the exception is the explicit, time-bounded governance decision replacing the normal remediation deadline for that period.

## Risk acceptance and security exceptions

v0.10C extends the existing `security/exceptions.json` registry instead of creating a second waiver system.

A risk-accepted finding must:

1. reference an existing `SEC-EX-YYYY-NNN` exception;
2. be explicitly listed in that exception's `finding_ids`;
3. have the same owner as the exception;
4. use an exception approver from the approved governance owners, distinct from the owner;
5. use the exception gate appropriate to its source;
6. map to a control whose catalogue entry explicitly permits exceptions;
7. remain within both the global exception maximum and the control-specific maximum; and
8. have been covered by the exception at the timestamp when risk was accepted.

The source-to-gate mapping is:

| Finding source | Required exception gate |
|---|---|
| repository-posture | cloud-posture |
| manual-review | cloud-posture |
| security-command-center | cloud-posture |
| terraform-drift | terraform-drift |

The global exception validator also rejects impossible calendar dates, future-created exceptions, expired exceptions, ID/year inconsistencies, duplicate finding links, self-approval, and lifetimes longer than 90 days.

### Historical exception semantics

An active risk acceptance requires an exception that is active **now**.

Once a finding leaves risk acceptance and is remediated or closed, the exception becomes historical audit evidence. Its later expiry does not invalidate the closed finding. The validator instead proves that the exception was valid at the original risk-acceptance timestamp.

This distinction avoids two unsafe outcomes:

- leaving active risk accepted indefinitely under an expired exception; or
- making old, correctly closed audit records invalid simply because their historical exception naturally expired.

## Resolution attempts and independent verification

Every transition into `resolved` creates exactly one entry in `resolution_attempts`. Attempts are never deleted when verification fails.

Each attempt records:

- the exact `resolved` history timestamp;
- a substantive remediation summary;
- remediation evidence; and
- verification status: `pending`, `failed`, or `passed`.

A current `resolved` finding has a final `pending` attempt and awaits independent verification.

If verification fails, the attempt records:

- independent verifier;
- verification timestamp; and
- verification evidence.

The next lifecycle transition must be back to `in-remediation`. The failed attempt remains in the registry permanently. A later transition to `resolved` creates a new attempt.

All non-terminal attempts must therefore be `failed`; evidence from an unsuccessful remediation cannot be overwritten by a later success.

## Closure

A finding closes only after the final resolution attempt has `verification_status: passed`.

Closure requires:

- an approved verifier who is different from the finding owner;
- verification after the remediation attempt was resolved;
- at least one closure-evidence reference;
- a terminal `closed` history event;
- `closed_at` equal to that terminal history timestamp; and
- the terminal history actor equal to the recorded verifier.

Evidence references may point to reviewed repository evidence (`repo:<path>`) or relevant GitHub Actions runs, issues, pull requests, or commits.

`closed` is terminal. If the same control fails again after closure, the new occurrence receives a new finding ID so the prior lifecycle remains immutable audit history.

## CI enforcement

The lifecycle is enforced inside the existing `Security governance validation` job:

```text
security exception validation
        |
        v
exception negative controls
        |
        v
posture finding lifecycle validation
        |
        v
finding lifecycle negative controls
        |
        v
v0.10A / v0.10B posture validation
        |
        v
Security gate evidence
        |
        v
Security gate verdict
```

The same `Security gate verdict` is the required status check protecting `main`, so invalid ownership, overdue findings, invalid exceptions, lost remediation evidence, or invalid closure history are not advisory findings.

## Evidence boundary

v0.10C proves the **repository governance mechanics** for finding ownership, remediation deadlines, risk acceptance, resolution attempts, independent verification, and closure.

It does not claim:

- a live Security Command Center finding;
- a live Cloud Asset Inventory posture finding;
- a real Terraform remote-state drift finding;
- a production incident or cloud misconfiguration progressing through this lifecycle; or
- measured remediation SLA performance over time.

Those operational claims require the pending live v0.7 deployment. v0.10D can then aggregate real and repository findings into posture metrics and trend reporting without changing the lifecycle contract defined here.
