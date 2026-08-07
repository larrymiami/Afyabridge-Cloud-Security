variable "organization_id" {
  description = "Numeric Google Cloud organization ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.organization_id))
    error_message = "organization_id must be numeric."
  }
}

variable "logging_project_id" {
  description = "Shared-services project that owns centralized Cloud Logging buckets."
  type        = string
}

variable "security_logging_location" {
  description = "Reviewed location for the shared security log bucket."
  type        = string
}

variable "country_logging_locations" {
  description = "Reviewed Cloud Logging bucket location for each production country boundary."
  type        = map(string)

  validation {
    condition = (
      length(setsubtract(toset(keys(var.country_logging_locations)), toset(["ke", "gh", "za"]))) == 0 &&
      length(setsubtract(toset(["ke", "gh", "za"]), toset(keys(var.country_logging_locations)))) == 0
    )
    error_message = "country_logging_locations must define exactly ke, gh, and za."
  }
}

variable "country_project_ids" {
  description = "Authoritative production project IDs grouped by country boundary."
  type        = map(set(string))

  validation {
    condition = (
      length(setsubtract(toset(keys(var.country_project_ids)), toset(["ke", "gh", "za"]))) == 0 &&
      length(setsubtract(toset(["ke", "gh", "za"]), toset(keys(var.country_project_ids)))) == 0
    )
    error_message = "country_project_ids must define exactly ke, gh, and za."
  }

  validation {
    condition = alltrue([
      for projects in values(var.country_project_ids) : length(projects) > 0
    ])
    error_message = "Each country boundary must contain at least one project ID."
  }

  validation {
    condition = length(distinct(flatten([
      for projects in values(var.country_project_ids) : tolist(projects)
      ]))) == length(flatten([
      for projects in values(var.country_project_ids) : tolist(projects)
    ]))
    error_message = "A project ID cannot belong to more than one country boundary."
  }
}

variable "security_retention_days" {
  description = "Retention for central administrative and security audit logs."
  type        = number
  default     = 365

  validation {
    condition     = var.security_retention_days >= 90 && var.security_retention_days <= 3650
    error_message = "security_retention_days must be between 90 and 3650 days."
  }
}

variable "country_retention_days" {
  description = "Retention for country-local operational logs."
  type        = number
  default     = 90

  validation {
    condition     = var.country_retention_days >= 30 && var.country_retention_days <= 3650
    error_message = "country_retention_days must be between 30 and 3650 days."
  }
}

variable "lock_security_bucket" {
  description = "Irreversibly lock the security bucket retention policy after review."
  type        = bool
  default     = false
}
