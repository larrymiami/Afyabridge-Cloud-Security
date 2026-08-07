check "hostname_within_managed_zone" {
  assert {
    condition     = endswith("${var.hostname}.", var.dns_zone_dns_name)
    error_message = "hostname must be contained within dns_zone_dns_name."
  }
}

resource "google_dns_managed_zone" "public" {
  project = var.dns_project_id

  name        = var.dns_zone_name
  dns_name    = var.dns_zone_dns_name
  description = "Country-scoped public DNS zone for ${var.name_prefix}."
  visibility  = "public"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_certificate_manager_dns_authorization" "https" {
  project  = var.edge_project_id
  location = var.region

  name            = "${var.name_prefix}-dns-auth"
  description     = "Regional DNS authorization for ${var.hostname}."
  domain          = var.hostname
  type            = "PER_PROJECT_RECORD"
  deletion_policy = "PREVENT"
}

resource "google_dns_record_set" "certificate_authorization" {
  project      = var.dns_project_id
  managed_zone = google_dns_managed_zone.public.name

  name = google_certificate_manager_dns_authorization.https.dns_resource_record[0].name
  type = google_certificate_manager_dns_authorization.https.dns_resource_record[0].type
  ttl  = var.dns_ttl

  rrdatas = [google_certificate_manager_dns_authorization.https.dns_resource_record[0].data]
}

resource "google_certificate_manager_certificate" "https" {
  project  = var.edge_project_id
  location = var.region

  name            = "${var.name_prefix}-certificate"
  description     = "Regional Google-managed TLS certificate for ${var.hostname}."
  deletion_policy = "PREVENT"

  managed {
    domains            = [var.hostname]
    dns_authorizations = [google_certificate_manager_dns_authorization.https.id]
  }

  depends_on = [google_dns_record_set.certificate_authorization]
}

resource "google_compute_region_ssl_policy" "https" {
  project = var.edge_project_id
  region  = var.region

  name            = "${var.name_prefix}-tls-policy"
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"
}

resource "google_compute_region_target_https_proxy" "https" {
  project = var.edge_project_id
  region  = var.region

  name                             = "${var.name_prefix}-https-proxy"
  url_map                          = google_compute_region_url_map.https.id
  certificate_manager_certificates = [google_certificate_manager_certificate.https.id]
  ssl_policy                       = google_compute_region_ssl_policy.https.id
}

resource "google_compute_forwarding_rule" "https" {
  project = var.edge_project_id
  region  = var.region

  name                  = "${var.name_prefix}-https-forwarding-rule"
  ip_address            = google_compute_address.frontend.id
  ip_protocol           = "TCP"
  port_range            = "443"
  target                = google_compute_region_target_https_proxy.https.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
  network_tier          = var.network_tier
}

resource "google_compute_region_url_map" "http_redirect" {
  project = var.edge_project_id
  region  = var.region

  name = "${var.name_prefix}-http-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_region_target_http_proxy" "http_redirect" {
  project = var.edge_project_id
  region  = var.region

  name    = "${var.name_prefix}-http-redirect-proxy"
  url_map = google_compute_region_url_map.http_redirect.id
}

resource "google_compute_forwarding_rule" "http_redirect" {
  project = var.edge_project_id
  region  = var.region

  name                  = "${var.name_prefix}-http-forwarding-rule"
  ip_address            = google_compute_address.frontend.id
  ip_protocol           = "TCP"
  port_range            = "80"
  target                = google_compute_region_target_http_proxy.http_redirect.id
  load_balancing_scheme = "EXTERNAL_MANAGED"
  network_tier          = var.network_tier
}

resource "google_dns_record_set" "frontend" {
  project      = var.dns_project_id
  managed_zone = google_dns_managed_zone.public.name

  name    = "${var.hostname}."
  type    = "A"
  ttl     = var.dns_ttl
  rrdatas = [google_compute_address.frontend.address]
}
