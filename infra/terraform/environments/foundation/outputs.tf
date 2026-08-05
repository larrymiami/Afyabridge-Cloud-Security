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
