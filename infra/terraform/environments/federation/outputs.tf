output "github_federation" {
  description = "GitHub Actions workload identity provider and deployment service-account identifiers."
  value = {
    workload_identity_pool_name = module.github_actions_federation.workload_identity_pool_name
    plan_provider_name          = module.github_actions_federation.plan_provider_name
    apply_provider_name         = module.github_actions_federation.apply_provider_name
    plan_service_account_email  = module.github_actions_federation.plan_service_account_email
    apply_service_account_email = module.github_actions_federation.apply_service_account_email
    project_number              = module.github_actions_federation.project_number
  }
}
