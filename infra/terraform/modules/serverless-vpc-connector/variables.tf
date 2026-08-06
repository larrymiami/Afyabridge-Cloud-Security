variable "project_id" {
  description = "Project that owns the Serverless VPC Access connector."
  type        = string
}

variable "name" {
  description = "Connector name."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,23}[a-z0-9]$", var.name))
    error_message = "name must be 2-25 characters, start with a letter, and contain only lowercase letters, digits, or hyphens."
  }
}

variable "region" {
  description = "Region for the connector."
  type        = string
}

variable "network_name" {
  description = "VPC network name in the connector project or Shared VPC host project."
  type        = string
}

variable "ip_cidr_range" {
  description = "Dedicated RFC1918 /28 range for the connector."
  type        = string

  validation {
    condition     = can(cidrhost(var.ip_cidr_range, 0)) && tonumber(split("/", var.ip_cidr_range)[1]) == 28
    error_message = "ip_cidr_range must be a valid IPv4 /28 CIDR."
  }
}

variable "machine_type" {
  description = "Machine type used by connector instances."
  type        = string
  default     = "e2-micro"
}

variable "min_instances" {
  description = "Minimum connector instances."
  type        = number
  default     = 2

  validation {
    condition     = var.min_instances >= 2 && var.min_instances <= 9
    error_message = "min_instances must be between 2 and 9."
  }
}

variable "max_instances" {
  description = "Maximum connector instances."
  type        = number
  default     = 3

  validation {
    condition     = var.max_instances >= 3 && var.max_instances <= 10 && var.max_instances >= var.min_instances
    error_message = "max_instances must be between 3 and 10 and not less than min_instances."
  }
}

variable "min_throughput" {
  description = "Minimum connector throughput in Mbps."
  type        = number
  default     = 200
}

variable "max_throughput" {
  description = "Maximum connector throughput in Mbps."
  type        = number
  default     = 300

  validation {
    condition     = var.max_throughput >= var.min_throughput
    error_message = "max_throughput must not be less than min_throughput."
  }
}
