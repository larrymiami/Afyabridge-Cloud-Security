data "google_project" "host" {
  project_id = var.project_id
}

resource "google_service_account" "plan" {
  project      = var.project_id
  account_id   = "terraform-foundation-plan"
  display_name = "Foundation hierarchy plan"
  description  = "Read-oriented identity for reviewed manual foundation planning only."

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool" "plan" {
  project                   = var.project_id
  workload_identity_pool_id = "github-foundation-plan"
  display_name              = "Foundation plan"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool_provider" "plan" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.plan.workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "Reviewed main foundation plan"
  disabled                           = !var.provider_enabled

  attribute_mapping = {
    "google.subject"          = "assertion.sub"
    "attribute.repository_id" = "assertion.repository_id"
  }

  attribute_condition = <<-EOT
    assertion.repository_owner_id == "97871935" &&
    assertion.repository_id == "1310793524" &&
    assertion.repository == "larrymiami/Afyabridge-Cloud-Security" &&
    assertion.workflow_ref == "larrymiami/Afyabridge-Cloud-Security/.github/workflows/terraform-foundation-plan.yml@refs/heads/main" &&
    assertion.ref == "refs/heads/main" &&
    assertion.ref_type == "branch" &&
    assertion.event_name == "workflow_dispatch" &&
    assertion.environment == "foundation-plan"
  EOT

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account_iam_member" "federation" {
  service_account_id = google_service_account.plan.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.plan.name}/attribute.repository_id/1310793524"
}

# Read the organization hierarchy and its policies; no folder/project creation,
# policy mutation, IAM administration, or billing management is granted.
resource "google_organization_iam_member" "hierarchy_reader" {
  org_id = var.organization_id
  role   = "roles/resourcemanager.folderViewer"
  member = "serviceAccount:${google_service_account.plan.email}"
}

resource "google_project_iam_member" "quota_consumer" {
  project = var.project_id
  role    = "roles/serviceusage.serviceUsageConsumer"
  member  = "serviceAccount:${google_service_account.plan.email}"
}

resource "google_storage_bucket_iam_member" "bucket_reader" {
  bucket = var.state_bucket
  role   = "roles/storage.bucketViewer"
  member = "serviceAccount:${google_service_account.plan.email}"
}

resource "google_storage_bucket_iam_member" "state_reader" {
  bucket = var.state_bucket
  role   = "roles/storage.objectViewer"
  member = "serviceAccount:${google_service_account.plan.email}"

  condition {
    title       = "foundation_state_read_only"
    description = "Read foundation state content; bucket-level object metadata listing is required by the GCS backend."
    expression  = <<-EOT
      (resource.type == "storage.googleapis.com/Bucket" && resource.name == "projects/_/buckets/${var.state_bucket}") ||
      (resource.type == "storage.googleapis.com/Object" && resource.name.startsWith("projects/_/buckets/${var.state_bucket}/objects/foundation/project-factory/"))
    EOT
  }
}
