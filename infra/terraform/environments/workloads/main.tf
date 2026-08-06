module "artifact_repositories" {
  for_each = var.artifact_repositories

  source = "../../modules/artifact-registry"

  project_id             = each.value.project_id
  location               = each.value.location
  repository_id          = each.value.repository_id
  description            = each.value.description
  kms_key_name           = each.value.kms_key_name
  immutable_tags         = each.value.immutable_tags
  cleanup_policy_dry_run = each.value.cleanup_policy_dry_run
  cleanup_policies       = each.value.cleanup_policies
  reader_members         = each.value.reader_members
  writer_members         = each.value.writer_members

  labels = {
    country     = each.value.country
    environment = each.value.environment
    managed_by  = "terraform"
    service     = "artifact-registry"
  }
}
