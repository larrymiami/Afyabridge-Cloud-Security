# Centralized observability

## Status

Implemented and statically validated. No v0.7F logging, monitoring, alerting, or detection resource has been applied to a live Google Cloud environment.

## Purpose

v0.7F adds an observable security-control layer to the multi-country Google Cloud design. It provides centralized administrative and security telemetry, country-local operational routing, reusable monitoring primitives, and a first detection catalogue without weakening country isolation.

## Logging architecture

The observability root creates a shared security log bucket and country-scoped operational log buckets for Kenya, Ghana, and South Africa. Organization-level sinks are aggregated and non-intercepting, so matching records can be copied to reviewed destinations without suppressing child-project routing.

Country operational sinks are constrained to the configured project IDs for their country boundary. A project ID cannot be assigned to more than one country boundary. This keeps country operational telemetry local while allowing a reviewed subset of administrative and security audit data to be centralized.

The shared security bucket receives Admin Activity, System Event, Policy Denied, and selected Data Access audit records for IAM, IAM Credentials, Security Token Service, Secret Manager, Cloud KMS, Cloud Storage, Cloud SQL, Artifact Registry, Cloud Run, and Cloud Logging.

## Retention and deletion controls

Retention is configurable independently for security and country operational buckets. Terraform prevents accidental destruction of managed logging buckets, and organization sinks use a deletion-prevention policy.

The security bucket can be retention-locked, but the default remains unlocked because a retention lock is an operational and legal decision that should only be made after privacy, cost, recovery, and records-management review.

No active log-sampling exclusion is enabled. A disabled example exclusion exists only to make future sampling changes explicit and reviewable.

## Monitoring architecture

The Cloud Monitoring module manages reviewed notification channels and threshold alert policies. Policies carry severity and owner labels and embed an HTTPS runbook URL in their documentation.

The initial operational policies cover Cloud Run server errors, sustained Cloud SQL CPU pressure, and Cloud Logging export failures. They remain disabled unless monitoring is deliberately enabled after target metrics, thresholds, notification destinations, and responder ownership are reviewed.

## Security detections

The detection module creates project-scoped log-based counter metrics and Cloud Monitoring alert policies. The initial catalogue covers service-account key creation or upload, primitive-role grants, public IAM grants, logging configuration changes, Cloud KMS changes, and repeated Secret Manager access denials.

Detection policies are disabled by default. Static validation confirms Terraform syntax and provider-schema compatibility only; it does not prove that filters match real audit events, that metrics increment, that alerts open, or that notification channels deliver.

## Data-residency boundary

The configuration intentionally does not hard-code log-bucket locations. Locations must be selected after residency, service-availability, KMS-location, and privacy review. Country operational data must not be routed into a shared location simply for convenience.

Central security routing should remain limited to security-relevant audit records that have an approved cross-country handling basis. Application payloads and country-sensitive operational logs are outside the shared security route by default.

## Deployment order

The logging destination project and required APIs must exist before the observability stack is applied. The stack then creates destination buckets, organization sinks, sink-writer permissions, notification channels, monitoring policies, log-based metrics, and detection policies.

Because organization sinks generate writer identities, the apply identity needs the organization-level Logging permissions required to create sinks plus sufficient project IAM authority to grant each sink writer `roles/logging.bucketWriter` on the destination project.

## Validation boundary

The reviewed branch passed the Terraform foundation workflow, including recursive formatting, backend-free initialization, and `terraform validate` for the observability root. This does not establish runtime control effectiveness.

Live validation must demonstrate at minimum: log delivery into the intended bucket, absence of unintended cross-country routing, sink-writer authorization, retention behavior, notification-channel delivery, operational alert triggering and recovery, detection metric increments, alert creation, and responder receipt.
