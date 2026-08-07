output "frontend_address" {
  description = "Reserved regional public IPv4 address for the HTTPS frontend."
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
  description = "Regional HTTPS URL map ID."
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

output "public_https" {
  description = "Country public DNS, certificate, TLS policy, and frontend inventory."
  value = {
    hostname                    = var.hostname
    dns_zone_name               = google_dns_managed_zone.public.name
    dns_zone_dns_name           = google_dns_managed_zone.public.dns_name
    certificate_id              = google_certificate_manager_certificate.https.id
    certificate_dns_auth_id     = google_certificate_manager_dns_authorization.https.id
    tls_policy_id               = google_compute_region_ssl_policy.https.id
    https_target_proxy_id       = google_compute_region_target_https_proxy.https.id
    https_forwarding_rule_id    = google_compute_forwarding_rule.https.id
    http_redirect_target_id     = google_compute_region_target_http_proxy.http_redirect.id
    http_redirect_forwarding_id = google_compute_forwarding_rule.http_redirect.id
  }
}
