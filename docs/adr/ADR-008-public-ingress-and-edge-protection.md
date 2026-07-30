# ADR-008: Public Ingress and Edge Protection

## Status

Accepted — Designed, not implemented.

## Date

2026-07-30

## Context

AfyaBridge exposes public application endpoints for patients, community health workers, clinicians, supervisors, and approved integrations. These endpoints process authentication requests and may provide access to sensitive health and programme data after authorization.

A public endpoint must therefore resist direct-origin bypass, volumetric abuse, common web attacks, credential attacks, malformed requests, untrusted webhook traffic, and accidental exposure of administrative or internal services.

The architecture also spans Kenya, Ghana, and South Africa. Public ingress must support country-aware routing and isolation without making a shared edge an unrestricted bridge between country production environments.

The design must remain credible before infrastructure implementation exists. It must distinguish control intent from deployed capability and avoid claiming that an edge product alone provides application security.

## Decision drivers

- public services require reliable HTTPS exposure;
- workloads must not be directly reachable from arbitrary internet clients;
- edge policy must be centrally governed but country workload access must remain isolated;
- application authentication and authorization remain mandatory behind the edge;
- webhook and partner ingress require stronger verification than source IP alone;
- administrative endpoints must not share the public application path;
- logs must support incident response without recording unnecessary health data;
- deployment must be reproducible through infrastructure code;
- the model should work with managed serverless runtimes such as Cloud Run.

## Decision

AfyaBridge will expose public application traffic through a managed HTTPS edge using controlled DNS, managed certificates, load-balancing or gateway capabilities, web application and denial-of-service protections, and explicit origin restrictions.

The approved public request path is:

```text
client
  -> public DNS
  -> managed HTTPS edge
  -> TLS and certificate validation
  -> WAF, rate, and abuse controls
  -> approved routing rule
  -> restricted country workload origin
  -> application authentication
  -> country, programme, tenant, facility, role, and record authorization
  -> private data service
```

The edge is not an authorization boundary by itself. It reduces exposure and filters traffic, while the destination workload still authenticates the request and enforces application authorization.

## Edge architecture

The edge design will use:

- approved public DNS zones;
- HTTPS-only public endpoints;
- managed certificate lifecycle;
- modern TLS configuration;
- explicit host and path routing;
- web application firewall policies;
- rate limiting and abuse controls;
- volumetric protection provided by the selected managed platform;
- restricted backend or origin reachability;
- request and security logging;
- country-aware backend selection where required;
- separate configuration for production and non-production.

The exact Google Cloud services and Terraform modules are implementation decisions to be validated in later work. This ADR defines the required behavior rather than claiming a deployed product configuration.

## Country isolation

A shared public edge may route traffic to multiple country environments, but it must not create backend-to-backend connectivity.

Controls include:

- separate country backend services or origin definitions;
- distinct workload identities;
- distinct production Shared VPCs;
- host and route rules mapped to intended country workloads;
- no default backend that silently crosses country boundaries;
- country and tenant authorization revalidated by the application;
- logs containing the selected country route and destination;
- failure closed when country routing cannot be determined safely.

A request reaching the wrong country backend must still be denied by application authorization and data-service isolation.

## Origin restrictions

Public clients must not bypass the managed edge and invoke production origins directly.

Origins must use the strongest supported combination of:

- ingress restricted to the selected load balancer, gateway, or managed edge path;
- authenticated invocation between edge components and workload;
- internal or restricted ingress settings;
- firewall or service policy controls where applicable;
- removal of unused default service URLs from documented client flows;
- denial testing against direct-origin addresses and hostnames.

Relying only on an undisclosed origin URL is prohibited.

## Web application controls

Edge protections should cover:

- common injection and protocol attacks;
- malformed headers and methods;
- path traversal and scanning behavior;
- oversized requests;
- credential stuffing and automated login abuse;
- endpoint-specific rate limits;
- IP and geography signals used as risk indicators rather than sole authorization factors;
- temporary incident-response deny rules;
- policy tuning and false-positive review.

Sensitive application actions may require application-layer controls beyond the edge, including step-up authentication, business-rate limits, anti-replay controls, and record-level authorization.

## Webhooks and partner ingress

Webhooks use dedicated endpoints and do not gain trust merely because they enter through the edge.

Required controls include:

- provider-specific signature or message authentication validation;
- timestamp and replay-window checks;
- secret or key rotation;
- strict content type and schema validation;
- body-size limits;
- idempotency and duplicate handling;
- dedicated rate limits;
- source-network allowlists only as supplemental controls;
- quarantine or rejection of unverifiable events;
- minimized payload logging.

## Administrative endpoints

Administrative access is excluded from the public application edge unless a specific managed administrative interface is explicitly approved.

The following remain prohibited on public ingress:

- SSH and RDP;
- direct database or cache administration;
- internal dashboards without identity-aware access;
- infrastructure management APIs exposed by custom workloads;
- unauthenticated health or debug endpoints containing sensitive details.

## Non-production exposure

Development and staging must not reuse production hostnames, certificates, policies, or backends in a way that permits route confusion.

Non-production controls include:

- separate DNS names;
- separate edge configuration or clearly separated routing resources;
- authentication required even when test data is used;
- no production cookies, tokens, or secrets;
- no route from non-production edge components into production origins;
- public exposure limited to demonstrated testing needs.

## Logging and privacy

Edge telemetry should capture:

- timestamp;
- request host, route, method, and response class;
- selected backend and country context;
- WAF or rate-policy decision;
- source network and risk signals;
- correlation identifier;
- origin response status and latency;
- configuration changes.

Logs must not contain authorization headers, session tokens, webhook secrets, raw clinical payloads, or unnecessary personal data.

## Options considered

### Option 1: Directly expose each workload

Rejected.

This reduces infrastructure complexity but creates inconsistent TLS, WAF, routing, rate limiting, logging, and origin-protection controls. It also increases the likelihood of direct-origin bypass and accidental public exposure.

### Option 2: One managed edge with unrestricted origin access

Rejected.

A common edge improves consistency, but unrestricted public origins allow attackers to bypass edge protections. It also weakens confidence in country routing and backend isolation.

### Option 3: Managed edge with restricted origins and application reauthorization

Accepted.

This provides a consistent public control point while preserving workload identity, country isolation, and application-level authorization. It avoids treating the edge as the sole security boundary.

### Option 4: Route all public traffic through a self-managed reverse-proxy fleet

Not selected for the initial architecture.

This can provide flexibility but adds patching, scaling, availability, certificate, logging, and incident-response burden that is unnecessary for the current reference design. It may be reconsidered only for a demonstrated requirement.

## Consequences

### Positive

- Consistent HTTPS, certificate, WAF, rate, and logging controls.
- Reduced direct exposure of workloads.
- Explicit separation between edge filtering and application authorization.
- Central policy governance with country-specific backend isolation.
- Clear ingress path for monitoring and incident response.
- Safer webhook and partner integration model.

### Negative

- Additional configuration and operational dependency at the edge.
- Misconfigured routes or policies can affect multiple public services.
- WAF and rate controls require tuning.
- Origin restriction varies by runtime and must be tested carefully.
- Central edge logs require privacy controls and cost management.

### Risks

- A shared edge could route traffic to the wrong country backend.
- Origin restrictions could be incomplete.
- Broad WAF exceptions could weaken protection.
- Rate limits could deny legitimate health-service usage during peaks.
- Application teams could assume edge acceptance equals authorization.

These risks are addressed through explicit backend mapping, application reauthorization, direct-origin denial tests, policy review, observability, and country-specific negative tests.

## Security implications

This decision supports:

- reduction of public attack surface;
- defense against common web and abuse patterns;
- country isolation;
- authenticated origin access;
- incident-response visibility;
- prohibition of public administrative services;
- layered authentication and authorization.

It does not eliminate the need for secure application code, dependency security, session management, data authorization, workload identity, private data services, monitoring, or incident response.

## Validation requirements

Implementation must demonstrate:

1. HTTPS-only access with valid managed certificates.
2. Direct production origin invocation is denied.
3. Only documented public hosts and routes resolve and forward.
4. WAF and rate policies block representative negative tests.
5. Valid traffic continues without unacceptable false positives.
6. A Kenya route cannot reach Ghana or South Africa origins, and equivalent country tests pass.
7. Application authorization denies a request with invalid country or record scope even after edge acceptance.
8. Webhook signatures, timestamps, schema, and replay controls are enforced.
9. Administrative ports and interfaces are not publicly exposed.
10. Edge logs identify security decisions and destination context without sensitive payload leakage.
11. Configuration drift and manual edge changes are detected.
12. Rollback to a known-good edge policy is tested.

## Related documents

- [`../architecture/network/ingress-and-edge.md`](../architecture/network/ingress-and-edge.md)
- [`../architecture/network/network-topology.md`](../architecture/network/network-topology.md)
- [`../architecture/network/administrative-access.md`](../architecture/network/administrative-access.md)
- [`../architecture/diagrams/ingress-egress-flow.md`](../architecture/diagrams/ingress-egress-flow.md)
- [`ADR-007-shared-vpc-and-country-segmentation.md`](./ADR-007-shared-vpc-and-country-segmentation.md)
- [`../architecture/identity/application-authorization.md`](../architecture/identity/application-authorization.md)

## Review trigger

Review this decision when:

- a new public application or protocol is introduced;
- multi-region active-active ingress is proposed;
- country data-routing obligations change;
- a new edge or gateway platform is selected;
- direct partner connectivity is required;
- application traffic volume or abuse patterns materially change;
- origin restriction cannot be enforced for a selected runtime.
