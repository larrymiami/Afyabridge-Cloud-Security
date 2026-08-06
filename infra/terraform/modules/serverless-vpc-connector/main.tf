resource "google_vpc_access_connector" "this" {
  project = var.project_id
  name    = var.name
  region  = var.region
  network = var.network_name

  ip_cidr_range  = var.ip_cidr_range
  machine_type   = var.machine_type
  min_instances  = var.min_instances
  max_instances  = var.max_instances
  min_throughput = var.min_throughput
  max_throughput = var.max_throughput
}
