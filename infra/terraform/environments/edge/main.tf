module "country_edges" {
  for_each = var.country_edges

  source = "../../modules/regional-serverless-edge"

  edge_project_id                         = each.value.edge_project_id
  network_project_id                      = each.value.network_project_id
  dns_project_id                          = each.value.dns_project_id
  region                                  = each.value.region
  network_id                              = each.value.network_id
  proxy_only_subnet_name                  = each.value.proxy_only_subnet_name
  proxy_only_subnet_cidr                  = each.value.proxy_only_subnet_cidr
  cloud_run_service_name                  = each.value.cloud_run_service_name
  name_prefix                             = each.value.name_prefix
  dns_zone_name                           = each.value.dns_zone_name
  dns_zone_dns_name                       = each.value.dns_zone_dns_name
  hostname                                = each.value.hostname
  dns_ttl                                 = each.value.dns_ttl
  network_tier                            = each.value.network_tier
  backend_timeout_seconds                 = each.value.backend_timeout_seconds
  backend_log_sample_rate                 = each.value.backend_log_sample_rate
  cloud_armor_preview                     = each.value.cloud_armor_preview
  cloud_armor_waf_sensitivity             = each.value.cloud_armor_waf_sensitivity
  cloud_armor_rate_limit_count            = each.value.cloud_armor_rate_limit_count
  cloud_armor_rate_limit_interval_seconds = each.value.cloud_armor_rate_limit_interval_seconds
}
