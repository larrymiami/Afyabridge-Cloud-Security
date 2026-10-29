output "provider_name" {
  value = google_iam_workload_identity_pool_provider.plan.name
}

output "service_account_email" {
  value = google_service_account.plan.email
}

output "review_contract" {
  description = "Desired-state trust and grant contract; not proof of effective live IAM."
  value = {
    provider_disabled = google_iam_workload_identity_pool_provider.plan.disabled
    condition         = google_iam_workload_identity_pool_provider.plan.attribute_condition
    organization_role = google_organization_iam_member.hierarchy_reader.role
    project_role      = google_project_iam_member.quota_consumer.role
    bucket_roles = [
      google_storage_bucket_iam_member.bucket_reader.role,
      google_storage_bucket_iam_member.state_reader.role,
    ]
    state_condition = google_storage_bucket_iam_member.state_reader.condition[0].expression
    federation_role = google_service_account_iam_member.federation.role
  }
}
