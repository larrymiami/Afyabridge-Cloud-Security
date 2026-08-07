terraform {
  required_version = "~> 1.15.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.42.0"
    }
  }
}

provider "google" {
  project = var.quota_project_id
  region  = var.default_region
}
