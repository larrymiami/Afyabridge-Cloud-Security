variable "project_id" {
  description = "Project that owns the private DNS zones."
  type        = string
}

variable "network_id" {
  description = "VPC network resource ID authorized to use the zones."
  type        = string
}

variable "zone_prefix" {
  description = "Stable prefix used for managed-zone names."
  type        = string
}
