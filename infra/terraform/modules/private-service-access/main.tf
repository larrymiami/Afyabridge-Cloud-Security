resource "google_compute_global_address" "this" {
  project       = var.project_id
  name          = var.address_name
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = var.prefix_length
  address       = var.address
  network       = var.network_id
}

resource "google_service_networking_connection" "this" {
  network                 = var.network_id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.this.name]
}
