resource "google_compute_network" "this" {
  project                 = var.host_project_id
  name                    = var.network_name
  auto_create_subnetworks = false
  routing_mode            = var.routing_mode
  delete_default_routes_on_create = true
}

resource "google_compute_shared_vpc_host_project" "this" {
  project = var.host_project_id
}

resource "google_compute_subnetwork" "this" {
  for_each = var.subnets

  project                  = var.host_project_id
  name                     = each.value.name
  region                   = each.value.region
  network                  = google_compute_network.this.id
  ip_cidr_range            = each.value.ip_cidr_range
  private_ip_google_access = each.value.private_ip_google_access
  purpose                  = each.value.purpose
  role                     = each.value.role

  dynamic "secondary_ip_range" {
    for_each = each.value.secondary_ip_ranges
    content {
      range_name    = secondary_ip_range.key
      ip_cidr_range = secondary_ip_range.value
    }
  }

  log_config {
    aggregation_interval = each.value.flow_logs.aggregation_interval
    flow_sampling        = each.value.flow_logs.flow_sampling
    metadata             = each.value.flow_logs.metadata
    filter_expr          = each.value.flow_logs.filter_expr
  }
}

resource "google_compute_shared_vpc_service_project" "this" {
  for_each = var.service_project_ids

  host_project    = var.host_project_id
  service_project = each.value

  depends_on = [google_compute_shared_vpc_host_project.this]
}

resource "google_compute_router" "this" {
  project = var.host_project_id
  name    = var.router_name
  region  = var.router_region
  network = google_compute_network.this.id
}

resource "google_compute_router_nat" "this" {
  project                            = var.host_project_id
  name                               = var.nat_name
  router                             = google_compute_router.this.name
  region                             = google_compute_router.this.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"
  min_ports_per_vm                   = var.nat_min_ports_per_vm

  log_config {
    enable = true
    filter = "ALL"
  }
}

resource "google_compute_route" "private_google_access" {
  project          = var.host_project_id
  name             = "${var.network_name}-private-google-access"
  network          = google_compute_network.this.name
  dest_range       = "199.36.153.8/30"
  next_hop_gateway = "default-internet-gateway"
  priority         = 900
}
