variable "edge_project_id" {
  description = "Project that owns the regional external Application Load Balancer resources and Cloud Run service."
  type        = string
}

variable "network_project_id" {
  description = "Shared VPC host project that owns the country network and proxy-only subnet."
  type        = string
}

variable "region" {
  description = "Region for the Cloud Run service and regional external Application Load Balancer."
  type        = string
}

variable "network_id" {
  description = "Self link or ID of the country Shared VPC network."
  type        = string
}

variable "proxy_only_subnet_name" {
  description = "Name of the REGIONAL_MANAGED_PROXY subnet used by the regional load balancer."
  type        = string
}

variable "proxy_only_subnet_cidr" {
  description = "Dedicated CIDR range for the REGIONAL_MANAGED_PROXY subnet."
  type        = string

  validation {
    condition     = can(cidrhost(var.proxy_only_subnet_cidr, 0))
    error_message = "proxy_only_subnet_cidr must be a valid IPv4 CIDR range."
  }
}

variable "cloud_run_service_name" {
  description = "Existing Cloud Run service targeted by the serverless NEG."
  type        = string
}

variable "name_prefix" {
  description = "Stable prefix used for regional edge resource names."
  type        = string
}

variable "network_tier" {
  description = "Network Service Tier for the reserved regional public address."
  type        = string
  default     = "STANDARD"

  validation {
    condition     = contains(["STANDARD", "PREMIUM"], var.network_tier)
    error_message = "network_tier must be STANDARD or PREMIUM."
  }
}

variable "backend_timeout_seconds" {
  description = "Backend request timeout in seconds."
  type        = number
  default     = 30

  validation {
    condition     = var.backend_timeout_seconds >= 1 && var.backend_timeout_seconds <= 86400
    error_message = "backend_timeout_seconds must be between 1 and 86400 seconds."
  }
}

variable "backend_log_sample_rate" {
  description = "Fraction of backend requests written to load-balancer logs."
  type        = number
  default     = 1

  validation {
    condition     = var.backend_log_sample_rate >= 0 && var.backend_log_sample_rate <= 1
    error_message = "backend_log_sample_rate must be between 0 and 1."
  }
}
