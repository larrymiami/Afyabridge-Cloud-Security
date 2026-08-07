# Security detection catalogue

## Status

Implemented as disabled-by-default Terraform controls and statically validated. No detection has yet been exercised against live Google Cloud audit telemetry.

## Detection engineering contract

Every detection must define a security objective, authoritative log source, filter, severity, owner, runbook, expected false positives, containment decision, and test method. A detection is not considered validated merely because its Terraform resource can be created.

| ID | Detection | Authoritative source | Severity | Owner | Initial test method |
|---|---|---|---|---|---|
| DET-IAM-001 | User-managed service-account key created or uploaded | Cloud Audit Logs for IAM service-account key operations | Critical | security-operations | Create a disposable key in a dedicated test project, verify one metric increment and one incident, then delete the key |
| DET-IAM-002 | Primitive Owner or Editor role granted | Cloud Audit Logs for IAM policy changes | Critical | security-operations | Grant a primitive role to a disposable test principal, verify the event, then remove the grant |
| DET-IAM-003 | Public IAM access granted | Cloud Audit Logs for IAM policy changes | Critical | security-operations | Add an `allUsers` or `allAuthenticatedUsers` binding to a disposable supported test resource, verify the signal, then remove it |
| DET-LOG-001 | Cloud Logging configuration changed | Cloud Audit Logs for Logging sink, bucket, view, or exclusion administration | High | security-operations | Create or modify a disposable logging object and verify metric and incident behavior |
| DET-KMS-001 | Cloud KMS key state or access changed | Cloud KMS Admin Activity audit logs | Critical | security-operations | Use a disposable test key to exercise a reviewed state or IAM change and verify the signal |
| DET-SEC-001 | Repeated Secret Manager access denial | Secret Manager Data Access audit logs | High | security-operations | Attempt denied access with a disposable unauthorized test identity until the reviewed threshold is reached |

## Filter validation requirements

Before enabling a rule, responders must compare the Terraform filter against real audit-log samples from the target organization. Method names and payload shapes can vary by API and operation; assumptions must be replaced with captured evidence.

Tests must prove both a positive and a negative case. The positive case demonstrates that the intended event increments the metric and opens an alert. The negative case demonstrates that a nearby legitimate action does not trigger the rule unexpectedly.

## False-positive review

Expected administrative activity can be legitimate, particularly during bootstrap, recovery, key rotation, or approved IAM changes. Suppression should prefer narrow, documented conditions such as an approved test principal or controlled resource scope. Broad exclusions that remove the security objective are not acceptable.

Every suppression or threshold change must record the reason, owner, review date, and residual risk.

## Incident expectations

Critical identity, public-access, and KMS detections should be treated as potential unauthorized control-plane changes until provenance is established. Logging-tampering events require immediate verification that security telemetry is still being delivered. Repeated Secret Manager denial can indicate broken workloads, reconnaissance, or credential misuse and should be investigated in context.

The responder runbook is `docs/runbooks/security-detection-response.md`.

## Future catalogue expansion

The next reviewed additions should cover Workload Identity Federation failures, apply-identity use outside the approved deployment path, denied organization-policy changes, dangerous firewall exposure, audit-log disablement, cross-country access attempts, and application authorization or offline-sync abuse events. These require live log samples or additional application telemetry before filters should be treated as authoritative.
