variable "artifact_repositories" {
  description = "Country-scoped Artifact Registry repositories keyed by stable logical name."
  type = map(object({
    country                = string
    environment            = string
    project_id             = string
    location               = string
    repository_id          = string
    description            = string
    kms_key_name           = optional(string)
    immutable_tags         = optional(bool, true)
    cleanup_policy_dry_run = optional(bool, true)
    reader_members         = optional(set(string), [])
    writer_members         = optional(set(string), [])
    cleanup_policies = optional(map(object({
      action = string
      condition = optional(object({
        tag_state             = optional(string)
        tag_prefixes          = optional(set(string))
        version_name_prefixes = optional(set(string))
        package_name_prefixes = optional(set(string))
        older_than            = optional(string)
        newer_than            = optional(string)
      }))
      most_recent_versions = optional(object({
        package_name_prefixes = optional(set(string))
        keep_count            = number
      }))
    })), {})
  }))

  validation {
    condition = alltrue([
      for repository in values(var.artifact_repositories) : contains(["ke", "gh", "za"], repository.country)
    ])
    error_message = "Each Artifact Registry repository must belong to ke, gh, or za."
  }

  validation {
    condition = alltrue([
      for repository in values(var.artifact_repositories) : contains(["dev", "stg", "prod"], repository.environment)
    ])
    error_message = "Each Artifact Registry repository environment must be dev, stg, or prod."
  }

  validation {
    condition = length(distinct([
      for repository in values(var.artifact_repositories) : "${repository.project_id}/${repository.location}/${repository.repository_id}"
    ])) == length(var.artifact_repositories)
    error_message = "Artifact Registry project, location, and repository ID combinations must be unique."
  }

  validation {
    condition = alltrue(flatten([
      for repository in values(var.artifact_repositories) : [
        for member in setunion(repository.reader_members, repository.writer_members) :
        !contains(["allUsers", "allAuthenticatedUsers"], member)
      ]
    ]))
    error_message = "Artifact Registry IAM must not contain public principals."
  }
}
