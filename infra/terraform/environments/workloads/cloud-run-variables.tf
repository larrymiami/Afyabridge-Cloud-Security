variable "cloud_run_services" {
  description = "Country-scoped Cloud Run services keyed by stable logical name."
  type = map(object({
    country                              = string
    environment                          = string
    project_id                           = string
    location                             = string
    service_name                         = string
    runtime_service_account_id           = string
    runtime_service_account_display_name = string
    image                                = string
    vpc_connector                        = string
    ingress                              = optional(string, "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER")
    vpc_egress                           = optional(string, "ALL_TRAFFIC")
    container_port                       = optional(number, 8080)
    environment_variables                = optional(map(string), {})
    secret_environment_variables = optional(map(object({
      secret  = string
      version = optional(string, "latest")
    })), {})
    cpu                   = optional(string, "1")
    memory                = optional(string, "512Mi")
    min_instance_count    = optional(number, 0)
    max_instance_count    = optional(number, 10)
    timeout               = optional(string, "300s")
    invoker_members       = optional(set(string), [])
    runtime_project_roles = optional(set(string), [])
    deletion_protection   = optional(bool, true)
  }))
  default = {}

  validation {
    condition     = alltrue([for service in values(var.cloud_run_services) : contains(["ke", "gh", "za"], service.country)])
    error_message = "Each Cloud Run service must belong to ke, gh, or za."
  }

  validation {
    condition     = alltrue([for service in values(var.cloud_run_services) : contains(["dev", "stg", "prod"], service.environment)])
    error_message = "Each Cloud Run service environment must be dev, stg, or prod."
  }

  validation {
    condition = length(distinct([
      for service in values(var.cloud_run_services) : "${service.project_id}/${service.location}/${service.service_name}"
    ])) == length(var.cloud_run_services)
    error_message = "Cloud Run project, location, and service-name combinations must be unique."
  }

  validation {
    condition = alltrue(flatten([
      for service in values(var.cloud_run_services) : [
        for member in service.invoker_members : !contains(["allUsers", "allAuthenticatedUsers"], member)
      ]
    ]))
    error_message = "Cloud Run invoker IAM must not contain public principals."
  }

  validation {
    condition     = alltrue([for service in values(var.cloud_run_services) : strcontains(service.image, "@sha256:")])
    error_message = "Every Cloud Run image must be pinned by sha256 digest."
  }
}
