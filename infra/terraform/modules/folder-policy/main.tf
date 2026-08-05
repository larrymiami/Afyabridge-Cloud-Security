resource "google_org_policy_policy" "boolean" {
  for_each = var.boolean_policies

  name   = "${var.parent}/policies/${each.key}"
  parent = var.parent

  spec {
    rules {
      enforce = each.value
    }
  }
}
