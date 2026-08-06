variable "health_check_ports" {
  description = "TCP ports exposed to Google Cloud health-check probes on tagged backends."
  type        = set(string)
  default     = ["80", "443", "8080"]

  validation {
    condition     = alltrue([for port in var.health_check_ports : can(tonumber(port)) && tonumber(port) >= 1 && tonumber(port) <= 65535])
    error_message = "health_check_ports must contain valid TCP port numbers between 1 and 65535."
  }
}

variable "iap_admin_ports" {
  description = "TCP administration ports reachable only through IAP TCP forwarding on tagged instances."
  type        = set(string)
  default     = ["22"]

  validation {
    condition     = alltrue([for port in var.iap_admin_ports : contains(["22", "3389"], port)])
    error_message = "iap_admin_ports may contain only SSH port 22 or RDP port 3389."
  }
}

variable "health_check_target_tags" {
  description = "Network tags identifying backends that may receive Google Cloud health-check probes."
  type        = set(string)
  default     = ["afyabridge-health-checked"]

  validation {
    condition     = length(var.health_check_target_tags) > 0 && alltrue([for tag in var.health_check_target_tags : can(regex("^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$", tag))])
    error_message = "health_check_target_tags must contain at least one valid Compute Engine network tag."
  }
}

variable "iap_admin_target_tags" {
  description = "Network tags identifying instances that may receive IAP-forwarded administrative traffic."
  type        = set(string)
  default     = ["afyabridge-iap-admin"]

  validation {
    condition     = length(var.iap_admin_target_tags) > 0 && alltrue([for tag in var.iap_admin_target_tags : can(regex("^[a-z]([-a-z0-9]{0,61}[a-z0-9])?$", tag))])
    error_message = "iap_admin_target_tags must contain at least one valid Compute Engine network tag."
  }
}
