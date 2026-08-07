output "frontend_address" {
  description = "Reserved regional public IPv4 address for the future HTTPS frontend."
  value       = google_compute_address.frontend.address
}

output "proxy_only_subnet_id" {
  description = "Country Shared VPC proxy-only subnet used by the regional external Application Load Balancer."
  value       = google_compute_subnetwork.proxy_only.id
}

output "serverless_neg_id" {
  description = "Regional serverless NEG targeting the existing Cloud Run service."
  value       = google_compute_region_network_endpoint_group.cloud_run.id
}

output "backend_service_id" {
  description = "Regional external managed backend service ID."
  value       = google_compute_region_backend_service.cloud_run.id
}

output "url_map_id" {
  description = "Regional URL map ID for the future HTTPS target proxy."
  value       = google_compute_region_url_map.https.id
}

output "cloud_armor_policy" {
  description = "Regional Cloud Armor policy and rollout state."
  value = {
    id          = google_compute_region_security_policy.edge.id
    name        = google_compute_region_security_policy.edge.name
    preview     = var.cloud_armor_preview
    sensitivity = var.cloud_armor_waf_sensitivity
    waf_rules   = sort(keys(local.cloud_armor_waf_rules))
    rate_limit = {
      count            = var.cloud_armor_rate_limit_count
      interval_seconds = var.cloud_armor_rate_limit_interval_seconds
      key              = "IP"
    }
  }
}
