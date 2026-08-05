module "private_service_access" {
  for_each = var.private_service_access

  source = "../../modules/private-service-access"

  project_id    = var.country_networks[each.key].host_project_id
  network_id    = module.country_networks[each.key].network_id
  address_name  = each.value.address_name
  address       = each.value.address
  prefix_length = each.value.prefix_length
}

module "private_google_dns" {
  for_each = var.country_networks

  source = "../../modules/private-google-dns"

  project_id  = each.value.host_project_id
  network_id  = module.country_networks[each.key].network_id
  zone_prefix = "afyabridge-${each.key}"
}
