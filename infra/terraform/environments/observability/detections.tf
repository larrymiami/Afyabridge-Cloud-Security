locals {
  detection_notification_channel_names = toset([
    for channel in values(module.cloud_monitoring.notification_channels) : channel.name
  ])

  initial_security_detections = {
    service_account_key_created = {
      metric_name            = "security_service_account_key_created"
      description            = "Detects creation or upload of a user-managed service-account key. AfyaBridge deployment identities must use Workload Identity Federation instead of long-lived keys."
      filter                 = "LOG_ID(\"cloudaudit.googleapis.com/activity\") AND protoPayload.serviceName=\"iam.googleapis.com\" AND protoPayload.methodName=(\"google.iam.admin.v1.CreateServiceAccountKey\" OR \"google.iam.admin.v1.UploadServiceAccountKey\")"
      display_name           = "Service-account key created or uploaded"
      condition_display_name = "At least one user-managed service-account key event"
      severity               = "critical"
      owner                  = "security-operations"
      runbook_url            = "${var.monitoring_runbook_base_url}/service-account-key-created.md"
      enabled                = var.monitoring_alerts_enabled
    }

    primitive_role_granted = {
      metric_name            = "security_primitive_role_granted"
      description            = "Detects IAM policy changes whose request contains Owner or Editor. Review the complete policy delta and affected resource before containment."
      filter                 = "LOG_ID(\"cloudaudit.googleapis.com/activity\") AND protoPayload.methodName:\"SetIamPolicy\" AND (protoPayload.request.policy.bindings.role=\"roles/owner\" OR protoPayload.request.policy.bindings.role=\"roles/editor\")"
      display_name           = "Primitive IAM role granted"
      condition_display_name = "Owner or Editor appears in an IAM policy change"
      severity               = "critical"
      owner                  = "security-operations"
      runbook_url            = "${var.monitoring_runbook_base_url}/primitive-role-granted.md"
      enabled                = var.monitoring_alerts_enabled
    }

    public_access_granted = {
      metric_name            = "security_public_access_granted"
      description            = "Detects IAM policy changes that grant a role to allUsers or allAuthenticatedUsers. Confirm the target resource and whether public access was explicitly approved."
      filter                 = "LOG_ID(\"cloudaudit.googleapis.com/activity\") AND protoPayload.methodName:\"SetIamPolicy\" AND (protoPayload.request.policy.bindings.members:\"allUsers\" OR protoPayload.request.policy.bindings.members:\"allAuthenticatedUsers\")"
      display_name           = "Public IAM access granted"
      condition_display_name = "Public principal appears in an IAM policy change"
      severity               = "critical"
      owner                  = "security-operations"
      runbook_url            = "${var.monitoring_runbook_base_url}/public-access-granted.md"
      enabled                = var.monitoring_alerts_enabled
    }

    logging_configuration_changed = {
      metric_name            = "security_logging_configuration_changed"
      description            = "Detects creation, update, or deletion of log sinks, exclusions, buckets, views, metrics, or project logging settings."
      filter                 = "LOG_ID(\"cloudaudit.googleapis.com/activity\") AND protoPayload.serviceName=\"logging.googleapis.com\" AND protoPayload.methodName=(\"google.logging.v2.ConfigServiceV2.CreateSink\" OR \"google.logging.v2.ConfigServiceV2.UpdateSink\" OR \"google.logging.v2.ConfigServiceV2.DeleteSink\" OR \"google.logging.v2.ConfigServiceV2.CreateExclusion\" OR \"google.logging.v2.ConfigServiceV2.UpdateExclusion\" OR \"google.logging.v2.ConfigServiceV2.DeleteExclusion\" OR \"google.logging.v2.ConfigServiceV2.UpdateBucket\" OR \"google.logging.v2.ConfigServiceV2.DeleteBucket\" OR \"google.logging.v2.MetricsServiceV2.CreateLogMetric\" OR \"google.logging.v2.MetricsServiceV2.UpdateLogMetric\" OR \"google.logging.v2.MetricsServiceV2.DeleteLogMetric\")"
      display_name           = "Cloud Logging configuration changed"
      condition_display_name = "Security-relevant logging configuration mutation"
      severity               = "high"
      owner                  = "security-operations"
      runbook_url            = "${var.monitoring_runbook_base_url}/logging-configuration-changed.md"
      enabled                = var.monitoring_alerts_enabled
    }

    kms_key_state_changed = {
      metric_name            = "security_kms_key_state_changed"
      description            = "Detects disablement, destruction scheduling, restoration, or IAM changes affecting Cloud KMS keys."
      filter                 = "LOG_ID(\"cloudaudit.googleapis.com/activity\") AND protoPayload.serviceName=\"cloudkms.googleapis.com\" AND (protoPayload.methodName:\"UpdateCryptoKeyPrimaryVersion\" OR protoPayload.methodName:\"UpdateCryptoKeyVersion\" OR protoPayload.methodName:\"DestroyCryptoKeyVersion\" OR protoPayload.methodName:\"RestoreCryptoKeyVersion\" OR protoPayload.methodName:\"SetIamPolicy\")"
      display_name           = "Cloud KMS key state or access changed"
      condition_display_name = "Security-relevant Cloud KMS mutation"
      severity               = "critical"
      owner                  = "security-operations"
      runbook_url            = "${var.monitoring_runbook_base_url}/kms-key-state-changed.md"
      enabled                = var.monitoring_alerts_enabled
    }

    secret_access_denied = {
      metric_name             = "security_secret_access_denied"
      description             = "Detects denied Secret Manager operations. Repeated events can indicate compromised credentials, incorrect workload identity, or attempted cross-boundary access."
      filter                  = "LOG_ID(\"cloudaudit.googleapis.com/policy\") AND protoPayload.serviceName=\"secretmanager.googleapis.com\" AND protoPayload.status.code!=0"
      display_name            = "Secret Manager access denied"
      condition_display_name  = "Denied Secret Manager operation detected"
      severity                = "high"
      owner                   = "security-operations"
      runbook_url             = "${var.monitoring_runbook_base_url}/secret-access-denied.md"
      threshold_value         = 4
      duration                = "0s"
      alignment_period        = "300s"
      notification_rate_limit = "600s"
      enabled                 = var.monitoring_alerts_enabled
    }
  }
}

module "security_detections" {
  source = "../../modules/security-detections"

  project_id                 = var.logging_project_id
  notification_channel_names = local.detection_notification_channel_names
  detections                 = local.initial_security_detections
}
