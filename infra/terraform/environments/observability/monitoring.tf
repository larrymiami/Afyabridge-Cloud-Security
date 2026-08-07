locals {
  monitoring_channel_keys = toset(keys(var.monitoring_notification_channels))

  initial_alert_policies = length(local.monitoring_channel_keys) > 0 ? {
    cloud_run_server_errors = {
      display_name            = "Cloud Run server error rate"
      condition_display_name  = "Cloud Run 5xx responses exceed reviewed threshold"
      filter                  = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.label.response_code_class=\"5xx\""
      comparison              = "COMPARISON_GT"
      threshold_value         = 0.1
      duration                = "300s"
      alignment_period        = "300s"
      per_series_aligner      = "ALIGN_RATE"
      cross_series_reducer    = "REDUCE_SUM"
      group_by_fields         = ["resource.label.service_name", "resource.label.location"]
      notification_channels   = local.monitoring_channel_keys
      severity                = "high"
      owner                   = "platform-operations"
      runbook_url             = "${var.monitoring_runbook_base_url}/cloud-run-server-errors.md"
      documentation           = "Cloud Run revisions are producing sustained HTTP 5xx responses. Confirm whether the signal is isolated to a country, service, revision, or dependency before rollback or containment."
      auto_close              = "604800s"
      notification_rate_limit = "300s"
      enabled                 = var.monitoring_alerts_enabled
    }

    cloud_sql_cpu_utilization = {
      display_name            = "Cloud SQL sustained CPU utilization"
      condition_display_name  = "Cloud SQL CPU utilization exceeds 80 percent"
      filter                  = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\""
      comparison              = "COMPARISON_GT"
      threshold_value         = 0.8
      duration                = "600s"
      alignment_period        = "300s"
      per_series_aligner      = "ALIGN_MEAN"
      cross_series_reducer    = "REDUCE_MAX"
      group_by_fields         = ["resource.label.database_id", "resource.label.region"]
      notification_channels   = local.monitoring_channel_keys
      severity                = "high"
      owner                   = "database-operations"
      runbook_url             = "${var.monitoring_runbook_base_url}/cloud-sql-resource-pressure.md"
      documentation           = "A Cloud SQL instance has sustained high CPU utilization. Review active connections, slow queries, maintenance events, country impact, and recent deployments before scaling or changing database settings."
      auto_close              = "604800s"
      notification_rate_limit = "600s"
      enabled                 = var.monitoring_alerts_enabled
    }

    logging_export_errors = {
      display_name            = "Cloud Logging export errors"
      condition_display_name  = "Centralized log export errors detected"
      filter                  = "resource.type=\"logging_sink\" AND metric.type=\"logging.googleapis.com/exports/error_count\""
      comparison              = "COMPARISON_GT"
      threshold_value         = 0
      duration                = "300s"
      alignment_period        = "300s"
      per_series_aligner      = "ALIGN_DELTA"
      cross_series_reducer    = "REDUCE_SUM"
      group_by_fields         = ["resource.label.destination"]
      notification_channels   = local.monitoring_channel_keys
      severity                = "critical"
      owner                   = "security-operations"
      runbook_url             = "${var.monitoring_runbook_base_url}/logging-pipeline-failure.md"
      documentation           = "Cloud Logging reports export failures. Verify sink status, destination permissions, bucket availability, quotas, and whether security or country-local telemetry is being lost."
      auto_close              = "604800s"
      notification_rate_limit = "300s"
      enabled                 = var.monitoring_alerts_enabled
    }
  } : {}
}

module "cloud_monitoring" {
  source = "../../modules/cloud-monitoring"

  project_id            = var.logging_project_id
  notification_channels = var.monitoring_notification_channels
  alert_policies        = local.initial_alert_policies
}
