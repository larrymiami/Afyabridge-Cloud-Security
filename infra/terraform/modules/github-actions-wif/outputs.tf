output "plan_pool_name" {
  description = "Full workload identity pool resource name dedicated to Terraform plan jobs."
  value       = google_iam_workload_identity_pool.plan.name
}

output "apply_pool_name" {
  description = "Full workload identity pool resource name dedicated to protected Terraform apply jobs."
  value       = google_iam_workload_identity_pool.apply.name
}

output "plan_provider_name" {
  description = "Full GitHub OIDC provider name for pull-request and manual plans."
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
