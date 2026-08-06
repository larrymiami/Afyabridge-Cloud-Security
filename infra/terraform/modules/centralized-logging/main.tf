resource "google_logging_project_bucket_config" "this" {
  for_each = var.buckets

  project          = var.logging_project_id
  location         = each.value.location
  bucket_id        = each.value.bucket_id
  description      = each.value.description
  retention_days   = each.value.retention_days
  enable_analytics = each.value.enable_analytics
  locked           = each.value.locked

  lifecycle {
    prevent_destroy = true
  }
}

resource "google_logging_organization_sink" "this" {
  for_each = var.sinks

  name                = each.value.name
  description         = each.value.description
  org_id              = var.organization_id
  destination         = "logging.googleapis.com/${google_logging_project_bucket_config.this[each.value.bucket_key].name}"
  filter              = each.value.filter
  disabled            = each.value.disabled
  include_children    = each.value.include_children
  intercept_children  = false
  deletion_policy     = "PREVENT"

  dynamic "exclusions" {
    for_each = each.value.exclusions

    content {
      name        = exclusions.key
      description = exclusions.value.description
      filter      = exclusions.value.filter
      disabled    = exclusions.value.disabled
    }
  }
}

resource "google_project_iam_member" "sink_bucket_writer" {
  for_each = var.sinks

  project = var.logging_project_id
  role    = "roles/logging.bucketWriter"
  member  = google_logging_organization_sink.this[each.key].writer_identity
}
