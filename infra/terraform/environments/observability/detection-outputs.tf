output "security_detections" {
  description = "User-defined security metrics and associated alert policies."
  value = {
    metrics        = module.security_detections.metrics
    alert_policies = module.security_detections.alert_policies
  }
}
