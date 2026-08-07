output "centralized_logging" {
  description = "Centralized log bucket and aggregated sink inventory."
  value = {
    buckets = module.centralized_logging.buckets
    sinks   = module.centralized_logging.sinks
  }
}

output "country_routing" {
  description = "Country project membership used to construct local operational-log routes."
  value = {
    for country, projects in var.country_project_ids : country => {
      project_ids = sort(tolist(projects))
      bucket_key  = country
    }
  }
}
