variable "project_id" {
  description = "Project receiving additive IAM bindings."
  type        = string
}

variable "bindings" {
  description = "IAM members grouped by role."
  type        = map(set(string))

  validation {
    condition = alltrue(flatten([
      for members in values(var.bindings) : [
        for member in members : !startswith(member, "allUsers") && !startswith(member, "allAuthenticatedUsers")
      ]
    ]))
    error_message = "Public IAM principals are not permitted."
  }
}
