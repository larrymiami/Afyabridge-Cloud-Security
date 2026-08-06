output "artifact_repositories" {
  description = "Country-scoped Artifact Registry inventory."
  value = {
    for key, repository in module.artifact_repositories : key => {
      repository_id   = repository.repository_id
      repository_name = repository.repository_name
      repository_uri  = repository.repository_uri
      project_id      = var.artifact_repositories[key].project_id
      location        = var.artifact_repositories[key].location
      country         = var.artifact_repositories[key].country
      environment     = var.artifact_repositories[key].environment
    }
  }
}
