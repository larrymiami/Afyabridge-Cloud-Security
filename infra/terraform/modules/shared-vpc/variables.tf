variable "host_project_id" {
  description = "Google Cloud project that hosts the Shared VPC network."
  type        = string
}

variable "network_name" {
  description = "Name of the custom-mode VPC network."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,61}[a-z0-9]$", var.network_name))
    error_message = "network_name must be a valid lowercase Google Cloud network name."
  }
}

variable "routing_mode" {
  description = "Dynamic routing mode for the VPC."
  type        = string
  default     = "REGIONAL"

  validation {
    condition     = contains(["REGIONAL", "GLOBAL"], var.routing_mode)
    error_message = "routing_mode must be REGIONAL or GLOBAL."
  }
}

variable "subnets" {
  description = "Regional subnet inventory keyed by stable logical name."
  type = map(object({
    name                     = string
    region                   = string
    ip_cidr_range            = string
    private_ip_google_access = optional(bool, true)
    purpose                  = optional(string, "PRIVATE")
    role                     = optional(string)
    secondary_ip_ranges      = optional(map(string), {})
    flow_logs = optional(object({
      aggregation_interval = optional(string, "INTERVAL_5_SEC")
      flow_sampling        = optional(number, 0.5)
      metadata             = optional(string, "INCLUDE_ALL_METADATA")
      filter_expr          = optional(string, "true")
    }), {})
  }))

  validation {
    condition = alltrue([
      for subnet in values(var.subnets) : can(cidrnetmask(subnet.ip_cidr_range))
    ])
    error_message = "Every subnet must use a valid IPv4 CIDR range."
  }

  validation {
    condition = length(distinct([
      for subnet in values(var.subnets) : subnet.name
    ])) == length(var.subnets)
    error_message = "Subnet names must be unique."
  }
}

variable "service_project_ids" {
  description = "Service projects attached to this Shared VPC host."
  type        = set(string)
  default     = []
}

variable "router_name" {
  description = "Cloud Router name used for controlled egress."
  type        = string
}

variable "router_region" {
  description = "Region for Cloud Router and Cloud NAT."
  type        = string
}

variable "nat_name" {
  description = "Cloud NAT gateway name."
  type        = string
}

variable "nat_min_ports_per_vm" {
  description = "Minimum NAT ports allocated per VM."
  type        = number
  default     = 64

  validation {
    condition     = var.nat_min_ports_per_vm >= 32
    error_message = "nat_min_ports_per_vm must be at least 32."
  }
}

variable "labels" {
  description = "Network ownership and boundary labels."
  type        = map(string)
  default     = {}
}
