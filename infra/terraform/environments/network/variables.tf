variable "quota_project_id" {
  description = "Project used for provider quota and service usage attribution."
  type        = string
}

variable "default_region" {
  description = "Default provider region."
  type        = string
  default     = "africa-south1"
}

variable "country_networks" {
  description = "Country-isolated Shared VPC inventory keyed by country token."
  type = map(object({
    host_project_id     = string
    network_name        = string
    router_name         = string
    router_region       = string
    nat_name            = string
    service_project_ids = set(string)
    subnets = map(object({
      name                     = string
      region                   = string
      ip_cidr_range            = string
      private_ip_google_access = optional(bool, true)
      secondary_ip_ranges      = optional(map(string), {})
      flow_logs = optional(object({
        aggregation_interval = optional(string, "INTERVAL_5_SEC")
        flow_sampling        = optional(number, 0.5)
        metadata             = optional(string, "INCLUDE_ALL_METADATA")
        filter_expr          = optional(string, "true")
      }), {})
    }))
  }))

  validation {
    condition     = alltrue([for country in keys(var.country_networks) : contains(["ke", "gh", "za"], country)])
    error_message = "country_networks may contain only ke, gh, and za."
  }

  validation {
    condition     = length(distinct(flatten([
      for network in values(var.country_networks) : [
        for subnet in values(network.subnets) : subnet.ip_cidr_range
      ]
    ]))) == length(flatten([
      for network in values(var.country_networks) : [
        for subnet in values(network.subnets) : subnet.ip_cidr_range
      ]
    ]))
    error_message = "Primary subnet CIDR ranges must be unique across all country networks."
  }
}
