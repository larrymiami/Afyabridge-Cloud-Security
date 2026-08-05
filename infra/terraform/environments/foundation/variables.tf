variable "billing_account_id" {
  description = "Billing account attached to all managed projects."
  type        = string
  sensitive   = true
}

variable "folders" {
  description = "Folder IDs for shared services and country environments."
  type = object({
    shared = string
    ke = object({
      dev  = string
      stg  = string
      prod = string
    })
    gh = object({
      dev  = string
      stg  = string
      prod = string
    })
    za = object({
      dev  = string
      stg  = string
      prod = string
    })
  })
}

variable "projects" {
  description = "Authoritative project inventory keyed by stable logical name."
  type = map(object({
    project_id          = string
    project_name        = string
    country             = string
    environment         = string
    service             = string
    owner               = string
    cost_center         = string
    data_classification = string
    activate_apis       = set(string)
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
}
