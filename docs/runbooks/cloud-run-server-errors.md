# Cloud Run server errors

## Trigger

Sustained Cloud Run HTTP 5xx responses above the reviewed threshold.

## Triage

Identify the affected country, service, revision, and location. Correlate the alert window with deployments, dependency failures, IAM changes, secret access, database connectivity, and platform incidents. Confirm whether failures affect one revision or all traffic.

## Containment

Prefer traffic rollback or revision rollback when a recent deployment is the likely cause. Do not broaden ingress, IAM, or network access to restore service unless the security impact is reviewed.

## Recovery

Confirm 5xx rates return to baseline, health checks succeed, dependent services recover, and no country boundary was crossed during remediation. Record the triggering revision and corrective change.
