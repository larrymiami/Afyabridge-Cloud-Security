# Logging pipeline failure

## Trigger

Cloud Logging reports export errors for a configured sink or destination.

## Triage

Identify the failing sink, destination, writer identity, project, and time window. Verify sink status, destination existence, writer permissions, bucket availability, quotas, and recent logging configuration changes.

## Containment

Preserve current logging configuration and audit records. Restore destination access or configuration through reviewed infrastructure as code. Avoid deleting or recreating sinks until the writer identity and failure cause are understood.

## Recovery

Confirm new matching log entries arrive in the intended bucket, security and country-local routes are both healthy, and no unintended cross-country delivery occurred. Record any telemetry gap and its duration.
