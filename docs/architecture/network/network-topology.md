# Network Topology

## Status

**Designed**

## Purpose

This document defines the logical network topology for AfyaBridge across shared services, country-specific production environments, shared non-production environments, and external trust zones.

It describes network boundaries and permitted connectivity. Detailed IP ranges, firewall rules, routes, and Terraform resources are deferred to later documents and implementation phases.

## Topology summary

AfyaBridge uses separate network domains for:

- shared security and observability services;
- shared delivery and artifact services;
- Kenya production;
- Ghana production;
- South Africa production;
- shared staging;
- shared development;
- restricted sandbox workloads.

Each production country receives an independent Shared VPC host project and country-specific service projects. Production country VPCs are not peered with one another and do not exchange routes directly.

Shared services consume logs, security signals, artifacts, and approved control-plane requests through explicit service interfaces. They do not provide general forwarding between country environments.

## Logical zones

| Zone | Exposure | Primary contents | Default connectivity |
|---|---|---|---|
| Public edge | Internet-facing | load balancers, WAF policy, TLS termination | Internet to approved frontends only |
| Application | Private workload connectivity | APIs, web backends, sync services, workers | Approved edge and service paths |
| Data | Private | databases, caches, queues, storage access paths | Approved application identities and paths |
| Operations | Private and restricted | connectors, monitoring agents, controlled maintenance services | Security and operations paths only |
| Shared security | Private control plane | log processing, detections, asset and posture services | Receives approved telemetry; no transitive forwarding |
| Shared delivery | Restricted control plane | CI/CD integration, artifacts, deployment services | Deployment paths scoped by environment and country |
| Administration | Identity-aware | privileged operator entry points | Temporary authorized sessions only |
| External integration | Untrusted or semi-trusted | vendors, partners, webhooks, messaging providers | Explicit endpoints and allowlisted flows only |

## Production country model

Each production country has:

- one Shared VPC host project;
- application, data, and operations service projects;
- dedicated subnets and secondary ranges;
- independent firewall policy attachments;
- independent routes and egress paths;
- country-specific logging and monitoring context;
- no direct route to another country production VPC.

A compromise in one production country must not create a network path into another country environment.

## Non-production model

Development and staging are shared initially but use separate VPCs, service projects, deployment identities, routes, and egress controls.

Shared non-production does not imply unrestricted workload communication. Country-aware application and data boundaries remain enforced through subnetting, firewall policy, service identity, and application authorization.

Non-production cannot initiate traffic to production networks.

## Public ingress path

The intended public request path is:

1. DNS resolves an approved AfyaBridge hostname.
2. Traffic reaches a managed external HTTPS load balancer.
3. TLS, edge policy, rate controls, and web application protection are applied.
4. Only approved origins receive traffic.
5. The application authenticates the requester and enforces authorization.
6. Request, edge, and application security events are logged.

Workload origins are not exposed directly to the internet where a managed edge path is supported.

## Cloud Run connectivity assumptions

Cloud Run is treated as an application runtime rather than a network security boundary.

For services requiring VPC access:

- outbound private connectivity uses an approved VPC egress mechanism;
- ingress is restricted to the intended load balancer, internal callers, or authenticated service path;
- service-to-service access requires workload identity and application-level authorization;
- connectors and direct-VPC attachments are separated by environment and country;
- production services do not reuse non-production connectors or subnets.

Exact runtime connectivity mode will be selected during implementation based on supported platform behavior and test evidence.

## Private managed-service access

Managed databases, caches, queues, and supported Google APIs should use private access paths where practical.

Controls include:

- private IP or private service connectivity where supported;
- restricted DNS resolution;
- no public database listeners by default;
- service identity authentication;
- country and environment-specific endpoints;
- route and firewall restrictions;
- logging of administrative and data-plane access where available.

Private addressing does not replace authentication, authorization, or encryption.

## East-west traffic

Internal traffic is denied unless required by an approved service dependency.

Permitted flows must identify:

- source workload identity;
- source environment and country;
- destination service;
- protocol and port;
- business purpose;
- data classification;
- owner;
- review or expiry condition.

Broad subnet-to-subnet allow rules are prohibited for production except for documented platform dependencies that cannot be expressed more narrowly.

## North-south traffic

North-south controls cover:

- internet ingress through the managed edge;
- controlled outbound internet access;
- partner and vendor integrations;
- administrative access;
- approved hybrid or private connectivity introduced later.

No production workload receives unrestricted inbound internet access or an unmanaged public IP by default.

## Routing model

Routing is owned by the networking function and managed through reviewed infrastructure code.

The model prohibits:

- transitive routing between production countries;
- non-production routes into production;
- ad hoc custom routes created by workload teams;
- route export from shared services that creates unintended connectivity;
- default routes that bypass approved egress controls;
- overlapping address ranges across connected environments.

Route changes affecting production require explicit security and network review.

## Firewall policy model

Firewall controls are layered:

1. organization or folder-level hierarchical policies for universal guardrails;
2. Shared VPC-level policies for environment and country rules;
3. workload-specific rules for approved dependencies;
4. application and identity controls at the service layer.

Baseline controls include:

- deny unsolicited inbound traffic;
- prohibit public management ports;
- restrict lateral movement;
- log high-risk allow and deny rules;
- prohibit overly broad source ranges in production;
- require ownership and justification metadata;
- detect rule drift and expired exceptions.

## Shared-service connectivity

Shared security and operations services may receive:

- logs;
- metrics;
- traces;
- asset metadata;
- findings;
- approved health signals.

Shared delivery services may provide:

- signed artifacts;
- controlled deployment calls;
- DNS and certificate operations;
- approved platform automation.

These flows do not authorize shared services to initiate arbitrary workload traffic or inspect country data beyond their documented function.

## Administrative access

Administrative access must use identity-aware, audited, and temporary paths.

The design prohibits routine exposure of SSH, RDP, database administration, or internal dashboards to the public internet.

Emergency access follows the privileged-access architecture and must not introduce a permanent open management path.

## Logging expectations

The topology must support:

- VPC flow logs for selected production and high-risk subnets;
- firewall rule logging for security-relevant rules;
- load-balancer and WAF logs;
- Cloud NAT or equivalent egress logs;
- DNS query logs where justified;
- private connectivity and endpoint audit events;
- route, firewall, subnet, and policy change logs;
- correlation with workload and human identities.

Logging scope and sampling must balance security evidence, sensitive-data minimization, and cost.

## Prohibited connectivity

The following are prohibited by default:

- direct production-country-to-production-country routing;
- development or staging access to production data services;
- public database endpoints;
- unrestricted `0.0.0.0/0` ingress to workload services;
- unrestricted workload egress;
- broad administrative firewall rules;
- shared bastions serving all environments;
- partner connectivity without a named owner, scope, expiry, and monitoring;
- network paths that bypass application authorization.

## Validation requirements

Implementation must demonstrate:

- no direct routes between country production VPCs;
- no non-production routes into production;
- only approved public entry points;
- private data-service reachability from authorized workloads only;
- denied unauthorized east-west flows;
- controlled and attributable egress;
- administrative ports unavailable from the public internet;
- firewall, flow, edge, and route-change logs reaching approved destinations;
- infrastructure drift detection for network resources.
