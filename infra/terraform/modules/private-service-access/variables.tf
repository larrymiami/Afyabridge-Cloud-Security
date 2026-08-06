variable "project_id" {
  description = "Shared VPC host project that owns the allocated range."
  type        = string
}

variable "network_id" {
  description = "VPC network resource ID receiving private service access."
  type        = string
}

variable "address_name" {
  description = "Name of the internal peering range."
  type        = string
}

variable "prefix_length" {
  description = "Prefix length of the allocated internal peering range."
  type        = number
  default     = 16

  validation {
    condition     = var.prefix_length >= 16 && var.prefix_length <= 24
    error_message = "prefix_length must be between 16 and 24."
  }
}

variable "address" {
  description = "Optional base address for the allocated range."
  type        = string
  default     = null
}
