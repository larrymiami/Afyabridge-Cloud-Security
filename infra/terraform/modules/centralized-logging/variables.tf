variable "organization_id" {
  description = "Numeric Google Cloud organization ID that owns the aggregated sinks."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.organization_id))
    error_message = "organization_id must be numeric."
  }
}

variable "logging_project_id" {
  description = "Project that owns the centralized Cloud Logging buckets."
  type        = string
}

variable "buckets" {
  description = "Centralized log buckets keyed by stable logical name."
  type = map(object({
    bucket_id        = string
    location         = string
    description      = string
    retention_days   = number
    enable_analytics = optional(bool, false)
    locked           = optional(bool, false)
  }))

  validation {
    condition = alltrue([
      for bucket in values(var.buckets) :
      bucket.retention_days >= 1 && bucket.retention_days <= 3650
    ])
    error_message = "Log bucket retention must be between 1 and 3650 days."
  }

  validation {
    condition = length(distinct([
      for bucket in values(var.buckets) : "${bucket.location}/${bucket.bucket_id}"
    ])) == length(var.buckets)
    error_message = "Each logging bucket location and bucket_id combination must be unique."
  }
}

variable "sinks" {
  description = "Non-intercepting organization sinks keyed by stable logical name."
  type = map(object({
    name            = string
    description     = string
    bucket_key      = string
    filter          = string
    disabled        = optional(bool, false)
    include_children = optional(bool, true)
    exclusions = optional(map(object({
      description = string
      filter      = string
      disabled    = optional(bool, false)
    })), {})
  }))

  validation {
    condition = alltrue([
      for sink in values(var.sinks) : contains(keys(var.buckets), sink.bucket_key)
    ])
    error_message = "Every sink bucket_key must reference a configured centralized logging bucket."
  }

  validation {
    condition = alltrue([
      for sink in values(var.sinks) :
      sink.include_children && length(trimspace(sink.filter)) > 0 && length(sink.filter) <= 20000
    ])
    error_message = "Aggregated sinks must include children and use a non-empty filter no longer than 20,000 characters."
  }

  validation {
    condition = alltrue(flatten([
      for sink in values(var.sinks) : [
        for exclusion_name, exclusion in sink.exclusions :
        can(regex("^[A-Za-z0-9][A-Za-z0-9_.-]{0,99}$", exclusion_name)) &&
        length(trimspace(exclusion.description)) > 0 &&
        length(trimspace(exclusion.filter)) > 0 &&
        length(exclusion.filter) <= 20000
      ]
    ]))
    error_message = "Exclusions require valid names, descriptions, and non-empty filters no longer than 20,000 characters."
  }
}
