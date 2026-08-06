resource "google_compute_firewall" "this" {
  for_each = var.rules

  project     = var.project_id
  name        = each.value.name
  description = each.value.description
  network     = var.network_name
  direction   = each.value.direction
  priority    = each.value.priority
  disabled    = each.value.disabled

  source_ranges           = each.value.direction == "INGRESS" ? each.value.source_ranges : null
  destination_ranges      = each.value.direction == "EGRESS" ? each.value.destination_ranges : null
  source_tags             = each.value.direction == "INGRESS" ? each.value.source_tags : null
  target_tags             = each.value.target_tags
  source_service_accounts = each.value.direction == "INGRESS" ? each.value.source_service_accounts : null
  target_service_accounts = each.value.target_service_accounts

  dynamic "allow" {
    for_each = each.value.allow
    content {
      protocol = allow.value.protocol
      ports    = allow.value.ports
    }
  }

  dynamic "deny" {
    for_each = each.value.deny
    content {
      protocol = deny.value.protocol
      ports    = deny.value.ports
    }
  }

  dynamic "log_config" {
    for_each = each.value.enable_logging ? [1] : []
    content {
      metadata = "INCLUDE_ALL_METADATA"
    }
  }
}
