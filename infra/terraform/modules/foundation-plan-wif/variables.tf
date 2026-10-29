variable "project_id" {
  description = "Existing federation host project, under the reviewed organization."
  type        = string
}

variable "organization_id" {
  description = "Organization whose folder hierarchy the foundation identity may read."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.organization_id))
    error_message = "organization_id must be numeric."
  }
}

variable "state_bucket" {
  description = "Existing uniform-access, CMEK-protected state bucket; no gs:// prefix."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9._-]{1,220}[a-z0-9]$", var.state_bucket))
    error_message = "state_bucket must be a bucket name, not a URL or CEL expression."
  }
}

variable "provider_enabled" {
  description = "Enable trust only after separately reviewing protected environment and IAM checks."
  type        = bool
  default     = false
}
