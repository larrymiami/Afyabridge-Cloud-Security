resource "google_secret_manager_secret" "this" {
  project             = var.project_id
  secret_id           = var.secret_id
  labels              = var.labels
  version_destroy_ttl = var.version_destroy_ttl
  deletion_protection = var.deletion_protection

  replication {
    user_managed {
      dynamic "replicas" {
        for_each = var.replicas

        content {
          location = replicas.key

          dynamic "customer_managed_encryption" {
            for_each = replicas.value.kms_key_name == null ? [] : [replicas.value.kms_key_name]

            content {
              kms_key_name = customer_managed_encryption.value
            }
          }
        }
      }
    }
  }

  dynamic "topics" {
    for_each = var.rotation == null ? [] : var.rotation.topic_names

    content {
      name = topics.value
    }
  }

  dynamic "rotation" {
    for_each = var.rotation == null ? [] : [var.rotation]

    content {
      next_rotation_time = rotation.value.next_rotation_time
      rotation_period    = rotation.value.rotation_period
    }
  }
}

resource "google_secret_manager_secret_iam_member" "accessors" {
  for_each = var.accessor_members

  project   = var.project_id
  secret_id = google_secret_manager_secret.this.secret_id
  role      = "roles/secretmanager.secretAccessor"
  member    = each.value
}

resource "google_secret_manager_secret_iam_member" "viewers" {
  for_each = var.viewer_members

  project   = var.project_id
  secret_id = google_secret_manager_secret.this.secret_id
  role      = "roles/secretmanager.viewer"
  member    = each.value
}
