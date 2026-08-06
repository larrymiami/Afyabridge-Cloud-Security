variable "project_id" {
  description = "Google Cloud project that owns the workload identity pool and deployment service accounts."
  type        = string
}

variable "pool_id" {
  description = "Workload identity pool ID."
  type        = string
  default     = "github-actions"

variable "plan_provider_id" {
  description = "OIDC provider ID used by pull-request plan jobs."
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
}

variable "github_repository_id" {
  description = "Immutable numeric GitHub repository ID."
  type        = string
}

variable "github_repository_owner_id" {
  description = "Immutable numeric GitHub repository owner ID."
  type        = string
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
}

variable "apply_project_roles" {
  description = "Additive project roles granted to the apply service account."
  type        = set(string)
  default     = []
}

variable "disabled" {
  description = "Disable both GitHub OIDC providers without deleting the pool."
  type        = bool
  default     = false
}

variable "labels" {
  description = "Labels applied where the resource supports labels."
  type        = map(string)
  default     = {}
}

variable "prevent_destroy" {
  description = "Prevent accidental Terraform destruction of federation resources and deployment identities."
  type        = bool
  default     = true
}

validation {
  condition     = can(regex("^[^/]+/[^/]+$", var.github_repository))
  error_message = "github_repository must use owner/name form."
}

validation {
  condition     = can(regex("^[0-9]+$", var.github_repository_id)) && can(regex("^[0-9]+$", var.github_repository_owner_id))
  error_message = "GitHub repository and owner IDs must be immutable numeric IDs."
}

validation {
  condition = alltrue([
    for role in setunion(var.plan_project_roles, var.apply_project_roles) :
    startswith(role, "roles/")
  ])
  error_message = "Project IAM roles must use roles/... identifiers."
}
