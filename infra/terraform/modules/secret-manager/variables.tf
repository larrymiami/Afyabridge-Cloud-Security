variable "project_id" {
  description = "Project that owns the secret."
  type        = string
}

variable "secret_id" {
  description = "Secret identifier."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9_-]{1,255}$", var.secret_id))
    error_message = "secret_id must contain only letters, digits, hyphens, or underscores."
  }
}

variable "replicas" {
  description = "User-managed replicas keyed by location, with optional regional CMEK keys."
  type = map(object({
    kms_key_name = optional(string)
  }))

  validation {
    condition     = length(var.replicas) > 0
    error_message = "At least one Secret Manager replica is required."
  }
}

variable "version_destroy_ttl" {
  description = "Delay before destroyed secret versions are permanently removed."
  type        = string
  default     = "604800s"
}

variable "rotation" {
  description = "Optional rotation-notification contract. Secret values are rotated outside Terraform."
  type = object({
    next_rotation_time = string
    rotation_period    = string
    topic_names        = set(string)
  })
  default = null

  validation {
    condition     = var.rotation == null || length(var.rotation.topic_names) > 0
    error_message = "Rotation requires at least one Pub/Sub topic."
  }
}

variable "accessor_members" {
  description = "Additive principals allowed to access secret payloads."
  type        = set(string)
  default     = []

  validation {
    condition     = alltrue([for member in var.accessor_members : !contains(["allUsers", "allAuthenticatedUsers"], member)])
    error_message = "Secret accessors must not contain public principals."
  }
}

variable "viewer_members" {
  description = "Additive principals allowed to inspect secret metadata without reading payloads."
  type        = set(string)
  default     = []

  validation {
    condition     = alltrue([for member in var.viewer_members : !contains(["allUsers", "allAuthenticatedUsers"], member)])
    error_message = "Secret viewers must not contain public principals."
  }
}

variable "deletion_protection" {
  description = "Prevent Terraform from deleting the secret."
  type        = bool
  default     = true
}

variable "labels" {
  description = "Secret labels."
  type        = map(string)
  default     = {}
}
