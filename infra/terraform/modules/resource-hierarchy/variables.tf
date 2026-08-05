variable "organization_id" {
  description = "Numeric Google Cloud organization ID."
  type        = string
}

variable "shared_folder_name" {
  description = "Display name for the shared-services folder."
  type        = string
  default     = "Shared Services"
}

variable "countries" {
  description = "Country folders and approved environment children."
  type = map(object({
    display_name = string
    environments = set(string)
  }))
}
