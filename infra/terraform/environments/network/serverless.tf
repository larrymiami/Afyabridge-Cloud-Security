module "serverless_connectors" {
  for_each = var.serverless_connectors

  source = "../../modules/serverless-vpc-connector"

  project_id      = var.country_networks[each.key].host_project_id
  name            = each.value.name
  region          = each.value.region
  network_name    = module.country_networks[each.key].network_name
  ip_cidr_range   = each.value.ip_cidr_range
  machine_type    = each.value.machine_type
  min_instances   = each.value.min_instances
  max_instances   = each.value.max_instances
  min_throughput  = each.value.min_throughput
  max_throughput  = each.value.max_throughput
}
