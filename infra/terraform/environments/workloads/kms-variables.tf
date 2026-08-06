variable "kms_key_rings" {
  description = "Country-scoped Cloud KMS key rings keyed by stable logical name."
  type = map(object({
    country       = string
    environment   = string
    project_id    = string
    location      = string
    key_ring_name = string
    keys = map(object({
      name                        = string
      rotation_period             = optional(string, "7776000s")
      destroy_scheduled_duration  = optional(string, "2592000s")
      encrypter_decrypter_members = optional(set(string), [])
      viewer_members              = optional(set(string), [])
    }))
  }))
  default = {}

  validation {
    condition     = alltrue([for ring in values(var.kms_key_rings) : contains(["ke", "gh", "za"], ring.country)])
    error_message = "Each KMS key ring must belong to ke, gh, or za."
  }

  validation {
    condition     = alltrue([for ring in values(var.kms_key_rings) : contains(["dev", "stg", "prod"], ring.environment)])
    error_message = "Each KMS key ring environment must be dev, stg, or prod."
  }

  validation {
    condition = length(distinct([
      for ring in values(var.kms_key_rings) : "${ring.project_id}/${ring.location}/${ring.key_ring_name}"
    ])) == length(var.kms_key_rings)
    error_message = "KMS project, location, and key ring name combinations must be unique."
  }

  validation {
    condition = alltrue(flatten([
      for ring in values(var.kms_key_rings) : flatten([
        for key in values(ring.keys) : [
          for member in setunion(key.encrypter_decrypter_members, key.viewer_members) :
          !contains(["allUsers", "allAuthenticatedUsers"], member)
        ]
      ])
    ]))
    error_message = "Cloud KMS IAM must not contain public principals."
  }
}
