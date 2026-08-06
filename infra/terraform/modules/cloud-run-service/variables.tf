variable "project_id" {
  description = "Project that owns the Cloud Run service."
  type        = string
}

variable "location" {
  description = "Cloud Run service region."
  type        = string
}

variable "service_name" {
  description = "Cloud Run service name."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,48}[a-z0-9]$", var.service_name))
    error_message = "service_name must use lowercase letters, digits, and hyphens and be no more than 50 characters."
  }
}

variable "runtime_service_account_id" {
  description = "Account ID for the dedicated runtime service account."
  type        = string
}

variable "runtime_service_account_display_name" {
  description = "Display name for the runtime service account."
  type        = string
}

variable "image" {
  description = "Immutable container image reference. Prefer a digest-pinned Artifact Registry image."
  type        = string

  validation {
    condition     = strcontains(var.image, "@sha256:")
    error_message = "Cloud Run images must be pinned by sha256 digest."
  }
}

variable "container_port" {
  description = "Container listening port."
  type        = number
  default     = 8080
}

variable "ingress" {
  description = "Cloud Run ingress mode."
  type        = string
  default     = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  validation {
    condition = contains([
      "INGRESS_TRAFFIC_INTERNAL_ONLY",
      "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"
    ], var.ingress)
    error_message = "Public Cloud Run ingress is not permitted by this module."
  }
}

variable "vpc_connector" {
  description = "Fully qualified Serverless VPC Access connector name."
  type        = string
}

variable "vpc_egress" {
  description = "Traffic routed through the VPC connector."
  type        = string
  default     = "ALL_TRAFFIC"

  validation {
    condition     = contains(["ALL_TRAFFIC", "PRIVATE_RANGES_ONLY"], var.vpc_egress)
    error_message = "vpc_egress must be ALL_TRAFFIC or PRIVATE_RANGES_ONLY."
  }
}

variable "environment_variables" {
  description = "Non-secret environment variables."
  type        = map(string)
  default     = {}
}

variable "secret_environment_variables" {
  description = "Secret Manager references keyed by environment variable name."
  type = map(object({
    secret  = string
    version = optional(string, "latest")
  }))
  default = {}
}

variable "cpu" {
  description = "CPU limit."
  type        = string
  default     = "1"
}

variable "memory" {
  description = "Memory limit."
  type        = string
  default     = "512Mi"
}

variable "min_instance_count" {
  description = "Minimum instance count."
  type        = number
  default     = 0
}

variable "max_instance_count" {
  description = "Maximum instance count."
  type        = number
  default     = 10

  validation {
    condition     = var.max_instance_count >= var.min_instance_count && var.max_instance_count > 0
    error_message = "max_instance_count must be positive and not lower than min_instance_count."
  }
}

variable "timeout" {
  description = "Request timeout."
  type        = string
  default     = "300s"
}

variable "invoker_members" {
  description = "Additive identities allowed to invoke the service. Public principals are rejected."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for member in var.invoker_members : !contains(["allUsers", "allAuthenticatedUsers"], member)
    ])
    error_message = "Cloud Run invoker IAM must not contain public principals."
  }
}

variable "runtime_project_roles" {
  description = "Project-level roles granted additively to the runtime service account."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for role in var.runtime_project_roles : startswith(role, "roles/")
    ])
    error_message = "runtime_project_roles entries must be predefined roles."
  }
}

variable "labels" {
  description = "Cloud Run service labels."
  type        = map(string)
  default     = {}
}

variable "deletion_protection" {
  description = "Prevent Terraform from destroying the Cloud Run service."
  type        = bool
  default     = true
}
