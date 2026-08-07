resource "google_compute_subnetwork" "proxy_only" {
  project = var.network_project_id
  region  = var.region

  name          = var.proxy_only_subnet_name
  ip_cidr_range = var.proxy_only_subnet_cidr
  network       = var.network_id
  purpose       = "REGIONAL_MANAGED_PROXY"
  role          = "ACTIVE"
}

resource "google_compute_address" "frontend" {
  project = var.edge_project_id
  region  = var.region

  name         = "${var.name_prefix}-ipv4"
  address_type = "EXTERNAL"
  network_tier = var.network_tier
}

resource "google_compute_region_network_endpoint_group" "cloud_run" {
  project = var.edge_project_id
  region  = var.region

  name                  = "${var.name_prefix}-neg"
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = var.cloud_run_service_name
  }
}

resource "google_compute_region_backend_service" "cloud_run" {
  project = var.edge_project_id
  region  = var.region

  name                  = "${var.name_prefix}-backend"
  protocol              = "HTTP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  timeout_sec           = var.backend_timeout_seconds
  security_policy       = google_compute_region_security_policy.edge.self_link

  backend {
    group = google_compute_region_network_endpoint_group.cloud_run.id
  }

  log_config {
    enable      = true
    sample_rate = var.backend_log_sample_rate
  }
}

resource "google_compute_region_url_map" "https" {
  project = var.edge_project_id
  region  = var.region

  name            = "${var.name_prefix}-url-map"
  default_service = google_compute_region_backend_service.cloud_run.id
}
