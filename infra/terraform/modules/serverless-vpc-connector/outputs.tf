output "id" {
  description = "Serverless VPC Access connector identifier."
  value       = google_vpc_access_connector.this.id
}

output "name" {
  description = "Serverless VPC Access connector name."
  value       = google_vpc_access_connector.this.name
}

output "region" {
  description = "Connector region."
  value       = google_vpc_access_connector.this.region
}

output "ip_cidr_range" {
  description = "Dedicated connector CIDR range."
  value       = google_vpc_access_connector.this.ip_cidr_range
}
