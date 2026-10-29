module "github_actions_federation" {
  source = "../../modules/github-actions-wif"

  project_id                 = var.project_id
  github_repository          = "larrymiami/Afyabridge-Cloud-Security"
  github_repository_id       = "1310793524"
  github_repository_owner_id = "97871935"
  plan_workflow_path         = ".github/workflows/terraform-federation-plan.yml"
  apply_workflow_path        = ".github/workflows/terraform-federation-apply.yml"
  plan_base_ref              = "main"
  apply_ref                  = "refs/heads/main"
  apply_environment          = var.apply_environment
  plan_project_roles         = var.plan_project_roles
  apply_project_roles        = var.apply_project_roles
}

# Opt-in bootstrap extension. Null by default so the existing federation stack
# and its trust boundaries remain unchanged until a separate reviewed plan.
module "foundation_plan" {
  count  = var.foundation_plan == null ? 0 : 1
  source = "../../modules/foundation-plan-wif"

  project_id       = var.project_id
  organization_id  = var.foundation_plan.organization_id
  state_bucket     = var.foundation_plan.state_bucket
  provider_enabled = var.foundation_plan.provider_enabled
}
