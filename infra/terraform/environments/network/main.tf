module "country_networks" {
  for_each = var.country_networks

  source = "../../modules/shared-vpc"

  host_project_id     = each.value.host_project_id
  network_name        = each.value.network_name
  subnets             = each.value.subnets
  service_project_ids = each.value.service_project_ids
  router_name         = each.value.router_name
  router_region       = each.value.router_region
  nat_name            = each.value.nat_name

  labels = {
    country     = each.key
    environment = "shared-network"
    managed_by  = "terraform"
    service     = "networking"
  }
}
