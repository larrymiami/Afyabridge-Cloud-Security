output "metrics" {
  description = "Created user-defined log-based metrics."
  value = {
    for key, metric in google_logging_metric.this : key => {
      id   = metric.id
      name = metric.name
    }
  }
}

output "alert_policies" {
  description = "Created detection alert policies."
  value = {
    for key, policy in google_monitoring_alert_policy.this : key => {
      name         = policy.name
      display_name = policy.display_name
      enabled      = policy.enabled
      severity     = policy.user_labels.severity
      owner        = policy.user_labels.owner
    }
  }
}
