variable "project_id" {
  description = "Project that owns the bucket."
  type        = string
}

variable "name" {
  description = "Globally unique bucket name."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9._-]{1,61}[a-z0-9]$", var.name))
    error_message = "Bucket name must be 3-63 characters and use lowercase letters, digits, dots, underscores, or hyphens."
  }
}

variable "location" {
  description = "Bucket region or multi-region."
  type        = string
}

variable "storage_class" {
  description = "Default bucket storage class."
  type        = string
  default     = "STANDARD"

  validation {
    condition     = contains(["STANDARD", "NEARLINE", "COLDLINE", "ARCHIVE"], var.storage_class)
    error_message = "storage_class must be STANDARD, NEARLINE, COLDLINE, or ARCHIVE."
  }
}

variable "kms_key_name" {
  description = "Optional default CMEK CryptoKey resource name."
  type        = string
  default     = null
}

variable "versioning_enabled" {
  description = "Retain noncurrent object generations."
  type        = bool
  default     = true
}

variable "soft_delete_retention_seconds" {
  description = "Soft-delete retention duration in seconds. Set to 0 to disable."
  type        = number
  default     = 604800

  validation {
    condition     = var.soft_delete_retention_seconds == 0 || (var.soft_delete_retention_seconds >= 604800 && var.soft_delete_retention_seconds <= 7776000)
    error_message = "Soft-delete retention must be 0 or between 604800 and 7776000 seconds."
  }
}

variable "retention_period_seconds" {
  description = "Minimum object retention period in seconds. Null disables the bucket retention policy."
  type        = number
  default     = null

  validation {
    condition     = var.retention_period_seconds == null || var.retention_period_seconds >= 86400
    error_message = "retention_period_seconds must be null or at least one day."
  }
}

variable "lock_retention_policy" {
  description = "Permanently lock the retention policy after creation."
  type        = bool
  default     = false
}

variable "lifecycle_rules" {
  description = "Object lifecycle rules keyed by stable logical name."
  type = map(object({
    action = object({
      type          = string
      storage_class = optional(string)
    })
    condition = object({
      age                        = optional(number)
      created_before             = optional(string)
      with_state                 = optional(string)
      num_newer_versions         = optional(number)
      days_since_noncurrent_time = optional(number)
      matches_prefix             = optional(set(string))
      matches_suffix             = optional(set(string))
    })
  }))
  default = {}

  validation {
    condition = alltrue([
      for rule in values(var.lifecycle_rules) : contains(["Delete", "SetStorageClass", "AbortIncompleteMultipartUpload"], rule.action.type)
    ])
    error_message = "Lifecycle action type must be Delete, SetStorageClass, or AbortIncompleteMultipartUpload."
  }
}

variable "iam_bindings" {
  description = "Additive bucket IAM members keyed by role. Public principals are rejected."
  type        = map(set(string))
  default     = {}

  validation {
    condition = alltrue(flatten([
      for members in values(var.iam_bindings) : [
        for member in members : !contains(["allUsers", "allAuthenticatedUsers"], member)
      ]
    ]))
    error_message = "Bucket IAM must not contain public principals."
  }
}

variable "labels" {
  description = "Bucket labels."
  type        = map(string)
  default     = {}
}

variable "force_destroy" {
  description = "Allow Terraform to delete non-empty buckets."
  type        = bool
  default     = false
}
