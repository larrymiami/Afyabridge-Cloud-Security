data "google_project" "host" {
  project_id = var.project_id
}

resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = var.pool_id
  display_name              = "GitHub Actions"
  description               = "Short-lived GitHub Actions identities for Terraform plan and protected apply workflows."

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool_provider" "plan" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = var.plan_provider_id
  display_name                       = "GitHub Terraform plan"
  description                        = "Accepts pull-request tokens from the immutable AfyaBridge repository identity."
  disabled                           = var.disabled

  attribute_mapping = {
    "google.subject"                = "assertion.sub"
    "attribute.actor_id"            = "assertion.actor_id"
    "attribute.base_ref"            = "assertion.base_ref"
    "attribute.deployment_role"     = "\"plan\""
    "attribute.event_name"          = "assertion.event_name"
    "attribute.job_workflow_ref"    = "assertion.job_workflow_ref"
    "attribute.repository"          = "assertion.repository"
    "attribute.repository_id"       = "assertion.repository_id"
    "attribute.repository_owner_id" = "assertion.repository_owner_id"
  }

  attribute_condition = <<-EOT
    assertion.repository_owner_id == "${var.github_repository_owner_id}" &&
    assertion.repository_id == "${var.github_repository_id}" &&
    assertion.repository == "${var.github_repository}" &&
    assertion.event_name == "pull_request" &&
    assertion.base_ref == "${var.plan_base_ref}"
  EOT

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool_provider" "apply" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = var.apply_provider_id
  display_name                       = "GitHub Terraform apply"
  description                        = "Accepts protected-environment tokens from the immutable AfyaBridge repository identity and main branch."
  disabled                           = var.disabled

  attribute_mapping = {
    "google.subject"                = "assertion.sub"
    "attribute.actor_id"            = "assertion.actor_id"
    "attribute.deployment_role"     = "\"apply\""
    "attribute.environment"         = "assertion.environment"
    "attribute.event_name"          = "assertion.event_name"
    "attribute.job_workflow_ref"    = "assertion.job_workflow_ref"
    "attribute.ref"                 = "assertion.ref"
    "attribute.repository"          = "assertion.repository"
    "attribute.repository_id"       = "assertion.repository_id"
    "attribute.repository_owner_id" = "assertion.repository_owner_id"
  }

  attribute_condition = <<-EOT
    assertion.repository_owner_id == "${var.github_repository_owner_id}" &&
    assertion.repository_id == "${var.github_repository_id}" &&
    assertion.repository == "${var.github_repository}" &&
    assertion.ref == "${var.apply_ref}" &&
    assertion.ref_type == "branch" &&
    assertion.environment == "${var.apply_environment}" &&
    (assertion.event_name == "push" || assertion.event_name == "workflow_dispatch")
  EOT

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account" "plan" {
  project      = var.project_id
  account_id   = var.plan_service_account_id
  display_name = "Terraform plan"
  description  = "Read-oriented identity impersonated only by trusted GitHub pull-request plan jobs."

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account" "apply" {
  project      = var.project_id
  account_id   = var.apply_service_account_id
  display_name = "Terraform apply"
  description  = "Write-capable identity impersonated only by protected main-branch GitHub apply jobs."

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account_iam_member" "plan_federation" {
  service_account_id = google_service_account.plan.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.deployment_role/plan"
}

resource "google_service_account_iam_member" "apply_federation" {
  service_account_id = google_service_account.apply.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.deployment_role/apply"
}

resource "google_project_iam_member" "plan_roles" {
  for_each = var.plan_project_roles

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.plan.email}"
}

resource "google_project_iam_member" "apply_roles" {
  for_each = var.apply_project_roles

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.apply.email}"
}
