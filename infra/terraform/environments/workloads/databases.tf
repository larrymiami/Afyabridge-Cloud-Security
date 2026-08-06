module "postgres_instances" {
  for_each = var.postgres_instances

  source = "../../modules/cloud-sql-postgres"

  project_id                     = each.value.project_id
  region                         = each.value.region
  instance_name                  = each.value.instance_name
  database_version               = each.value.database_version
  tier                           = each.value.tier
  availability_type              = each.value.availability_type
  private_network                = each.value.private_network
  kms_key_name                   = each.value.kms_key_name
  disk_type                      = each.value.disk_type
  disk_size_gb                   = each.value.disk_size_gb
  backup_start_time              = each.value.backup_start_time
  retained_backups               = each.value.retained_backups
  transaction_log_retention_days = each.value.transaction_log_retention_days
  maintenance_day                = each.value.maintenance_day
  maintenance_hour               = each.value.maintenance_hour
  database_flags                 = each.value.database_flags
  deletion_protection            = each.value.deletion_protection

  labels = {
    country     = each.value.country
    environment = each.value.environment
    managed_by  = "terraform"
    service     = "cloud-sql-postgres"
  }
}
