output "managed_zone_names" {
  description = "Private managed-zone names."
  value = {
    googleapis = google_dns_managed_zone.googleapis.name
    gcr        = google_dns_managed_zone.gcr.name
  }
}
