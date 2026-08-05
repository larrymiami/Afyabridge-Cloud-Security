locals {
  mandatory_labels = {
    application = "afyabridge"
    component   = "terraform-bootstrap"
    environment = "shared"
    managed_by  = "terraform"
    data_class  = "internal"
  }

  labels = merge(local.mandatory_labels, var.labels)
}

resource "google_project_service" "required" {
  for_each = toset([
    "cloudkms.googleapis.com",
    "iam.googleapis.com",
    "storage.googleapis.com",
  ])

  project            = var.bootstrap_project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_kms_key_ring" "terraform_state" {
  name     = "afyabridge-terraform-state"
  location = var.region
  project  = var.bootstrap_project_id

  depends_on = [google_project_service.required]
}

resource "google_kms_crypto_key" "terraform_state" {
  name            = "terraform-state"
  key_ring        = google_kms_key_ring.terraform_state.id
  rotation_period = "7776000s"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account" "terraform" {
  project      = var.bootstrap_project_id
  account_id   = var.terraform_service_account_id
  display_name = "AfyaBridge Terraform deployer"
  description  = "Non-human execution identity for reviewed AfyaBridge Terraform deployments."

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket" "terraform_state" {
  project                     = var.bootstrap_project_id
  name                        = var.state_bucket_name
  location                    = var.region
  storage_class               = "STANDARD"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  labels                      = local.labels

  versioning {
    enabled = true
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.terraform_state.id
  }

  retention_policy {
    retention_period = var.state_retention_days * 86400
    is_locked        = false
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [google_project_service.required]
}

resource "google_storage_bucket_iam_member" "terraform_state_object_admin" {
  bucket = google_storage_bucket.terraform_state.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.terraform.email}"
}

resource "google_kms_crypto_key_iam_member" "terraform_state_encrypter" {
  crypto_key_id = google_kms_crypto_key.terraform_state.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = "serviceAccount:${google_service_account.terraform.email}"
}
