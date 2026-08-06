output "kms_key_rings" {
  description = "Country-scoped Cloud KMS key inventory."
  value = {
    for key, ring in module.kms_key_rings : key => {
      key_ring_id = ring.key_ring_id
      crypto_keys = ring.crypto_keys
      project_id  = var.kms_key_rings[key].project_id
      location    = var.kms_key_rings[key].location
      country     = var.kms_key_rings[key].country
      environment = var.kms_key_rings[key].environment
    }
  }
}
