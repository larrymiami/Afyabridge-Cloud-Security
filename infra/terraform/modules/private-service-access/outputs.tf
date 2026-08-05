output "allocated_range_name" {
  description = "Allocated private service access range name."
  value       = google_compute_global_address.this.name
}

output "connection_id" {
  description = "Service Networking connection identifier."
  value       = google_service_networking_connection.this.id
}
