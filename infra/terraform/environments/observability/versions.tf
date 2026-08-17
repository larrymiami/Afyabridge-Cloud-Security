terraform {
  required_version = "~> 1.15.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 7.44.0"
    }
  }
}

provider "google" {
  project = var.logging_project_id
}
