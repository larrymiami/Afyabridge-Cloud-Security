output "state_bucket_name" {
  description = "Protected GCS bucket used by the bootstrap root and intended for later Terraform state after separately reviewed backend IAM is added."
  value       = google_storage_bucket.terraform_state.name
}

output "state_kms_key_id" {
  description = "Cloud KMS key protecting Terraform state objects."
  value       = google_kms_crypto_key.terraform_state.id
}

output "terraform_service_account_email" {
  description = "Non-human Terraform execution identity."
  value       = google_service_account.terraform.email
}
