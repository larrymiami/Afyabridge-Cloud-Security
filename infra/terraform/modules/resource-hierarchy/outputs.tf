output "shared_folder_id" {
  description = "Shared-services folder ID."
  value       = google_folder.shared.folder_id
}

output "country_folder_ids" {
  description = "Country folder IDs keyed by country token."
  value       = { for key, folder in google_folder.country : key => folder.folder_id }
}

output "environment_folder_ids" {
  description = "Environment folder IDs keyed by country-environment scope."
  value       = { for key, folder in google_folder.environment : key => folder.folder_id }
}
