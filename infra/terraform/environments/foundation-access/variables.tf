variable "project_id" {
  description = "Existing bootstrap/federation project that will host the dedicated plan identity."
  type        = string
}

variable "foundation_plan" {
  description = "Opt-in dedicated hierarchy planning trust and read-only grants; never enables apply."
  type = object({
    organization_id  = string
    state_bucket     = string
    provider_enabled = optional(bool, false)
  })
  default = null
}
