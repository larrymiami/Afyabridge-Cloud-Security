module "kms_key_rings" {
  for_each = var.kms_key_rings

  source = "../../modules/cloud-kms"

  project_id    = each.value.project_id
  location      = each.value.location
  key_ring_name = each.value.key_ring_name

  keys = {
    for key_name, key in each.value.keys : key_name => {
      name                        = key.name
      rotation_period             = key.rotation_period
      destroy_scheduled_duration  = key.destroy_scheduled_duration
      encrypter_decrypter_members = key.encrypter_decrypter_members
      viewer_members              = key.viewer_members
      labels = {
        country     = each.value.country
        environment = each.value.environment
        managed_by  = "terraform"
      }
    }
  }
}
