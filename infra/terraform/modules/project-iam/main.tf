locals {
  bindings = merge([
    for role, members in var.bindings : {
      for member in members : "${role}|${member}" => {
        role   = role
        member = member
      }
    }
  ]...)
}

resource "google_project_iam_member" "binding" {
  for_each = local.bindings

  project = var.project_id
  role    = each.value.role
  member  = each.value.member
}
