output "monitoring_controls" {
  description = "Cloud Monitoring notification channel and alert-policy inventory."
  value = {
    notification_channels = module.cloud_monitoring.notification_channels
    alert_policies        = module.cloud_monitoring.alert_policies
    alerts_enabled        = var.monitoring_alerts_enabled
  }
}
