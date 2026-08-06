resource "google_monitoring_notification_channel" "this" {
  for_each = var.notification_channels

  project      = var.project_id
  display_name = each.value.display_name
  type         = each.value.type
  labels       = each.value.labels
  enabled      = each.value.enabled
  description  = each.value.description

  deletion_policy = "PREVENT"
}

resource "google_monitoring_alert_policy" "this" {
  for_each = var.alert_policies

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
      ${each.value.documentation}

      Owner: ${each.value.owner}
      Severity: ${upper(each.value.severity)}
      Runbook: ${each.value.runbook_url}
    EOT
    mime_type = "text/markdown"
  }

  conditions {
    display_name = each.value.condition_display_name

    condition_threshold {
      filter          = each.value.filter
      comparison      = each.value.comparison
      threshold_value = each.value.threshold_value
      duration        = each.value.duration

      aggregations {
        alignment_period     = each.value.alignment_period
        per_series_aligner   = each.value.per_series_aligner
        cross_series_reducer = each.value.cross_series_reducer
        group_by_fields      = each.value.group_by_fields
      }
    }
  }

  notification_channels = [
    for channel_key in sort(tolist(each.value.notification_channels)) :
    google_monitoring_notification_channel.this[channel_key].name
  ]

  alert_strategy {
    auto_close = each.value.auto_close

    notification_rate_limit {
      period = each.value.notification_rate_limit
    }
  }
}
