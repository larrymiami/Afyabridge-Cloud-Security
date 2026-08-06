variable "storage_buckets" {
  description = "Country-scoped Cloud Storage buckets keyed by stable logical name."
  type = map(object({
    country                       = string
    environment                   = string
    project_id                    = string
    name                          = string
    location                      = string
    storage_class                 = optional(string, "STANDARD")
    kms_key_name                  = optional(string)
    versioning_enabled            = optional(bool, true)
    soft_delete_retention_seconds = optional(number, 604800)
    retention_period_seconds      = optional(number)
    lock_retention_policy         = optional(bool, false)
    force_destroy                 = optional(bool, false)
    iam_bindings                  = optional(map(set(string)), {})
    lifecycle_rules = optional(map(object({
      action = object({
        type          = string
        storage_class = optional(string)
      })
      condition = object({
        age                        = optional(number)
        created_before             = optional(string)
        with_state                 = optional(string)
        num_newer_versions         = optional(number)
        days_since_noncurrent_time = optional(number)
        matches_prefix             = optional(set(string))
        matches_suffix             = optional(set(string))
      })
    })), {})
  }))
  default = {}

  validation {
    condition     = alltrue([for bucket in values(var.storage_buckets) : contains(["ke", "gh", "za"], bucket.country)])
    error_message = "Each bucket must belong to ke, gh, or za."
  }

  validation {
    condition     = alltrue([for bucket in values(var.storage_buckets) : contains(["dev", "stg", "prod"], bucket.environment)])
    error_message = "Each bucket environment must be dev, stg, or prod."
  }

  validation {
    condition     = length(distinct([for bucket in values(var.storage_buckets) : bucket.name])) == length(var.storage_buckets)
    error_message = "Bucket names must be unique."
  }

  validation {
    condition     = alltrue([for bucket in values(var.storage_buckets) : bucket.force_destroy == false])
    error_message = "Country workload buckets must not enable force_destroy."
  }

  validation {
    condition = alltrue(flatten([
      for bucket in values(var.storage_buckets) : [
        for members in values(bucket.iam_bindings) : alltrue([
          for member in members : !contains(["allUsers", "allAuthenticatedUsers"], member)
        ])
      ]
    ]))
    error_message = "Bucket IAM must not contain public principals."
  }
}
