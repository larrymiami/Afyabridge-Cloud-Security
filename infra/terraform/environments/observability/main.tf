locals {
  country_project_filters = {
    for country, projects in var.country_project_ids : country => join(" OR ", [
      for project_id in sort(tolist(projects)) : "logName:\"projects/${project_id}/logs/\""
    ])
  }

  security_filter = <<-EOT
    LOG_ID("cloudaudit.googleapis.com/activity") OR
    LOG_ID("cloudaudit.googleapis.com/system_event") OR
    LOG_ID("cloudaudit.googleapis.com/policy") OR
    (
      LOG_ID("cloudaudit.googleapis.com/data_access") AND
      protoPayload.serviceName=(
        "iam.googleapis.com" OR
        "iamcredentials.googleapis.com" OR
        "sts.googleapis.com" OR
        "secretmanager.googleapis.com" OR
        "cloudkms.googleapis.com" OR
        "storage.googleapis.com" OR
        "sqladmin.googleapis.com" OR
        "artifactregistry.googleapis.com" OR
        "run.googleapis.com" OR
        "logging.googleapis.com"
      )
    )
  EOT

  buckets = merge(
    {
      security = {
        bucket_id        = "afyabridge-security"
        location         = var.security_logging_location
        description      = "Central administrative, policy, and selected security data-access logs."
        retention_days   = var.security_retention_days
        enable_analytics = true
        locked           = var.lock_security_bucket
      }
    },
    {
      for country, location in var.country_logging_locations : country => {
        bucket_id        = "afyabridge-${country}-operations"
        location         = location
        description      = "Country-local operational logs for the ${upper(country)} production boundary."
        retention_days   = var.country_retention_days
        enable_analytics = true
        locked           = false
      }
    }
  )

  sinks = merge(
    {
      security = {
        name             = "afyabridge-security-audit"
        description      = "Non-intercepting organization sink for central administrative and security audit logs."
        bucket_key       = "security"
        filter           = trimspace(local.security_filter)
        disabled         = false
        include_children = true
        exclusions = {
          proposed-read-sampling = {
            description = "Disabled placeholder. Sampling security data-access reads requires documented privacy, cost, and detection review."
            filter      = "LOG_ID(\"cloudaudit.googleapis.com/data_access\") AND protoPayload.methodName:\"get\" AND sample(insertId, 0.90)"
            disabled    = true
          }
        }
      }
    },
    {
      for country in ["ke", "gh", "za"] : country => {
        name             = "afyabridge-${country}-operations"
        description      = "Non-intercepting organization sink retaining operational logs inside the ${upper(country)} country boundary."
        bucket_key       = country
        filter           = "(${local.country_project_filters[country]})"
        disabled         = false
        include_children = true
        exclusions       = {}
      }
    }
  )
}

module "centralized_logging" {
  source = "../../modules/centralized-logging"

  organization_id    = var.organization_id
  logging_project_id = var.logging_project_id
  buckets            = local.buckets
  sinks              = local.sinks
}
