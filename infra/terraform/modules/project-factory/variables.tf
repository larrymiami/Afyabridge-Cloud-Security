variable "project_id" {
  description = "Globally unique Google Cloud project identifier."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.project_id))
    error_message = "project_id must satisfy Google Cloud project ID naming rules."
  }
}

variable "project_name" {
  description = "Human-readable project name."
  type        = string
}

variable "folder_id" {
  description = "Numeric folder ID that owns the project."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.folder_id))
    error_message = "folder_id must contain digits only."
  }
}

variable "billing_account_id" {
  description = "Billing account attached to the project."
  type        = string
  sensitive   = true
}

variable "country" {
  description = "Country isolation token."
  type        = string

  validation {
    condition     = contains(["ke", "gh", "za", "global"], var.country)
    error_message = "country must be ke, gh, za, or global."
  }
}

variable "environment" {
  description = "Deployment environment."
  type        = string

  validation {
    condition     = contains(["dev", "stg", "prod", "shared"], var.environment)
    error_message = "environment must be dev, stg, prod, or shared."
  }
}

variable "service" {
  description = "Primary service or project purpose."
  type        = string
}

variable "owner" {
  description = "Accountable team slug."
  type        = string
}

variable "cost_center" {
  description = "Cost allocation identifier."
  type        = string
}

variable "data_classification" {
  description = "Highest data classification permitted in the project."
  type        = string

  validation {
    condition     = contains(["public", "internal", "confidential", "restricted"], var.data_classification)
    error_message = "data_classification must use the approved classification vocabulary."
  }
}

variable "activate_apis" {
  description = "Google Cloud APIs enabled in the project."
  type        = set(string)
  default     = []
}

variable "deletion_policy" {
  description = "Project deletion behavior. PREVENT is required outside disposable test fixtures."
  type        = string
  default     = "PREVENT"

  validation {
    condition     = contains(["PREVENT", "ABANDON", "DELETE"], var.deletion_policy)
    error_message = "deletion_policy must be PREVENT, ABANDON, or DELETE."
  }
}

variable "additional_labels" {
  description = "Additional non-authoritative labels."
  type        = map(string)
  default     = {}
}
