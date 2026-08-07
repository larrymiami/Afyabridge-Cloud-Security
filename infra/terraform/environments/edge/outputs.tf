output "country_edge_inventory" {
  description = "Country-isolated regional edge routing and Cloud Armor inventory."
  value = {
    for country, edge in module.country_edges : country => {
      frontend_address     = edge.frontend_address
      proxy_only_subnet_id = edge.proxy_only_subnet_id
      serverless_neg_id    = edge.serverless_neg_id
      backend_service_id   = edge.backend_service_id
      url_map_id           = edge.url_map_id
      cloud_armor_policy   = edge.cloud_armor_policy
    }
  }
}
