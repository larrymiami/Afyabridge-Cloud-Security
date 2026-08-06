output "secret_id" {
  description = "Secret identifier."
  value       = google_secret_manager_secret.this.secret_id
}

output "secret_name" {
  description = "Fully qualified secret resource name."
  value       = google_secret_manager_secret.this.name
}

output "replica_locations" {
  description = "Configured user-managed replica locations."
  value       = sort(keys(var.replicas))
}
