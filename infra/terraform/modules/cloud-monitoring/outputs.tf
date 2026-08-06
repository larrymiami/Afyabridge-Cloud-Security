output "notification_channels" {
  description = "Created Cloud Monitoring notification channels."
  value = {
    for key, channel in google_monitoring_notification_channel.this : key => {
      name         = channel.name
      display_name = channel.display_name
      type         = channel.type
      enabled      = channel.enabled
    }
  }
}

output "alert_policies" {
  description = "Created Cloud Monitoring alert policies."
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
