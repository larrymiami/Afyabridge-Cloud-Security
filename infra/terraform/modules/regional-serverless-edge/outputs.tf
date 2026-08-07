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
