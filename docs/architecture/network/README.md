# Network and Perimeter Architecture

## Purpose

This section defines the network and perimeter architecture for AfyaBridge Cloud Security. It establishes how public traffic reaches the platform, how workloads communicate internally, how country production environments remain isolated, how managed services are reached privately, and how ingress, egress, administration, and third-party connectivity are governed.

The design assumes a Google Cloud landing zone with separate production country folders, shared non-production environments, central security and logging services, and workload identities defined in earlier phases.

## Design goals

The network architecture must:

1. Separate production country environments.
2. Keep production and non-production connectivity independent.
3. Centralize network policy ownership without creating unrestricted transitive trust.
4. Expose only explicitly approved public services.
5. Keep internal services and managed data services private where supported.
6. Restrict east-west traffic by service, identity, protocol, and purpose.
7. Control outbound internet access and make egress attributable.
8. Prevent direct administrative access from the public internet.
9. Record network-relevant activity for investigation and drift detection.
10. Support repeatable expansion to additional countries.

## Core principles

- No implicit trust based on network location.
- Country production networks do not route directly to one another.
- Shared services do not act as unrestricted bridges between environments.
- Public ingress terminates at managed edge controls before reaching workloads.
- Private workloads do not receive public IP addresses by default.
- Egress is denied or constrained unless a documented dependency requires it.
- Firewall and routing changes are managed as code.
- Service identity remains required even when network paths are private.
- Administrative access uses controlled identity-aware paths rather than open management ports.
- Network architecture status remains **Designed** until code, validation, deployment, and evidence exist.

## Document index

| Document | Status | Purpose |
|---|---|---|
| [`network-topology.md`](./network-topology.md) | Designed | Overall network zones, trust boundaries, and traffic paths |
| [`shared-vpc-model.md`](./shared-vpc-model.md) | Designed | Host projects, service projects, country separation, and ownership |
| `subnet-and-addressing.md` | Planned | Address allocation, subnet classes, growth, and overlap prevention |
| `ingress-and-edge.md` | Planned | Public ingress, load balancing, WAF, TLS, and origin protection |
| `egress-controls.md` | Planned | NAT, proxies, allowlists, attribution, and outbound restrictions |
| `private-service-access.md` | Planned | Private connectivity to managed services and APIs |
| `service-to-service-traffic.md` | Planned | East-west authorization, segmentation, and internal service exposure |
| `administrative-access.md` | Planned | Identity-aware administration, bastion exceptions, and troubleshooting paths |
| `third-party-connectivity.md` | Planned | Partner, vendor, webhook, and private-link governance |
| `dns-and-certificates.md` | Planned | Public and private DNS, certificate ownership, and lifecycle |
| `network-monitoring.md` | Planned | Flow logs, firewall logs, detections, dashboards, and evidence |

## Related architecture

- [`../landing-zone/resource-hierarchy.md`](../landing-zone/resource-hierarchy.md)
- [`../landing-zone/shared-services.md`](../landing-zone/shared-services.md)
- [`../landing-zone/region-strategy.md`](../landing-zone/region-strategy.md)
- [`../identity/workload-identities.md`](../identity/workload-identities.md)
- [`../identity/privileged-access.md`](../identity/privileged-access.md)
- [`../diagrams/network-topology.md`](../diagrams/network-topology.md)
- [`../../security-objectives.md`](../../security-objectives.md)
- [`../../security-control-matrix.md`](../../security-control-matrix.md)
- [`../../threat-model/trust-boundaries.md`](../../threat-model/trust-boundaries.md)

## Initial status

The v0.4 network and perimeter architecture begins in the **Designed** state. No VPC, subnet, route, firewall, load balancer, NAT gateway, private endpoint, DNS zone, certificate, or monitoring control is considered implemented until configuration, tests, and evidence exist.
