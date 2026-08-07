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

variable "cloud_armor_preview" {
  description = "Whether Cloud Armor WAF and rate-limit rules remain in preview mode instead of enforcing their configured actions."
  type        = bool
  default     = true
}

variable "cloud_armor_waf_sensitivity" {
  description = "OWASP CRS sensitivity used by the preconfigured Cloud Armor WAF rules."
  type        = number
  default     = 1

  validation {
    condition     = var.cloud_armor_waf_sensitivity >= 1 && var.cloud_armor_waf_sensitivity <= 4
    error_message = "cloud_armor_waf_sensitivity must be between 1 and 4."
  }
}

variable "cloud_armor_rate_limit_count" {
  description = "Maximum matching requests per source IP during the configured Cloud Armor rate-limit interval before throttling."
  type        = number
  default     = 300

  validation {
    condition     = var.cloud_armor_rate_limit_count >= 1
    error_message = "cloud_armor_rate_limit_count must be at least 1."
  }
}

variable "cloud_armor_rate_limit_interval_seconds" {
  description = "Cloud Armor rate-limit interval in seconds."
  type        = number
  default     = 60

  validation {
    condition     = contains([1, 10, 30, 60, 120, 180, 240, 300, 600, 900, 1200, 1800, 2700, 3600], var.cloud_armor_rate_limit_interval_seconds)
    error_message = "cloud_armor_rate_limit_interval_seconds must use a Cloud Armor-supported interval."
  }
}

variable "dns_project_id" {
  description = "Project that owns the public Cloud DNS managed zone for this country edge."
  type        = string
}

variable "dns_zone_name" {
  description = "Cloud DNS managed-zone resource name for the country public subdomain."
  type        = string
}

variable "dns_zone_dns_name" {
  description = "DNS suffix delegated to the country public zone, including the trailing dot."
  type        = string

  validation {
    condition     = endswith(var.dns_zone_dns_name, ".")
    error_message = "dns_zone_dns_name must end with a trailing dot."
  }
}

variable "hostname" {
  description = "Public HTTPS hostname routed to the country edge, without a trailing dot."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$", var.hostname)) && !endswith(var.hostname, ".")
    error_message = "hostname must be a lowercase DNS name without a trailing dot."
  }
}

variable "dns_ttl" {
  description = "TTL in seconds for public A and certificate-authorization DNS records."
  type        = number
  default     = 300

  validation {
    condition     = var.dns_ttl >= 60 && var.dns_ttl <= 86400
    error_message = "dns_ttl must be between 60 and 86400 seconds."
  }
}
