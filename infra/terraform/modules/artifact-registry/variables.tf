variable "project_id" {
  description = "Project that owns the Artifact Registry repository."
  type        = string
}

variable "location" {
  description = "Google Cloud region or multi-region for the repository."
  type        = string
}

variable "repository_id" {
  description = "Repository identifier."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{2,62}$", var.repository_id))
    error_message = "repository_id must start with a lowercase letter and contain only lowercase letters, digits, or hyphens."
  }
}

variable "description" {
  description = "Human-readable repository purpose."
  type        = string
}

variable "format" {
  description = "Artifact format."
  type        = string
  default     = "DOCKER"

  validation {
    condition     = contains(["DOCKER", "MAVEN", "NPM", "PYTHON", "APT", "YUM", "GO", "KFP"], var.format)
    error_message = "format must be a supported Artifact Registry format."
  }
}

variable "kms_key_name" {
  description = "Optional CMEK CryptoKey resource name."
  type        = string
  default     = null
}

variable "immutable_tags" {
  description = "Prevent Docker tags from being moved or overwritten."
  type        = bool
  default     = true
}

variable "cleanup_policy_dry_run" {
  description = "Evaluate cleanup policies without deleting artifacts."
  type        = bool
  default     = true
}

variable "cleanup_policies" {
  description = "Repository cleanup policies keyed by stable policy ID."
  type = map(object({
    action = string
    condition = optional(object({
      tag_state             = optional(string)
      tag_prefixes          = optional(set(string))
      version_name_prefixes = optional(set(string))
      package_name_prefixes = optional(set(string))
      older_than            = optional(string)
      newer_than            = optional(string)
    }))
    most_recent_versions = optional(object({
      package_name_prefixes = optional(set(string))
      keep_count            = number
    }))
  }))
  default = {}

  validation {
    condition     = alltrue([for policy in values(var.cleanup_policies) : contains(["DELETE", "KEEP"], policy.action)])
    error_message = "Each cleanup policy action must be DELETE or KEEP."
  }
}

variable "reader_members" {
  description = "Additive IAM members allowed to read artifacts. Public principals are rejected."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for member in var.reader_members : !contains(["allUsers", "allAuthenticatedUsers"], member)
    ])
    error_message = "Artifact Registry reader members must not contain public principals."
  }
}

variable "writer_members" {
  description = "Additive IAM members allowed to publish artifacts. Public principals are rejected."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for member in var.writer_members : !contains(["allUsers", "allAuthenticatedUsers"], member)
    ])
    error_message = "Artifact Registry writer members must not contain public principals."
  }
}

variable "labels" {
  description = "Repository labels."
  type        = map(string)
  default     = {}
}
