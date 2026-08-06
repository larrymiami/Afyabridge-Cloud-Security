variable "project_id" {
  description = "Project that owns the Cloud SQL instance."
  type        = string
}

variable "region" {
  description = "Google Cloud region for the instance."
  type        = string
}

variable "instance_name" {
  description = "Cloud SQL instance name."
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,96}[a-z0-9]$", var.instance_name))
    error_message = "instance_name must use lowercase letters, digits, and hyphens and must start with a letter."
  }
}

variable "database_version" {
  description = "PostgreSQL database version."
  type        = string
  default     = "POSTGRES_16"

  validation {
    condition     = contains(["POSTGRES_15", "POSTGRES_16", "POSTGRES_17"], var.database_version)
    error_message = "database_version must be POSTGRES_15, POSTGRES_16, or POSTGRES_17."
  }
}

variable "tier" {
  description = "Cloud SQL machine tier."
  type        = string
}

variable "availability_type" {
  description = "Zonal or regional availability."
  type        = string
  default     = "REGIONAL"

  validation {
    condition     = contains(["ZONAL", "REGIONAL"], var.availability_type)
    error_message = "availability_type must be ZONAL or REGIONAL."
  }
}

variable "private_network" {
  description = "Shared VPC network self-link used for private services access."
  type        = string
}

variable "kms_key_name" {
  description = "Optional CMEK CryptoKey resource name."
  type        = string
  default     = null
}

variable "disk_type" {
  description = "Persistent disk type."
  type        = string
  default     = "PD_SSD"

  validation {
    condition     = contains(["PD_SSD", "PD_HDD"], var.disk_type)
    error_message = "disk_type must be PD_SSD or PD_HDD."
  }
}

variable "disk_size_gb" {
  description = "Initial storage allocation in GiB."
  type        = number
  default     = 50

  validation {
    condition     = var.disk_size_gb >= 10
    error_message = "disk_size_gb must be at least 10 GiB."
  }
}

variable "backup_start_time" {
  description = "UTC backup start time in HH:MM format."
  type        = string
  default     = "02:00"

  validation {
    condition     = can(regex("^(?:[01][0-9]|2[0-3]):[0-5][0-9]$", var.backup_start_time))
    error_message = "backup_start_time must use 24-hour HH:MM format."
  }
}

variable "retained_backups" {
  description = "Number of retained automated backups."
  type        = number
  default     = 14

  validation {
    condition     = var.retained_backups >= 7 && var.retained_backups <= 365
    error_message = "retained_backups must be between 7 and 365."
  }
}

variable "transaction_log_retention_days" {
  description = "Point-in-time recovery transaction log retention."
  type        = number
  default     = 7

  validation {
    condition     = var.transaction_log_retention_days >= 1 && var.transaction_log_retention_days <= 7
    error_message = "transaction_log_retention_days must be between 1 and 7."
  }
}

variable "maintenance_day" {
  description = "Maintenance day where 1 is Monday and 7 is Sunday."
  type        = number
  default     = 7

  validation {
    condition     = var.maintenance_day >= 1 && var.maintenance_day <= 7
    error_message = "maintenance_day must be between 1 and 7."
  }
}

variable "maintenance_hour" {
  description = "UTC maintenance-window hour."
  type        = number
  default     = 3

  validation {
    condition     = var.maintenance_hour >= 0 && var.maintenance_hour <= 23
    error_message = "maintenance_hour must be between 0 and 23."
  }
}

variable "database_flags" {
  description = "PostgreSQL database flags keyed by flag name."
  type        = map(string)
  default     = {}
}

variable "labels" {
  description = "Instance labels."
  type        = map(string)
  default     = {}
}

variable "deletion_protection" {
  description = "Protect the instance from Terraform deletion."
  type        = bool
  default     = true
}
