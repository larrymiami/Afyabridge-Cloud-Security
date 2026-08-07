variable "organization_id" {
  description = "Numeric Google Cloud organization ID used to create the managed folder hierarchy."
  type        = string
}

variable "billing_account_id" {
  description = "Billing account attached to managed projects and project budgets."
  type        = string
  sensitive   = true
}

variable "countries" {
  description = "Authoritative country folder inventory and approved environments."
  type = map(object({
    display_name = string
    environments = set(string)
  }))

  default = {
    ke = {
      display_name = "Kenya"
      environments = ["dev", "stg", "prod"]
    }
    gh = {
      display_name = "Ghana"
      environments = ["dev", "stg", "prod"]
    }
    za = {
      display_name = "South Africa"
      environments = ["dev", "stg", "prod"]
    }
  }
}

variable "baseline_boolean_policies" {
  description = "Boolean organization policies applied to shared and country folders."
  type        = map(bool)
  default = {
    "iam.disableServiceAccountKeyCreation" = true
    "iam.disableServiceAccountKeyUpload"   = true
  }

  validation {
    condition = (
      try(var.baseline_boolean_policies["iam.disableServiceAccountKeyCreation"], false) &&
      try(var.baseline_boolean_policies["iam.disableServiceAccountKeyUpload"], false)
    )
    error_message = "The reviewed foundation requires service-account key creation and upload to remain disabled."
  }
}

variable "projects" {
  description = "Authoritative project inventory keyed by stable logical name."
  type = map(object({
    project_id            = string
    project_name          = string
    country               = string
    environment           = string
    service               = string
    owner                 = string
    cost_center           = string
    data_classification   = string
    activate_apis         = set(string)
    iam_bindings          = optional(map(set(string)), {})
    monthly_budget_amount = optional(number)
    budget_currency_code  = optional(string, "USD")
  }))

  validation {
    condition = alltrue([
      for project in values(var.projects) :
      contains(["ke", "gh", "za", "global"], project.country)
    ])
    error_message = "Every project must use an approved country token."
  }

  validation {
    condition = alltrue([
      for project in values(var.projects) :
      contains(["dev", "stg", "prod", "shared"], project.environment)
    ])
    error_message = "Every project must use an approved environment token."
  }

  validation {
    condition = alltrue([
      for project in values(var.projects) :
      (project.country == "global") == (project.environment == "shared")
    ])
    error_message = "Global projects must be shared, and shared projects must be global."
  }

  validation {
    condition = alltrue([
      for project in values(var.projects) :
      project.monthly_budget_amount == null || project.monthly_budget_amount > 0
    ])
    error_message = "Configured monthly budgets must be greater than zero."
  }
}

variable "budget_notification_channels" {
  description = "Cloud Monitoring notification channels used by all configured project budgets."
  type        = set(string)
  default     = []
}
