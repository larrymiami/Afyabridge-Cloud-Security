output "service_name" {
  description = "Cloud Run service name."
  value       = google_cloud_run_v2_service.this.name
}

output "service_uri" {
  description = "Cloud Run service URI."
  value       = google_cloud_run_v2_service.this.uri
}

output "runtime_service_account_email" {
  description = "Dedicated runtime service account email."
  value       = google_service_account.runtime.email
}

output "location" {
  description = "Cloud Run service location."
  value       = google_cloud_run_v2_service.this.location
}
