output "postgres_instances" {
  description = "Country-scoped Cloud SQL PostgreSQL inventory."
  value = {
    for key, instance in module.postgres_instances : key => {
      instance_name      = instance.instance_name
      connection_name    = instance.connection_name
      private_ip_address = instance.private_ip_address
      self_link          = instance.self_link
      project_id         = var.postgres_instances[key].project_id
      region             = var.postgres_instances[key].region
      country            = var.postgres_instances[key].country
      environment        = var.postgres_instances[key].environment
    }
  }
}
