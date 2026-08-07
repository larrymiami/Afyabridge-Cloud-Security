locals {
  cloud_armor_waf_rules = {
    sqli = {
      priority    = 1000
      ruleset     = "sqli-v422-stable"
      description = "OWASP CRS 4.22 SQL injection protection."
    }
    xss = {
      priority    = 1010
      ruleset     = "xss-v422-stable"
      description = "OWASP CRS 4.22 cross-site scripting protection."
    }
    lfi = {
      priority    = 1020
      ruleset     = "lfi-v422-stable"
      description = "OWASP CRS 4.22 local file inclusion protection."
    }
    rfi = {
      priority    = 1030
      ruleset     = "rfi-v422-stable"
      description = "OWASP CRS 4.22 remote file inclusion protection."
    }
    rce = {
      priority    = 1040
      ruleset     = "rce-v422-stable"
      description = "OWASP CRS 4.22 remote code execution protection."
    }
    protocol_attack = {
      priority    = 1050
      ruleset     = "protocolattack-v422-stable"
      description = "OWASP CRS 4.22 HTTP protocol attack protection."
    }
    scanner_detection = {
      priority    = 1060
      ruleset     = "scannerdetection-v422-stable"
      description = "OWASP CRS 4.22 scanner detection."
    }
  }
}

resource "google_compute_region_security_policy" "edge" {
  project = var.edge_project_id
  region  = var.region

  name        = "${var.name_prefix}-armor"
  description = "Country-scoped Cloud Armor policy for ${var.name_prefix}."
  type        = "CLOUD_ARMOR"

  advanced_options_config {
    json_parsing = "STANDARD"
    log_level    = "VERBOSE"
  }

  deletion_policy = "PREVENT"
}

resource "google_compute_region_security_policy_rule" "waf" {
  for_each = local.cloud_armor_waf_rules

  project         = var.edge_project_id
  region          = var.region
  security_policy = google_compute_region_security_policy.edge.name

  priority    = each.value.priority
  description = each.value.description
  action      = "deny(403)"
  preview     = var.cloud_armor_preview

  match {
    expr {
      expression = "evaluatePreconfiguredWaf('${each.value.ruleset}', {'sensitivity': ${var.cloud_armor_waf_sensitivity}})"
    }
  }
}

resource "google_compute_region_security_policy_rule" "rate_limit" {
  project = var.edge_project_id
  region  = var.region

  security_policy = google_compute_region_security_policy.edge.name
  priority        = 2000
  description     = "Per-source-IP request throttling baseline."
  action          = "throttle"
  preview         = var.cloud_armor_preview

  match {
    expr {
      expression = "true"
    }
  }

  rate_limit_options {
    conform_action = "allow"
    exceed_action  = "deny(429)"
    enforce_on_key = "IP"

    rate_limit_threshold {
      count        = var.cloud_armor_rate_limit_count
      interval_sec = var.cloud_armor_rate_limit_interval_seconds
    }
  }
}
