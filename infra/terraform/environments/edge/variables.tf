variable "quota_project_id" {
  description = "Project used for provider quota and service usage attribution."
  type        = string
}

variable "default_region" {
  description = "Default provider region."
  type        = string
  default     = "africa-south1"
}

variable "country_edges" {
  description = "Country-isolated regional public edge definitions keyed exactly by ke, gh, and za."
  type = map(object({
    edge_project_id         = string
    network_project_id      = string
    region                  = string
    network_id              = string
    proxy_only_subnet_name  = string
    proxy_only_subnet_cidr  = string
    cloud_run_service_name  = string
    name_prefix             = string
    network_tier            = optional(string, "STANDARD")
    backend_timeout_seconds = optional(number, 30)
    backend_log_sample_rate = optional(number, 1)
  }))

  validation {
    condition = (
      length(setsubtract(toset(keys(var.country_edges)), toset(["ke", "gh", "za"]))) == 0 &&
      length(setsubtract(toset(["ke", "gh", "za"]), toset(keys(var.country_edges)))) == 0
    )
    error_message = "country_edges must contain exactly ke, gh, and za."
  }

  validation {
    condition     = length(distinct([for edge in values(var.country_edges) : edge.edge_project_id])) == length(var.country_edges)
    error_message = "Each country edge must use a distinct edge project."
  }

  validation {
    condition     = length(distinct([for edge in values(var.country_edges) : edge.proxy_only_subnet_cidr])) == length(var.country_edges)
    error_message = "Proxy-only subnet CIDRs must be unique across country boundaries."
  }

  validation {
    condition = alltrue([
      for country, edge in var.country_edges :
      strcontains(edge.edge_project_id, "-${country}-") &&
      strcontains(edge.network_project_id, "-${country}-") &&
      strcontains(edge.name_prefix, "-${country}-")
    ])
    error_message = "Country edge, network project, and resource prefix values must carry the matching country token."
  }
}
