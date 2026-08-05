output "rule_names" {
  description = "Created firewall rule names keyed by logical rule name."
  value       = { for key, rule in google_compute_firewall.this : key => rule.name }
}
