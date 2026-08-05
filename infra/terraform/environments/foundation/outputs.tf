output "folder_hierarchy" {
  description = "Managed shared, country, and environment folder IDs."
  value = {
    shared       = module.resource_hierarchy.shared_folder_id
    countries    = module.resource_hierarchy.country_folder_ids
    environments = module.resource_hierarchy.environment_folder_ids
  }
}

output "projects" {
  description = "Created project IDs and numbers keyed by logical project name."
  value = {
    for key, project in module.projects : key => {
      project_id     = project.project_id
      project_number = project.project_number
      enabled_apis   = project.enabled_apis
    }
  }
}

output "country_project_ids" {
  description = "Project IDs grouped by country boundary."
  value = {
    for country in ["ke", "gh", "za", "global"] : country => [
      for key, project in var.projects : module.projects[key].project_id
      if project.country == country
    ]
  }
}

output "control_inventory" {
  description = "Logical inventory of composed policy, IAM, and budget controls."
  value = {
    policy_scopes     = sort(keys(local.policy_parents))
    iam_projects      = sort(keys(module.project_iam))
    budgeted_projects = sort(keys(module.project_budgets))
  }
}
