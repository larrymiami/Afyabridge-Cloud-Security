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
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
  ])

  project            = var.bootstrap_project_id
  service            = each.value
  disable_on_destroy = false
}

resource "google_project_service" "storage" {
  project            = var.bootstrap_project_id
  service            = "storage.googleapis.com"
  disable_on_destroy = false
}

moved {
  from = google_project_service.required["storage.googleapis.com"]
  to   = google_project_service.storage
}

data "google_storage_project_service_account" "gcs" {
  project = var.bootstrap_project_id

  depends_on = [
    google_project_service.storage,
  ]
}

resource "google_kms_key_ring" "terraform_state" {
  name     = "afyabridge-terraform-state"
  location = var.region
  project  = var.bootstrap_project_id

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [
    google_project_service.required["cloudkms.googleapis.com"],
  ]
}

resource "google_kms_crypto_key" "terraform_state" {
  name            = "terraform-state"
  key_ring        = google_kms_key_ring.terraform_state.id
  rotation_period = "7776000s"
  deletion_policy = "PREVENT"

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_service_account" "terraform" {
  project      = var.bootstrap_project_id
  account_id   = var.terraform_service_account_id
  display_name = "AfyaBridge Terraform deployer"
  description  = "Non-human execution identity for reviewed AfyaBridge Terraform deployments."

  depends_on = [
    google_project_service.required["iam.googleapis.com"],
  ]
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

  soft_delete_policy {
    retention_duration_seconds = 604800
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }

    condition {
      days_since_noncurrent_time = var.state_history_days
      with_state                 = "ARCHIVED"
      send_age_if_zero           = false
    }
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.terraform_state.id
  }

  lifecycle {
    prevent_destroy = true
  }

  depends_on = [
    google_project_service.storage,
    google_kms_crypto_key_iam_member.terraform_state_storage_service_agent,
  ]
}

data "google_iam_policy" "terraform_state_bucket" {
  binding {
    role = "roles/storage.objectAdmin"

    members = [
      "serviceAccount:${google_service_account.terraform.email}",
    ]
  }
}

resource "google_storage_bucket_iam_policy" "terraform_state" {
  bucket      = google_storage_bucket.terraform_state.name
  policy_data = data.google_iam_policy.terraform_state_bucket.policy_data
}

resource "google_kms_crypto_key_iam_member" "terraform_state_storage_service_agent" {
  crypto_key_id = google_kms_crypto_key.terraform_state.id
  role          = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member        = data.google_storage_project_service_account.gcs.member
}
