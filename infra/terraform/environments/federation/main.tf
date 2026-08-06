module "github_actions_federation" {
  source = "../../modules/github-actions-wif"

  project_id                 = var.project_id
  github_repository          = "larrymiami/Afyabridge-Cloud-Security"
  github_repository_id       = "1310793524"
  github_repository_owner_id = "97871935"
  plan_base_ref              = "refs/heads/main"
  apply_ref                  = "refs/heads/main"
  apply_environment          = var.apply_environment
  plan_project_roles         = var.plan_project_roles
  apply_project_roles        = var.apply_project_roles
}
