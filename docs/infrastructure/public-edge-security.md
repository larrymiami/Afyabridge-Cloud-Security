# Public edge security

## Status

Implemented and statically validated. No v0.7G edge, DNS, certificate, or Cloud Armor resource has been applied to a live Google Cloud environment.

## Purpose

v0.7G implements the public ingress path for the country-scoped AfyaBridge production workloads while preserving the existing Cloud Run anti-bypass posture. Kenya, Ghana, and South Africa each receive a separate regional external Application Load Balancer and security-policy boundary.

## Country boundary

Each country edge is defined independently with its own edge project, Shared VPC host project, proxy-only subnet, reserved regional public address, Cloud Run serverless NEG, regional backend service, regional URL maps, Cloud Armor policy, DNS zone, DNS authorization, managed certificate, target proxies, and forwarding rules.

Terraform requires exactly the `ke`, `gh`, and `za` country keys and checks country tokens in edge project, network project, and resource prefixes. Proxy-only subnet CIDRs must be unique across countries. These checks reduce accidental cross-country wiring but do not replace live verification of project ownership, routing, or traffic termination.

## Origin protection

The existing Cloud Run workload baseline uses `INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER`. The edge architecture therefore expects public requests to enter through the Application Load Balancer rather than directly through the default Cloud Run service URL.

The regional serverless NEG points to the reviewed Cloud Run service in the same country edge definition. Runtime validation must prove that direct public origin access is unavailable and that requests routed through the load balancer reach only the intended country service.

## Regional Application Load Balancer

The public edge uses a regional external Application Load Balancer per country. Each country has a dedicated `REGIONAL_MANAGED_PROXY` subnet, regional external IPv4 address, serverless NEG, regional backend service, and URL map.

Backend request logging is enabled with a configurable sample rate and defaults to full sampling in the reference configuration.

## Cloud Armor

Each regional backend service is attached to a regional Cloud Armor policy. The baseline includes OWASP CRS 4.22 preconfigured WAF rule families for SQL injection, cross-site scripting, local file inclusion, remote file inclusion, remote code execution, protocol attacks, and scanner detection.

The baseline also includes per-source-IP throttling. WAF and rate-limit rules are in preview mode by default. Preview must remain enabled until representative traffic has been observed, false positives have been reviewed, exceptions are documented, and enforcement is approved independently for each country.

Cloud Armor request-body parsing is configured for JSON and verbose logging is enabled. The default policy rule allows traffic that does not match a higher-priority control.

## HTTPS and certificates

Each country uses a regional Certificate Manager DNS authorization and a regional Google-managed certificate. The certificate is attached to a regional HTTPS target proxy.

The HTTPS listener uses a regional TLS policy with the `MODERN` profile and a minimum TLS version of 1.2. Port 443 and port 80 share the same reserved regional public address. The HTTP URL map performs a permanent HTTP-to-HTTPS redirect and does not forward cleartext requests to the backend.

Certificate provisioning depends on the DNS authorization CNAME being published and visible to Google. Static Terraform validation does not prove certificate issuance or renewal.

## Public DNS

The reference configuration models one public managed zone per country edge and creates an A record from the reviewed application hostname to that country's reserved regional edge address.

The sample configuration uses `example.com` documentation domains only. Real production domains must be selected and delegated separately. The environment validates that the application hostname belongs beneath the configured country DNS zone.

DNS and certificate resources are intentionally country-scoped so a single shared public zone is not required for the three production boundaries.

## Security properties intended by design

The implemented configuration is intended to provide HTTPS-only public ingress, origin bypass resistance, country-scoped public termination, preview-first WAF controls, rate limiting, TLS policy enforcement, managed certificate lifecycle, observable backend requests, and explicit DNS ownership.

These properties remain unproven until deployment tests demonstrate them in a reviewed Google Cloud environment.

## Runtime validation requirements

Live validation must demonstrate correct DNS delegation and resolution, certificate issuance and renewal readiness, TLS 1.2+ negotiation, HTTP-to-HTTPS redirects, Cloud Run origin bypass prevention, correct country backend selection, absence of cross-country routing, Cloud Armor preview matches, WAF enforcement after promotion, throttling behavior, backend logging, rollback behavior, and recovery after configuration changes.
