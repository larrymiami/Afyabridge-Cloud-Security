variable "project_id" {
  description = "Google Cloud project that owns the workload identity pools and deployment service accounts."
  type        = string
}

variable "plan_pool_id" {
  description = "Workload identity pool ID dedicated to Terraform plan jobs."
  type        = string
  default     = "github-terraform-plan"
}

variable "apply_pool_id" {
  description = "Workload identity pool ID dedicated to protected Terraform apply jobs."
  type        = string
  default     = "github-terraform-apply"
}

variable "plan_provider_id" {
  description = "OIDC provider ID used by pull-request and manual plan jobs."
  type        = string
  default     = "github-plan"
}

variable "apply_provider_id" {
  description = "OIDC provider ID used by protected apply jobs."
  type        = string
  default     = "github-apply"
}

variable "github_repository" {
  description = "Trusted GitHub repository in owner/name form."
  type        = string

  validation {
    condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
    error_message = "github_repository must use owner/name form."
  }
}

variable "github_repository_id" {
  description = "Immutable numeric GitHub repository ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.github_repository_id))
    error_message = "github_repository_id must be an immutable numeric ID."
  }
}

variable "github_repository_owner_id" {
  description = "Immutable numeric GitHub repository owner ID."
  type        = string

  validation {
    condition     = can(regex("^[0-9]+$", var.github_repository_owner_id))
    error_message = "github_repository_owner_id must be an immutable numeric ID."
  }
}

variable "plan_base_ref" {
  description = "Pull-request base branch ref accepted by the plan provider."
  type        = string
  default     = "refs/heads/main"
}

variable "apply_ref" {
  description = "Branch ref accepted by the apply provider."
  type        = string
  default     = "refs/heads/main"
}

variable "apply_environment" {
  description = "GitHub environment claim required by the apply provider."
  type        = string
  default     = "production"
}

variable "plan_service_account_id" {
  description = "Account ID for the Terraform plan service account."
  type        = string
  default     = "terraform-plan"
}

variable "apply_service_account_id" {
  description = "Account ID for the Terraform apply service account."
  type        = string
  default     = "terraform-apply"
}

variable "plan_project_roles" {
  description = "Additive project roles granted to the plan service account."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for role in var.plan_project_roles :
      startswith(role, "roles/") && !contains(["roles/owner", "roles/editor"], role)
    ])
    error_message = "Plan roles must use roles/... identifiers and must not include Owner or Editor."
  }
}

variable "apply_project_roles" {
  description = "Additive project roles granted to the apply service account."
  type        = set(string)
  default     = []

  validation {
    condition = alltrue([
      for role in var.apply_project_roles :
      startswith(role, "roles/") && !contains(["roles/owner", "roles/editor"], role)
    ])
    error_message = "Apply roles must use roles/... identifiers and must not include Owner or Editor."
  }
}

variable "disabled" {
  description = "Disable both GitHub OIDC providers without deleting their dedicated pools."
  type        = bool
  default     = false
}
