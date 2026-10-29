variable "project_id" {
  description = "Project that owns the GitHub federation resources and deployment identities."
  type        = string
}

variable "plan_project_roles" {
  description = "Reviewed additive project roles for the Terraform plan identity."
  type        = set(string)
  default     = []
}

variable "apply_project_roles" {
  description = "Reviewed additive project roles for the Terraform apply identity."
  type        = set(string)
  default     = []
}

variable "apply_environment" {
  description = "Protected GitHub environment required for apply tokens."
  type        = string
  default     = "production"
}

variable "foundation_plan" {
  description = "Optional dedicated hierarchy planning trust and read-only grants; never enables apply."
  type = object({
    organization_id  = string
    state_bucket     = string
    provider_enabled = optional(bool, false)
  })
  default = null
}
