variable "bootstrap_project_id" {
  description = "Existing Google Cloud project that owns the Terraform bootstrap resources."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.bootstrap_project_id))
    error_message = "bootstrap_project_id must be a valid Google Cloud project ID."
  }
}

variable "region" {
  description = "Google Cloud region for bootstrap KMS resources."
  type        = string
  default     = "africa-south1"
}

variable "state_bucket_name" {
  description = "Globally unique name for the protected Terraform state bucket."
  type        = string

  validation {
    condition     = length(var.state_bucket_name) >= 3 && length(var.state_bucket_name) <= 63
    error_message = "state_bucket_name must contain between 3 and 63 characters."
  }
}

variable "terraform_service_account_id" {
  description = "Account ID for the non-human Terraform execution identity."
  type        = string
  default     = "terraform-deployer"

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{4,28}[a-z0-9]$", var.terraform_service_account_id))
    error_message = "terraform_service_account_id must be a valid service-account ID."
  }
}

variable "state_history_days" {
  description = "Minimum age before lifecycle deletion of noncurrent Terraform state versions."
  type        = number
  default     = 30

  validation {
    condition     = var.state_history_days >= 7
    error_message = "state_history_days must be at least 7 days."
  }
}

variable "labels" {
  description = "Additional labels applied to bootstrap resources."
  type        = map(string)
  default     = {}
}
