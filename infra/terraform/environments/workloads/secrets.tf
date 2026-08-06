module "secrets" {
  for_each = var.secrets

  source = "../../modules/secret-manager"

  project_id          = each.value.project_id
  secret_id           = each.value.secret_id
  replicas            = each.value.replicas
  version_destroy_ttl = each.value.version_destroy_ttl
  rotation            = each.value.rotation
  accessor_members    = each.value.accessor_members
  viewer_members      = each.value.viewer_members
  deletion_protection = each.value.deletion_protection

  labels = {
    country     = each.value.country
    environment = each.value.environment
    managed_by  = "terraform"
    service     = "secret-manager"
  }
}
