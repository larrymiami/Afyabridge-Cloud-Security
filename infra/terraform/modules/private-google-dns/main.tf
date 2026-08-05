resource "google_dns_managed_zone" "googleapis" {
  project     = var.project_id
  name        = "${var.zone_prefix}-googleapis"
  dns_name    = "googleapis.com."
  description = "Private Google APIs zone for the country Shared VPC."
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = var.network_id
    }
  }
}

resource "google_dns_record_set" "googleapis_cname" {
  project      = var.project_id
  managed_zone = google_dns_managed_zone.googleapis.name
  name         = "*.googleapis.com."
  type         = "CNAME"
  ttl          = 300
  rrdatas      = ["restricted.googleapis.com."]
}

resource "google_dns_record_set" "restricted_a" {
  project      = var.project_id
  managed_zone = google_dns_managed_zone.googleapis.name
  name         = "restricted.googleapis.com."
  type         = "A"
  ttl          = 300
  rrdatas      = ["199.36.153.8", "199.36.153.9", "199.36.153.10", "199.36.153.11"]
}

resource "google_dns_managed_zone" "gcr" {
  project     = var.project_id
  name        = "${var.zone_prefix}-gcr"
  dns_name    = "gcr.io."
  description = "Private Container Registry DNS zone for the country Shared VPC."
  visibility  = "private"

  private_visibility_config {
    networks {
      network_url = var.network_id
    }
  }
}

resource "google_dns_record_set" "gcr_cname" {
  project      = var.project_id
  managed_zone = google_dns_managed_zone.gcr.name
  name         = "*.gcr.io."
  type         = "CNAME"
  ttl          = 300
  rrdatas      = ["gcr.io."]
}

resource "google_dns_record_set" "gcr_a" {
  project      = var.project_id
  managed_zone = google_dns_managed_zone.gcr.name
  name         = "gcr.io."
  type         = "A"
  ttl          = 300
  rrdatas      = ["199.36.153.8", "199.36.153.9", "199.36.153.10", "199.36.153.11"]
}
