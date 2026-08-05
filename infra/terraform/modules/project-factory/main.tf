locals {
  required_labels = {
    managed_by          = "terraform"
    application         = "afyabridge"
    country             = var.country
    environment         = var.environment
    service             = var.service
    owner               = var.owner
    cost_center         = var.cost_center
    data_classification = var.data_classification
  }

  labels = merge(var.additional_labels, local.required_labels)
}

resource "google_project" "this" {
  project_id          = var.project_id
  name                = var.project_name
  folder_id           = var.folder_id
  billing_account     = var.billing_account_id
  labels              = local.labels
  auto_create_network = false
  deletion_policy     = var.deletion_policy

  lifecycle {
    precondition {
      condition     = var.environment != "prod" || var.deletion_policy == "PREVENT"
      error_message = "Production projects must use deletion_policy PREVENT."
    }

    precondition {
      condition     = var.country != "global" || var.environment == "shared"
      error_message = "Global projects are restricted to the shared environment."
    }
  }
}

resource "google_project_service" "enabled" {
  for_each = var.activate_apis

  project            = google_project.this.project_id
  service            = each.value
  disable_on_destroy = false
}
