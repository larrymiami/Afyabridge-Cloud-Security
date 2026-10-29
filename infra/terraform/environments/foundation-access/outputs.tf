output "foundation_plan" {
  description = "Dedicated foundation plan identity and trust, or null while not configured."
  value       = length(module.foundation_plan) == 0 ? null : module.foundation_plan[0]
}
