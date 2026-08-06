variable "postgres_instances" {
  description = "Country-scoped Cloud SQL for PostgreSQL instances keyed by stable logical name."
  type = map(object({
    country                        = string
    environment                    = string
    project_id                     = string
    region                         = string
    instance_name                  = string
    database_version               = optional(string, "POSTGRES_16")
    tier                           = string
    availability_type              = optional(string, "REGIONAL")
    private_network                = string
    kms_key_name                   = optional(string)
    disk_type                      = optional(string, "PD_SSD")
    disk_size_gb                   = optional(number, 50)
    backup_start_time              = optional(string, "02:00")
    retained_backups               = optional(number, 14)
    transaction_log_retention_days = optional(number, 7)
    maintenance_day                = optional(number, 7)
    maintenance_hour               = optional(number, 3)
    database_flags                 = optional(map(string), {})
    deletion_protection            = optional(bool, true)
  }))
  default = {}

  validation {
    condition     = alltrue([for instance in values(var.postgres_instances) : contains(["ke", "gh", "za"], instance.country)])
    error_message = "Each PostgreSQL instance must belong to ke, gh, or za."
  }

  validation {
    condition     = alltrue([for instance in values(var.postgres_instances) : contains(["dev", "stg", "prod"], instance.environment)])
    error_message = "Each PostgreSQL instance environment must be dev, stg, or prod."
  }

  validation {
    condition = length(distinct([
      for instance in values(var.postgres_instances) : "${instance.project_id}/${instance.instance_name}"
    ])) == length(var.postgres_instances)
    error_message = "Cloud SQL project and instance-name combinations must be unique."
  }

  validation {
    condition     = alltrue([for instance in values(var.postgres_instances) : instance.deletion_protection])
    error_message = "All managed PostgreSQL instances must enable deletion protection."
  }
}
