# Logging configuration changed

## Trigger

A security-relevant Cloud Logging sink, exclusion, bucket, view, metric, or related configuration is created, updated, or deleted.

## Immediate response

Identify the exact object, actor, policy change, and approval context. Compare the live configuration with the reviewed Terraform definition and determine whether telemetry collection, routing, retention, or visibility changed.

## Containment

Restore unauthorized changes through reviewed infrastructure as code where possible. Preserve both the altered and intended configurations and verify that log delivery continues during remediation.

## Recovery and closure

Confirm expected logs are arriving at the intended destinations and no security or country-local telemetry gap remains. Follow `security-detection-response.md` for evidence and escalation requirements.
