output "key_ring_id" {
  description = "Fully qualified KMS key ring ID."
  value       = google_kms_key_ring.this.id
}

output "crypto_keys" {
  description = "CryptoKey inventory keyed by logical name."
  value = {
    for key, resource in google_kms_crypto_key.this : key => {
      id      = resource.id
      name    = resource.name
      purpose = resource.purpose
    }
  }
}
