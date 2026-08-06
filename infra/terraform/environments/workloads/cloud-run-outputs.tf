output "cloud_run_services" {
  description = "Country-scoped Cloud Run service inventory."
  value = {
    for key, service in module.cloud_run_services : key => {
      service_name                  = service.service_name
      service_uri                   = service.service_uri
      runtime_service_account_email = service.runtime_service_account_email
      project_id                    = var.cloud_run_services[key].project_id
      location                      = service.location
      country                       = var.cloud_run_services[key].country
      environment                   = var.cloud_run_services[key].environment
    }
  }
}
