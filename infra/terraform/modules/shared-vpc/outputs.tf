output "network_id" {
  description = "Shared VPC network resource ID."
  value       = google_compute_network.this.id
}

output "network_name" {
  description = "Shared VPC network name."
  value       = google_compute_network.this.name
}

output "subnet_ids" {
  description = "Subnet resource IDs keyed by logical subnet name."
  value       = { for key, subnet in google_compute_subnetwork.this : key => subnet.id }
}

output "subnet_cidrs" {
  description = "Primary subnet CIDR ranges keyed by logical subnet name."
  value       = { for key, subnet in google_compute_subnetwork.this : key => subnet.ip_cidr_range }
}

output "attached_service_projects" {
  description = "Service projects attached to the Shared VPC host."
  value       = sort(tolist(var.service_project_ids))
}

output "router_name" {
  description = "Cloud Router name."
  value       = google_compute_router.this.name
}

output "nat_name" {
  description = "Cloud NAT gateway name."
  value       = google_compute_router_nat.this.name
}
