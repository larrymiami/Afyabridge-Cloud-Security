variable "project_id" {
  description = "Project that owns the KMS key ring."
  type        = string
}

variable "location" {
  description = "KMS key ring location."
  type        = string
}

variable "key_ring_name" {
  description = "KMS key ring name."
  type        = string
}

variable "keys" {
  description = "CryptoKeys keyed by stable logical name."
  type = map(object({
    name                       = string
    purpose                    = optional(string, "ENCRYPT_DECRYPT")
    rotation_period            = optional(string, "7776000s")
    destroy_scheduled_duration = optional(string, "2592000s")
    labels                     = optional(map(string), {})
    encrypter_decrypter_members = optional(set(string), [])
    viewer_members              = optional(set(string), [])
  }))

  validation {
    condition = alltrue([
      for key in values(var.keys) : contains(["ENCRYPT_DECRYPT", "MAC", "ASYMMETRIC_SIGN", "ASYMMETRIC_DECRYPT", "RAW_ENCRYPT_DECRYPT"], key.purpose)
    ])
    error_message = "Each key purpose must be supported by Cloud KMS."
  }

  validation {
    condition = alltrue(flatten([
      for key in values(var.keys) : [
        for member in setunion(key.encrypter_decrypter_members, key.viewer_members) :
        !contains(["allUsers", "allAuthenticatedUsers"], member)
      ]
    ]))
    error_message = "Cloud KMS IAM must not contain public principals."
  }
}
