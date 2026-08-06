output "buckets" {
  description = "Centralized Cloud Logging bucket inventory."
  value = {
    for key, bucket in google_logging_project_bucket_config.this : key => {
      id               = bucket.id
      name             = bucket.name
      location         = bucket.location
      bucket_id        = bucket.bucket_id
      retention_days   = bucket.retention_days
      enable_analytics = bucket.enable_analytics
      locked           = bucket.locked
    }
  }
}

output "sinks" {
  description = "Aggregated organization sink inventory and writer identities."
  value = {
    for key, sink in google_logging_organization_sink.this : key => {
      id              = sink.id
      name            = sink.name
      destination     = sink.destination
      writer_identity = sink.writer_identity
      disabled        = sink.disabled
    }
  }
}
