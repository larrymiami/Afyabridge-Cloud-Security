locals {
  country_subnet_cidrs = {
    for country, network in var.country_networks : country => toset([
      for subnet in values(network.subnets) : subnet.ip_cidr_range
    ])
  }

  private_service_cidrs = {
    for country, config in var.private_service_access : country => "${config.address}/${config.prefix_length}"
  }

  country_internal_source_cidrs = {
    for country, cidrs in local.country_subnet_cidrs : country => setunion(
      cidrs,
      toset([var.serverless_connectors[country].ip_cidr_range])
    )
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
      description   = "Allow east-west traffic only within the country network allocation and its serverless connector range."
      direction     = "INGRESS"
      priority      = 1000
      source_ranges = local.country_internal_source_cidrs[each.key]
      allow = [{
        protocol = "all"
      }]
    }

    allow-google-health-checks = {
      name          = "${each.value.network_name}-allow-google-health-checks"
      description   = "Allow Google Cloud health-check probes only to tagged backends."
      direction     = "INGRESS"
      priority      = 1100
      source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
      target_tags   = var.health_check_target_tags
      allow = [{
        protocol = "tcp"
        ports    = var.health_check_ports
      }]
    }

    allow-iap-admin = {
      name          = "${each.value.network_name}-allow-iap-admin"
      description   = "Allow SSH or RDP only through IAP TCP forwarding to explicitly tagged instances."
      direction     = "INGRESS"
      priority      = 1200
      source_ranges = ["35.235.240.0/20"]
      target_tags   = var.iap_admin_target_tags
      allow = [{
        protocol = "tcp"
        ports    = var.iap_admin_ports
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

    allow-country-internal-egress = {
      name               = "${each.value.network_name}-allow-country-internal-egress"
      description        = "Allow outbound traffic only to subnets within the same country network."
      direction          = "EGRESS"
      priority           = 1000
      destination_ranges = local.country_subnet_cidrs[each.key]
      allow = [{
        protocol = "all"
      }]
    }

    allow-dns-egress = {
      name               = "${each.value.network_name}-allow-dns-egress"
      description        = "Allow DNS queries to the Google Cloud metadata resolver."
      direction          = "EGRESS"
      priority           = 1100
      destination_ranges = ["169.254.169.254/32"]
      allow = [
        {
          protocol = "udp"
          ports    = ["53"]
        },
        {
          protocol = "tcp"
          ports    = ["53"]
        }
      ]
    }

    allow-restricted-google-apis = {
      name               = "${each.value.network_name}-allow-restricted-google-apis"
      description        = "Allow HTTPS only to restricted.googleapis.com virtual IPs."
      direction          = "EGRESS"
      priority           = 1200
      destination_ranges = ["199.36.153.8/30"]
      allow = [{
        protocol = "tcp"
        ports    = ["443"]
      }]
    }

    allow-private-services-egress = {
      name               = "${each.value.network_name}-allow-private-services-egress"
      description        = "Allow traffic to the country-owned private service access range."
      direction          = "EGRESS"
      priority           = 1300
      destination_ranges = [local.private_service_cidrs[each.key]]
      allow = [{
        protocol = "all"
      }]
    }

    deny-other-egress = {
      name               = "${each.value.network_name}-deny-other-egress"
      description        = "Log and deny outbound traffic not approved by a higher-priority rule."
      direction          = "EGRESS"
      priority           = 65534
      destination_ranges = ["0.0.0.0/0"]
      deny = [{
        protocol = "all"
      }]
    }
  }
}
