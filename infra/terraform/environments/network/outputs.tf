output "country_networks" {
  description = "Country-isolated network, subnet, router, NAT, and service-project inventory."
  value = {
    for country, network in module.country_networks : country => {
      network_id                = network.network_id
      network_name              = network.network_name
      subnet_ids                = network.subnet_ids
      subnet_cidrs              = network.subnet_cidrs
      router_name               = network.router_name
      nat_name                  = network.nat_name
      attached_service_projects = network.attached_service_projects
    }
  }
}
