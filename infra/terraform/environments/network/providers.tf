provider "google" {
  project               = var.quota_project_id
  region                = var.default_region
  user_project_override = true
  billing_project       = var.quota_project_id
}
