variable "monitoring_notification_channels" {
  description = "Reviewed Cloud Monitoring notification channels."
  type = map(object({
    display_name = string
    type         = string
    labels       = map(string)
    enabled      = optional(bool, true)
    description  = optional(string, "")
  }))
  default = {}
}

variable "monitoring_alerts_enabled" {
  description = "Enable the initial metric alert policies after live metric and threshold review."
  type        = bool
  default     = false
}

variable "monitoring_runbook_base_url" {
  description = "HTTPS base URL for operational monitoring runbooks."
  type        = string
  default     = "https://github.com/larrymiami/Afyabridge-Cloud-Security/tree/main/docs/runbooks"

  validation {
    condition     = can(regex("^https://", var.monitoring_runbook_base_url))
    error_message = "monitoring_runbook_base_url must use HTTPS."
  }
}
