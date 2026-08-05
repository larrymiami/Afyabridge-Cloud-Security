resource "google_folder" "shared" {
  display_name = var.shared_folder_name
  parent       = "organizations/${var.organization_id}"

  deletion_protection = true
}

resource "google_folder" "country" {
  for_each = var.countries

  display_name = each.value.display_name
  parent       = "organizations/${var.organization_id}"

  deletion_protection = true
}

resource "google_folder" "environment" {
  for_each = {
    for pair in flatten([
      for country, config in var.countries : [
        for environment in config.environments : {
          key         = "${country}-${environment}"
          country     = country
          environment = environment
        }
      ]
    ]) : pair.key => pair
  }

  display_name = upper(each.value.environment)
  parent       = google_folder.country[each.value.country].name

  deletion_protection = true
}
