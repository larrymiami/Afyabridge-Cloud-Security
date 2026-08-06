resource "google_logging_metric" "this" {
  for_each = var.detections

  project     = var.project_id
  name        = each.value.metric_name
  description = each.value.description
  filter      = each.value.filter

  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "INT64"
    unit        = "1"
  }
}

resource "google_monitoring_alert_policy" "this" {
  for_each = var.detections

  project      = var.project_id
  display_name = each.value.display_name
  combiner     = "OR"
  enabled      = each.value.enabled

  user_labels = {
    severity = lower(each.value.severity)
    owner    = lower(replace(each.value.owner, " ", "_"))
  }

  documentation {
    content = <<-EOT
      ${each.value.description}

      Owner: ${each.value.owner}
      Severity: ${upper(each.value.severity)}
      Runbook: ${each.value.runbook_url}
    EOT
    mime_type = "text/markdown"
  }

  conditions {
    display_name = each.value.condition_display_name

    condition_threshold {
      filter = "resource.type=\"global\" AND metric.type=\"logging.googleapis.com/user/${google_logging_metric.this[each.key].name}\""

      comparison      = "COMPARISON_GT"
      threshold_value = each.value.threshold_value
      duration        = each.value.duration

      aggregations {
        alignment_period     = each.value.alignment_period
        per_series_aligner   = "ALIGN_SUM"
        cross_series_reducer = "REDUCE_SUM"
      }

      evaluation_missing_data = "EVALUATION_MISSING_DATA_NO_OP"
    }
  }

  notification_channels = sort(tolist(var.notification_channel_names))

  alert_strategy {
    auto_close = each.value.auto_close

    notification_rate_limit {
      period = each.value.notification_rate_limit
    }
  }
}
