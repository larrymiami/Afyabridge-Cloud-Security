variable "serverless_connectors" {
  description = "Country-isolated Serverless VPC Access connectors keyed by country token."
  type = map(object({
    name           = string
    region         = string
    ip_cidr_range  = string
    machine_type   = optional(string, "e2-micro")
    min_instances  = optional(number, 2)
    max_instances  = optional(number, 3)
    min_throughput = optional(number, 200)
    max_throughput = optional(number, 300)
  }))

  validation {
    condition     = alltrue([for country in keys(var.serverless_connectors) : contains(["ke", "gh", "za"], country)])
    error_message = "serverless_connectors may contain only ke, gh, and za."
  }

  validation {
    condition     = alltrue([for connector in values(var.serverless_connectors) : can(cidrhost(connector.ip_cidr_range, 0)) && tonumber(split("/", connector.ip_cidr_range)[1]) == 28])
    error_message = "Each serverless connector must use a valid IPv4 /28 CIDR."
  }

  validation {
    condition     = length(distinct([for connector in values(var.serverless_connectors) : connector.ip_cidr_range])) == length(var.serverless_connectors)
    error_message = "Serverless connector CIDR ranges must be unique across countries."
  }

  validation {
    condition     = alltrue([for country in keys(var.serverless_connectors) : contains(keys(var.country_networks), country)])
    error_message = "Each serverless connector must map to a configured country network."
  }
}
