variable "project_id" {
  description = "Project that owns log-based metrics and detection alert policies."
  type        = string
}

variable "notification_channel_names" {
  description = "Existing Cloud Monitoring notification channel resource names."
  type        = set(string)
  default     = []
}

variable "detections" {
  description = "Log-based counter detections keyed by stable logical name."
  type = map(object({
    metric_name             = string
    description             = string
    filter                  = string
    display_name            = string
    condition_display_name  = string
    severity                = string
    owner                   = string
    runbook_url             = string
    threshold_value         = optional(number, 0)
    duration                = optional(string, "0s")
    alignment_period        = optional(string, "60s")
    auto_close              = optional(string, "604800s")
    notification_rate_limit = optional(string, "300s")
    enabled                 = optional(bool, false)
  }))

  validation {
    condition = alltrue([
      for detection in values(var.detections) :
      can(regex("^[a-z][a-z0-9_]{0,99}$", detection.metric_name)) &&
      length(trimspace(detection.description)) > 0 &&
      length(trimspace(detection.filter)) > 0 &&
      length(detection.filter) <= 20000
    ])
    error_message = "Detection metrics require a valid name, description, and non-empty filter no longer than 20,000 characters."
  }

  validation {
    condition = alltrue([
      for detection in values(var.detections) :
      contains(["critical", "high", "medium", "low"], lower(detection.severity)) &&
      length(trimspace(detection.owner)) > 0 &&
      can(regex("^https://", detection.runbook_url))
    ])
    error_message = "Every detection requires a supported severity, owner, and HTTPS runbook URL."
  }
}
