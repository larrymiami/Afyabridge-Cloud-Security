data "google_project" "host" {
  project_id = var.project_id
}

resource "google_iam_workload_identity_pool" "plan" {
  project                   = var.project_id
  workload_identity_pool_id = var.plan_pool_id
  display_name              = "GitHub Terraform plan"
  description               = "Short-lived GitHub Actions identities dedicated to Terraform planning."

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool" "apply" {
  project                   = var.project_id
  workload_identity_pool_id = var.apply_pool_id
  display_name              = "GitHub Terraform apply"
  description               = "Short-lived GitHub Actions identities dedicated to protected Terraform applies."

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_iam_workload_identity_pool_provider" "plan" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.plan.workload_identity_pool_id
  workload_identity_pool_provider_id = var.plan_provider_id
  display_name                       = "GitHub Terraform plan"
  description                        = "Accepts trusted plans from the exact plan workflow plus manual main-branch pre-apply planning from the exact apply workflow."
  disabled                           = var.disabled

  attribute_mapping = {
    "google.subject"                = "assertion.sub"
    "attribute.actor_id"            = "assertion.actor_id"
    "attribute.base_ref"            = "assertion.base_ref"
    "attribute.deployment_role"     = "\"plan\""
    "attribute.event_name"          = "assertion.event_name"
    "attribute.ref"                 = "assertion.ref"
    "attribute.repository"          = "assertion.repository"
    "attribute.repository_id"       = "assertion.repository_id"
    "attribute.repository_owner_id" = "assertion.repository_owner_id"
    "attribute.workflow_ref"        = "assertion.workflow_ref"
  }

  attribute_condition = <<-EOT
    assertion.repository_owner_id == "${var.github_repository_owner_id}" &&
    assertion.repository_id == "${var.github_repository_id}" &&
    assertion.repository == "${var.github_repository}" &&
    (
      (
        assertion.workflow_ref.startsWith("${var.github_repository}/${var.plan_workflow_path}@") &&
        (
          (assertion.event_name == "pull_request" && assertion.base_ref == "${var.plan_base_ref}") ||
          (assertion.event_name == "workflow_dispatch" && assertion.ref == "${var.apply_ref}" && assertion.ref_type == "branch")
        )
      ) ||
      (
        assertion.workflow_ref.startsWith("${var.github_repository}/${var.apply_workflow_path}@") &&
        assertion.event_name == "workflow_dispatch" &&
        assertion.ref == "${var.apply_ref}" &&
        assertion.ref_type == "branch"
      )
    )
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
  workload_identity_pool_id          = google_iam_workload_identity_pool.apply.workload_identity_pool_id
  workload_identity_pool_provider_id = var.apply_provider_id
  display_name                       = "GitHub Terraform apply"
  description                        = "Accepts protected-environment tokens from the immutable AfyaBridge repository identity, exact apply workflow, and main branch."
  disabled                           = var.disabled

  attribute_mapping = {
    "google.subject"                = "assertion.sub"
    "attribute.actor_id"            = "assertion.actor_id"
    "attribute.deployment_role"     = "\"apply\""
    "attribute.environment"         = "assertion.environment"
    "attribute.event_name"          = "assertion.event_name"
    "attribute.ref"                 = "assertion.ref"
    "attribute.repository"          = "assertion.repository"
    "attribute.repository_id"       = "assertion.repository_id"
    "attribute.repository_owner_id" = "assertion.repository_owner_id"
    "attribute.workflow_ref"        = "assertion.workflow_ref"
  }

  attribute_condition = <<-EOT
    assertion.repository_owner_id == "${var.github_repository_owner_id}" &&
    assertion.repository_id == "${var.github_repository_id}" &&
    assertion.repository == "${var.github_repository}" &&
    assertion.workflow_ref.startsWith("${var.github_repository}/${var.apply_workflow_path}@") &&
    assertion.ref == "${var.apply_ref}" &&
    assertion.ref_type == "branch" &&
    assertion.environment == "${var.apply_environment}" &&
    assertion.event_name == "workflow_dispatch"
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
  description  = "Read-oriented identity impersonated only by trusted GitHub plan jobs."

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
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.plan.name}/attribute.deployment_role/plan"
}

resource "google_service_account_iam_member" "apply_federation" {
  service_account_id = google_service_account.apply.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.apply.name}/attribute.deployment_role/apply"
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
