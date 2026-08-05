variable "parent" {
  description = "Folder resource name in folders/123456789 format."
  type        = string

  validation {
    condition     = can(regex("^folders/[0-9]+$", var.parent))
    error_message = "parent must use folders/<numeric-id>."
  }
}

variable "boolean_policies" {
  description = "Boolean organization constraints keyed without the constraints/ prefix."
  type        = map(bool)
}
