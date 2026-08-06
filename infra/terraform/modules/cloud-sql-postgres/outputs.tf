output "instance_name" {
  description = "Cloud SQL instance name."
  value       = google_sql_database_instance.this.name
}

output "connection_name" {
  description = "Cloud SQL connection name."
  value       = google_sql_database_instance.this.connection_name
}

output "private_ip_address" {
  description = "Private IP address assigned to the instance."
  value       = google_sql_database_instance.this.private_ip_address
}

output "self_link" {
  description = "Cloud SQL instance self-link."
  value       = google_sql_database_instance.this.self_link
}
