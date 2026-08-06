output "github_federation" {
  description = "GitHub Actions workload identity pools, providers, and deployment service-account identifiers."
  value = {
    plan_pool_name             = module.github_actions_federation.plan_pool_name
    apply_pool_name            = module.github_actions_federation.apply_pool_name
    plan_provider_name         = module.github_actions_federation.plan_provider_name
    apply_provider_name        = module.github_actions_federation.apply_provider_name
    plan_service_account_email = module.github_actions_federation.plan_service_account_email
    apply_service_account_email = module.github_actions_federation.apply_service_account_email
    project_number             = module.github_actions_federation.project_number
  }
}
