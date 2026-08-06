resource "google_kms_key_ring" "this" {
  project  = var.project_id
  location = var.location
  name     = var.key_ring_name
}

resource "google_kms_crypto_key" "this" {
  for_each = var.keys

  name                       = each.value.name
  key_ring                   = google_kms_key_ring.this.id
  purpose                    = each.value.purpose
  rotation_period            = each.value.rotation_period
  destroy_scheduled_duration = each.value.destroy_scheduled_duration
  labels                     = each.value.labels

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_kms_crypto_key_iam_member" "encrypter_decrypters" {
  for_each = merge([
    for key_name, key in var.keys : {
      for member in key.encrypter_decrypter_members : "${key_name}:${member}" => {
        key_name = key_name
        member   = member
      }
    }
  ]...)

  crypto_key_id = google_kms_crypto_key.this[each.value.key_name].id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = each.value.member
}

resource "google_kms_crypto_key_iam_member" "viewers" {
  for_each = merge([
    for key_name, key in var.keys : {
      for member in key.viewer_members : "${key_name}:${member}" => {
        key_name = key_name
        member   = member
      }
    }
  ]...)

  crypto_key_id = google_kms_crypto_key.this[each.value.key_name].id
  role          = "roles/cloudkms.viewer"
  member        = each.value.member
}
