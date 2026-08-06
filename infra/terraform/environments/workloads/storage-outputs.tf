output "storage_buckets" {
  description = "Country-scoped Cloud Storage inventory."
  value = {
    for key, bucket in module.storage_buckets : key => {
      name        = bucket.name
      url         = bucket.url
      self_link   = bucket.self_link
      location    = bucket.location
      project_id  = var.storage_buckets[key].project_id
      country     = var.storage_buckets[key].country
      environment = var.storage_buckets[key].environment
    }
  }
}
