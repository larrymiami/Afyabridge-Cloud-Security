# Security detection response

## Purpose

This runbook defines the first-response workflow for v0.7F security detections. It is an operational contract, not evidence that any alert has been exercised in a live environment.

## Intake

Confirm the alert policy, metric name, affected project and resource, event timestamp, principal, source IP or workload identity where available, and the exact Cloud Audit Log entry that caused the metric increment. Preserve the original log entry and incident metadata before making changes.

Check whether the event maps to an approved deployment, break-glass action, test, recovery operation, or scheduled security maintenance. Approval must be established from an independent record; do not treat the actor's own description as sufficient provenance.

## Severity handling

Critical detections involving service-account keys, primitive roles, public access, or KMS changes require immediate ownership by security operations and rapid containment assessment. High-severity logging or Secret Manager signals require prompt investigation because they can represent loss of visibility, reconnaissance, or broken authorization.

If telemetry integrity is uncertain, treat subsequent absence of alerts as inconclusive until the logging path is independently verified.

## Investigation

Establish who performed the action, how they authenticated, what permission authorized it, which resource was modified, and whether the change crossed a country or environment boundary. Review adjacent audit events before and after the trigger to identify preparation, privilege escalation, persistence, lateral activity, or attempted cleanup.

For federated or service-account activity, correlate principal email, service-account impersonation records, Workload Identity Federation attributes, GitHub workflow metadata, repository/ref restrictions, and protected-environment approvals when those systems are live.

## Containment guidance

Containment must be proportionate and preserve evidence. Typical actions include removing an unauthorized IAM binding, disabling or deleting an unexpected service-account key, restoring a logging configuration, disabling a compromised identity, preventing further key use, or pausing a deployment path.

Do not disable or destroy a KMS key solely because a KMS alert fired. A key-state change can cause irreversible or widespread data impact. Confirm resource dependencies and choose a reviewed containment path.

Do not remove logging sinks or exclusions during investigation unless they are themselves the malicious change. Preserve the before-and-after configuration.

## Recovery

Restore the intended configuration from reviewed infrastructure as code where possible. Confirm that the unauthorized path is removed, intended workloads still function, and security telemetry continues to arrive.

For IAM incidents, verify both the explicit binding and effective inherited access. For logging incidents, verify destination permissions and actual delivery. For Secret Manager incidents, verify both the denied principal and successful expected workload access.

## Closure evidence

An incident should record the triggering log entry, investigation timeline, affected resources, authorization path, containment action, recovery verification, root cause, detection quality, false-positive assessment, and any filter or threshold changes.

A detection test should additionally record a negative control showing that a nearby legitimate event did not trigger unexpectedly.

## Escalation

Escalate when the event involves cross-country access, production health data, privileged identities, KMS material, logging impairment, multiple projects, evidence of persistence, or an uncertain blast radius. Legal, privacy, and organizational notification decisions belong to the later incident-response governance milestone and should not be improvised from this technical runbook.
