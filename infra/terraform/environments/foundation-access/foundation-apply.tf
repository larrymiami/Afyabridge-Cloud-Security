variable "foundation_apply_enabled" {
  description = "Stage the dedicated foundation apply identity and federation resources."
  type        = bool
  default     = false
}

variable "foundation_apply_provider_enabled" {
  description = "Enable token exchange after reviewing the staged identity and GitHub environment."
  type        = bool
  default     = false
}

resource "google_service_account" "apply" {
  count = var.foundation_apply_enabled ? 1 : 0

  project      = var.project_id
  account_id   = "terraform-foundation-apply"
  display_name = "Foundation hierarchy apply"
  description  = "Dedicated identity for the reviewed foundation apply workflow."

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool" "apply" {
  count = var.foundation_apply_enabled ? 1 : 0

  project                   = var.project_id
  workload_identity_pool_id = "github-foundation-apply"
  display_name              = "Foundation apply"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool_provider" "apply" {
  count = var.foundation_apply_enabled ? 1 : 0

  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.apply[0].workload_identity_pool_id
  workload_identity_pool_provider_id = "github"
  display_name                       = "Reviewed main foundation apply"
  disabled                           = !var.foundation_apply_provider_enabled

  attribute_mapping = {
    "google.subject"          = "assertion.sub"
    "attribute.repository_id" = "assertion.repository_id"
  }

  attribute_condition = <<-EOT
    assertion.repository_owner_id == "97871935" &&
    assertion.repository_id == "1310793524" &&
    assertion.repository == "larrymiami/Afyabridge-Cloud-Security" &&
    assertion.workflow_ref == "larrymiami/Afyabridge-Cloud-Security/.github/workflows/terraform-foundation-apply.yml@refs/heads/main" &&
    assertion.ref == "refs/heads/main" &&
    assertion.ref_type == "branch" &&
    assertion.event_name == "workflow_dispatch" &&
    assertion.environment == "foundation-apply"
  EOT

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account_iam_member" "federation" {
  count = var.foundation_apply_enabled ? 1 : 0

  service_account_id = google_service_account.apply[0].name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.apply[0].name}/attribute.repository_id/1310793524"
}

resource "google_project_iam_member" "foundation_apply_quota_consumer" {
  count = var.foundation_apply_enabled ? 1 : 0

  project = var.project_id
  role    = "roles/serviceusage.serviceUsageConsumer"
  member  = google_service_account.apply[0].member
}

output "foundation_apply" {
  description = "Dedicated workflow identity and its current federation status."
  value = var.foundation_apply_enabled ? {
    provider_name         = google_iam_workload_identity_pool_provider.apply[0].name
    provider_disabled     = google_iam_workload_identity_pool_provider.apply[0].disabled
    service_account_email = google_service_account.apply[0].email
  } : null
}
