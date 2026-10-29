# Separate state prevents the existing federation identities from acquiring
# organization/bucket IAM read permissions just to refresh this extension.
module "foundation_plan" {
  count  = var.foundation_plan == null ? 0 : 1
  source = "../../modules/foundation-plan-wif"

  project_id       = var.project_id
  organization_id  = var.foundation_plan.organization_id
  state_bucket     = var.foundation_plan.state_bucket
  provider_enabled = var.foundation_plan.provider_enabled
}
