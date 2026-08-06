variable "project_id" {
  description = "Project that owns notification channels and alert policies."
  type        = string
}

variable "notification_channels" {
  description = "Reviewed notification channels keyed by stable logical name."
  type = map(object({
    display_name = string
    type         = string
    labels       = map(string)
    enabled      = optional(bool, true)
    description  = optional(string, "")
  }))

  validation {
    condition = alltrue([
      for channel in values(var.notification_channels) :
      length(trimspace(channel.display_name)) > 0 &&
      length(trimspace(channel.type)) > 0 &&
      length(channel.labels) > 0
    ])
    error_message = "Notification channels require a display name, type, and at least one label."
  }
}

variable "alert_policies" {
  description = "Threshold alert policies keyed by stable logical name."
  type = map(object({
    display_name            = string
    condition_display_name  = string
    filter                  = string
    comparison              = string
    threshold_value         = number
    duration                = string
    alignment_period        = optional(string, "300s")
    per_series_aligner      = optional(string, "ALIGN_MEAN")
    cross_series_reducer    = optional(string, "REDUCE_NONE")
    group_by_fields         = optional(list(string), [])
    notification_channels   = set(string)
    severity                = string
    owner                   = string
    runbook_url             = string
    documentation           = string
    auto_close              = optional(string, "604800s")
    notification_rate_limit = optional(string, "300s")
    enabled                 = optional(bool, true)
  }))

  validation {
    condition = alltrue([
      for policy in values(var.alert_policies) :
      contains(["COMPARISON_GT", "COMPARISON_GE", "COMPARISON_LT", "COMPARISON_LE", "COMPARISON_EQ", "COMPARISON_NE"], policy.comparison)
    ])
    error_message = "Alert comparisons must use a supported Cloud Monitoring comparison value."
  }

  validation {
    condition = alltrue([
      for policy in values(var.alert_policies) :
      contains(["critical", "high", "medium", "low"], lower(policy.severity)) &&
      length(trimspace(policy.owner)) > 0 &&
      can(regex("^https://", policy.runbook_url))
    ])
    error_message = "Every alert requires a supported severity, owner, and HTTPS runbook URL."
  }

  validation {
    condition = alltrue(flatten([
      for policy in values(var.alert_policies) : [
        for channel_key in policy.notification_channels : contains(keys(var.notification_channels), channel_key)
      ]
    ]))
    error_message = "Every alert notification channel must reference a configured channel key."
  }
}
