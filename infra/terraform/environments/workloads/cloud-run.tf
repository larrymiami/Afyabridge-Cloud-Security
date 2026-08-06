module "cloud_run_services" {
  for_each = var.cloud_run_services

  source = "../../modules/cloud-run-service"

  project_id                           = each.value.project_id
  location                             = each.value.location
  service_name                         = each.value.service_name
  runtime_service_account_id           = each.value.runtime_service_account_id
  runtime_service_account_display_name = each.value.runtime_service_account_display_name
  image                                = each.value.image
  container_port                       = each.value.container_port
  ingress                              = each.value.ingress
  vpc_connector                        = each.value.vpc_connector
  vpc_egress                           = each.value.vpc_egress
  environment_variables                = each.value.environment_variables
  secret_environment_variables         = each.value.secret_environment_variables
  cpu                                  = each.value.cpu
  memory                               = each.value.memory
  min_instance_count                   = each.value.min_instance_count
  max_instance_count                   = each.value.max_instance_count
  timeout                              = each.value.timeout
  invoker_members                      = each.value.invoker_members
  runtime_project_roles                = each.value.runtime_project_roles
  deletion_protection                  = each.value.deletion_protection

  labels = {
    country     = each.value.country
    environment = each.value.environment
    managed_by  = "terraform"
    service     = "cloud-run"
  }
}
