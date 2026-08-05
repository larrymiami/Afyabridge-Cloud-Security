module "resource_hierarchy" {
  source = "../../modules/resource-hierarchy"

  organization_id = var.organization_id
  countries       = var.countries
}

locals {
  folder_by_scope = merge(
    {
      global-shared = module.resource_hierarchy.shared_folder_id
    },
    module.resource_hierarchy.environment_folder_ids,
  )

  policy_parents = merge(
    {
      global = "folders/${module.resource_hierarchy.shared_folder_id}"
    },
    {
      for country, folder_id in module.resource_hierarchy.country_folder_ids :
      country => "folders/${folder_id}"
    },
  )

  budgeted_projects = {
    for key, project in var.projects : key => project
    if project.monthly_budget_amount != null
  }
}

module "folder_policies" {
  for_each = local.policy_parents

  source = "../../modules/folder-policy"

  parent           = each.value
  boolean_policies = var.baseline_boolean_policies
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

  depends_on = [module.folder_policies]
}

module "project_iam" {
  for_each = {
    for key, project in var.projects : key => project
    if length(project.iam_bindings) > 0
  }

  source = "../../modules/project-iam"

  project_id = module.projects[each.key].project_id
  bindings   = each.value.iam_bindings
}

module "project_budgets" {
  for_each = local.budgeted_projects

  source = "../../modules/project-budget"

  billing_account_id    = var.billing_account_id
  project_number        = module.projects[each.key].project_number
  display_name          = "${each.value.project_name} monthly budget"
  currency_code         = each.value.budget_currency_code
  monthly_amount        = each.value.monthly_budget_amount
  notification_channels = var.budget_notification_channels
}
