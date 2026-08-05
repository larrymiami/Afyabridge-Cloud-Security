variable "billing_account_id" {
  description = "Billing account resource ID."
  type        = string
  sensitive   = true
}

variable "project_number" {
  description = "Numeric project number used by the billing budget filter."
  type        = string
}

variable "display_name" {
  description = "Human-readable budget name."
  type        = string
}

variable "currency_code" {
  description = "ISO 4217 currency code."
  type        = string
  default     = "USD"
}

variable "monthly_amount" {
  description = "Monthly budget amount in whole currency units."
  type        = number

  validation {
    condition     = var.monthly_amount > 0
    error_message = "monthly_amount must be greater than zero."
  }
}

variable "threshold_percentages" {
  description = "Spend thresholds expressed as decimal percentages."
  type        = set(number)
  default     = [0.5, 0.8, 1.0]
}

variable "notification_channels" {
  description = "Cloud Monitoring notification channel resource names."
  type        = set(string)
  default     = []
}
