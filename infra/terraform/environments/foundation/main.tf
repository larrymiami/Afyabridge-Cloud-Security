locals {
  folder_by_scope = {
    global-shared = var.folders.shared
    ke-dev        = var.folders.ke.dev
    ke-stg        = var.folders.ke.stg
    ke-prod       = var.folders.ke.prod
    gh-dev        = var.folders.gh.dev
    gh-stg        = var.folders.gh.stg
    gh-prod       = var.folders.gh.prod
    za-dev        = var.folders.za.dev
    za-stg        = var.folders.za.stg
    za-prod       = var.folders.za.prod
  }
}

module "projects" {
  for_each = var.projects

  source = "../../modules/project-factory"

  project_id          = each.value.project_id
  project_name        = each.value.project_name
  folder_id           = local.folder_by_scope["${each.value.country}-${each.value.environment}"]
  billing_account_id  = var.billing_account_id
  country             = each.value.country
  environment         = each.value.environment
  service             = each.value.service
  owner               = each.value.owner
  cost_center         = each.value.cost_center
  data_classification = each.value.data_classification
  activate_apis       = each.value.activate_apis
  deletion_policy     = "PREVENT"
}
