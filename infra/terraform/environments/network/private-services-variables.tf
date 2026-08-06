variable "private_service_access" {
  description = "Private service access ranges keyed by country token."
  type = map(object({
    address_name  = string
    address       = string
    prefix_length = number
  }))

  validation {
    condition     = alltrue([for country in keys(var.private_service_access) : contains(["ke", "gh", "za"], country)])
    error_message = "private_service_access may contain only ke, gh, and za."
  }

  validation {
    condition     = alltrue([for config in values(var.private_service_access) : can(cidrhost("${config.address}/${config.prefix_length}", 0))])
    error_message = "Each private service access address and prefix must form a valid IPv4 CIDR."
  }
}
