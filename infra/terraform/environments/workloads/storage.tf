module "storage_buckets" {
  for_each = var.storage_buckets

  source = "../../modules/cloud-storage"

  project_id                    = each.value.project_id
  name                          = each.value.name
  location                      = each.value.location
  storage_class                 = each.value.storage_class
  kms_key_name                  = each.value.kms_key_name
  versioning_enabled            = each.value.versioning_enabled
  soft_delete_retention_seconds = each.value.soft_delete_retention_seconds
  retention_period_seconds      = each.value.retention_period_seconds
  lock_retention_policy         = each.value.lock_retention_policy
  lifecycle_rules               = each.value.lifecycle_rules
  iam_bindings                  = each.value.iam_bindings
  force_destroy                 = each.value.force_destroy

  labels = {
    country     = each.value.country
    environment = each.value.environment
    managed_by  = "terraform"
    service     = "cloud-storage"
  }
}
