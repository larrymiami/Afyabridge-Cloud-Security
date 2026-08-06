variable "secrets" {
  description = "Country-scoped Secret Manager inventory keyed by stable logical name."
  type = map(object({
    country             = string
    environment         = string
    project_id          = string
    secret_id           = string
    replicas            = map(object({ kms_key_name = optional(string) }))
    version_destroy_ttl = optional(string, "604800s")
    rotation = optional(object({
      next_rotation_time = string
      rotation_period    = string
      topic_names        = set(string)
    }))
    accessor_members    = optional(set(string), [])
    viewer_members      = optional(set(string), [])
    deletion_protection = optional(bool, true)
  }))
  default = {}

  validation {
    condition     = alltrue([for secret in values(var.secrets) : contains(["ke", "gh", "za"], secret.country)])
    error_message = "Each secret must belong to ke, gh, or za."
  }

  validation {
    condition     = alltrue([for secret in values(var.secrets) : contains(["dev", "stg", "prod"], secret.environment)])
    error_message = "Each secret environment must be dev, stg, or prod."
  }

  validation {
    condition = length(distinct([
      for secret in values(var.secrets) : "${secret.project_id}/${secret.secret_id}"
    ])) == length(var.secrets)
    error_message = "Secret project and secret ID combinations must be unique."
  }

  validation {
    condition = alltrue(flatten([
      for secret in values(var.secrets) : [
        for member in setunion(secret.accessor_members, secret.viewer_members) :
        !contains(["allUsers", "allAuthenticatedUsers"], member)
      ]
    ]))
    error_message = "Secret IAM must not contain public principals."
  }
}
