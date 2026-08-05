output "project_id" {
  description = "Created Google Cloud project ID."
  value       = google_project.this.project_id
}

output "project_number" {
  description = "Created Google Cloud project number."
  value       = google_project.this.number
}

output "labels" {
  description = "Effective project labels."
  value       = google_project.this.labels
}

output "enabled_apis" {
  description = "APIs managed by this module."
  value       = sort(tolist(var.activate_apis))
}
