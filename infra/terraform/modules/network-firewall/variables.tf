variable "project_id" {
  description = "Shared VPC host project that owns the firewall rules."
  type        = string
}

variable "network_name" {
  description = "VPC network name receiving the firewall rules."
  type        = string
}

variable "allow_public_ingress" {
  description = "Explicit exception switch permitting 0.0.0.0/0 or ::/0 ingress sources."
  type        = bool
  default     = false
}

variable "rules" {
  description = "Firewall rules keyed by stable logical name."
  type = map(object({
    name                    = string
    description             = optional(string)
    direction               = string
    priority                = number
    source_ranges           = optional(set(string), [])
    destination_ranges      = optional(set(string), [])
    source_tags             = optional(set(string), [])
    target_tags             = optional(set(string), [])
    source_service_accounts = optional(set(string), [])
    target_service_accounts = optional(set(string), [])
    disabled                = optional(bool, false)
    enable_logging          = optional(bool, true)
    allow = optional(list(object({
      protocol = string
      ports    = optional(set(string), [])
    })), [])
    deny = optional(list(object({
      protocol = string
      ports    = optional(set(string), [])
    })), [])
  }))

  validation {
    condition = alltrue([
      for rule in values(var.rules) : contains(["INGRESS", "EGRESS"], rule.direction)
    ])
    error_message = "Firewall direction must be INGRESS or EGRESS."
  }

  validation {
    condition = alltrue([
      for rule in values(var.rules) : (length(rule.allow) > 0) != (length(rule.deny) > 0)
    ])
    error_message = "Each firewall rule must define exactly one of allow or deny."
  }

  validation {
    condition = alltrue([
      for rule in values(var.rules) : rule.priority >= 0 && rule.priority <= 65535
    ])
    error_message = "Firewall priority must be between 0 and 65535."
  }

  validation {
    condition = var.allow_public_ingress || alltrue([
      for rule in values(var.rules) :
      rule.direction != "INGRESS" || length(setintersection(rule.source_ranges, ["0.0.0.0/0", "::/0"])) == 0
    ])
    error_message = "Public ingress ranges require allow_public_ingress to be explicitly enabled."
  }
}
