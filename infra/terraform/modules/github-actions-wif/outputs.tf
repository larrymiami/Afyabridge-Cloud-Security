output "workload_identity_pool_name" {
  description = "Full workload identity pool resource name."
  value       = google_iam_workload_identity_pool.github.name
}

output "plan_provider_name" {
  description = "Full GitHub OIDC provider name for pull-request plans."
  value       = google_iam_workload_identity_pool_provider.plan.name
}

output "apply_provider_name" {
  description = "Full GitHub OIDC provider name for protected applies."
  value       = google_iam_workload_identity_pool_provider.apply.name
}

output "plan_service_account_email" {
  description = "Terraform plan service-account email."
  value       = google_service_account.plan.email
}

output "apply_service_account_email" {
  description = "Terraform apply service-account email."
  value       = google_service_account.apply.email
}

output "project_number" {
  description = "Numeric project identifier used by workload identity provider resource names."
  value       = data.google_project.host.number
}
