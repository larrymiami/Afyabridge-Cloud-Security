locals {
  country_subnet_cidrs = {
    for country, network in var.country_networks : country => toset([
      for subnet in values(network.subnets) : subnet.ip_cidr_range
    ])
  }
}

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

module "country_firewalls" {
  for_each = var.country_networks

  source = "../../modules/network-firewall"

  project_id   = each.value.host_project_id
  network_name = module.country_networks[each.key].network_name

  rules = {
    allow-country-internal = {
      name          = "${each.value.network_name}-allow-country-internal"
      description   = "Allow east-west traffic only within the country network allocation."
      direction     = "INGRESS"
      priority      = 1000
      source_ranges = local.country_subnet_cidrs[each.key]
      allow = [{
        protocol = "all"
      }]
    }

    deny-other-ingress = {
      name          = "${each.value.network_name}-deny-other-ingress"
      description   = "Log and deny ingress not approved by a higher-priority rule."
      direction     = "INGRESS"
      priority      = 65534
      source_ranges = ["0.0.0.0/0"]
      deny = [{
        protocol = "all"
      }]
    }
  }
}
