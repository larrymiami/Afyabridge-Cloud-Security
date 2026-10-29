# Offline desired-state checks. Mocked provider calls do not validate live IAM.
mock_provider "google" {}

variables {
  project_id = "example-federation-host"
}

run "existing_stack_has_no_foundation_extension" {
  command = plan

  assert {
    condition     = output.foundation_plan == null
    error_message = "Existing federation callers must not silently gain foundation resources."
  }
}

run "foundation_trust_starts_disabled" {
  command = plan

  variables {
    foundation_plan = {
      organization_id = "123456789012"
      state_bucket    = "example-protected-state"
    }
  }

  assert {
    condition     = output.foundation_plan.review_contract.provider_disabled
    error_message = "Foundation OIDC trust must start disabled."
  }

  assert {
    condition     = output.foundation_plan.review_contract.organization_role == "roles/resourcemanager.folderViewer"
    error_message = "Foundation planning must not gain organization write permissions."
  }

  assert {
    condition     = output.foundation_plan.review_contract.project_role == "roles/serviceusage.serviceUsageConsumer"
    error_message = "Host-project grant must remain limited to quota consumption."
  }

  assert {
    condition = toset(output.foundation_plan.review_contract.bucket_roles) == toset([
      "roles/storage.bucketViewer", "roles/storage.objectViewer",
    ])
    error_message = "Foundation planning must not gain state write or IAM administration."
  }

  assert {
    condition     = output.foundation_plan.review_contract.federation_role == "roles/iam.workloadIdentityUser"
    error_message = "Only the dedicated WIF pool may impersonate this identity."
  }

  assert {
    condition     = strcontains(output.foundation_plan.review_contract.state_condition, "/objects/foundation/project-factory/")
    error_message = "Object content reads must remain restricted to the foundation prefix."
  }

  assert {
    condition = alltrue([
      strcontains(output.foundation_plan.review_contract.condition, "assertion.repository_owner_id == \"97871935\""),
      strcontains(output.foundation_plan.review_contract.condition, "assertion.repository_id == \"1310793524\""),
      strcontains(output.foundation_plan.review_contract.condition, "assertion.workflow_ref == \"larrymiami/Afyabridge-Cloud-Security/.github/workflows/terraform-foundation-plan.yml@refs/heads/main\""),
      strcontains(output.foundation_plan.review_contract.condition, "assertion.ref == \"refs/heads/main\""),
      strcontains(output.foundation_plan.review_contract.condition, "assertion.ref_type == \"branch\""),
      strcontains(output.foundation_plan.review_contract.condition, "assertion.event_name == \"workflow_dispatch\""),
      strcontains(output.foundation_plan.review_contract.condition, "assertion.environment == \"foundation-plan\""),
    ])
    error_message = "Exact repository, workflow, branch, event and environment checks are required."
  }
}

run "explicit_review_can_enable_foundation_trust" {
  command = plan

  variables {
    foundation_plan = {
      organization_id  = "123456789012"
      state_bucket     = "example-protected-state"
      provider_enabled = true
    }
  }

  assert {
    condition     = !output.foundation_plan.review_contract.provider_disabled
    error_message = "Reviewed activation must enable only the dedicated provider."
  }
}
