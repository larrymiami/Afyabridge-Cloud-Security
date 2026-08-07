# Secret Manager access denied

## Trigger

Repeated denied Secret Manager operations reach the reviewed alert threshold.

## Immediate response

Identify the principal, target secret, project, country boundary, method, source workload, and time pattern. Determine whether the activity reflects a broken deployment, stale permissions, reconnaissance, or attempted cross-boundary access.

## Containment

Do not grant broader secret access simply to stop the alert. Correct the workload identity or narrow IAM binding only after confirming the intended access path. Disable a compromised principal when evidence supports credential misuse.

## Recovery and closure

Verify expected workloads can access only their required secrets, denied principals remain denied, and no unauthorized successful secret access occurred nearby. Follow `security-detection-response.md` for evidence and escalation requirements.
