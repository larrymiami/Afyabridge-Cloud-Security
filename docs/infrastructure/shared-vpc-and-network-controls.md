# Shared VPC and network controls

## Purpose

This document records the v0.7C network implementation for the fictional AfyaBridge multi-country health platform. It translates the reviewed network and perimeter architecture into reusable Terraform modules for Kenya, Ghana, and South Africa.

The control state is **implemented and statically validated**. No claim is made that these resources have been applied to a live Google Cloud organization.

## Isolation model

Each country receives its own:

- Shared VPC host project;
- custom-mode VPC network;
- regional application subnets;
- Cloud Router and Cloud NAT;
- firewall rule set;
- private service access allocation;
- private Google API DNS zones;
- Serverless VPC Access connector.

No cross-country VPC peering, shared subnet, shared connector, or overlapping primary address space is declared.

| Country | Application ranges | Serverless connector | Private services |
|---|---|---|---|
| Kenya | `10.10.0.0/20`, `10.10.16.0/20`, `10.10.32.0/20` | `10.10.224.0/28` | `10.10.240.0/20` |
| Ghana | `10.20.0.0/20`, `10.20.16.0/20`, `10.20.32.0/20` | `10.20.224.0/28` | `10.20.240.0/20` |
| South Africa | `10.30.0.0/20`, `10.30.16.0/20`, `10.30.32.0/20` | `10.30.224.0/28` | `10.30.240.0/20` |

The values above are synthetic reference ranges and must be reviewed before deployment.

## Shared VPC controls

The `shared-vpc` module implements:

- custom-mode networking;
- default subnet suppression;
- deletion of automatically created default routes;
- explicit Shared VPC host-project enablement;
- explicit country-scoped service-project attachment;
- regional subnets with Private Google Access;
- VPC Flow Logs enabled by default;
- optional secondary ranges;
- Cloud Router and Cloud NAT;
- NAT logging for errors and translations;
- a route to the restricted Google API virtual IP range.

Service projects are attached only through the country inventory. The module does not discover or attach projects implicitly.

## Firewall policy

The reusable `network-firewall` module creates additive VPC firewall rules and rejects unrestricted public ingress allow rules unless explicitly overridden.

### Ingress

Higher-priority allow rules permit:

1. same-country east-west traffic from declared country subnet ranges;
2. Google Cloud health-check traffic to workloads carrying the approved health-check target tag;
3. IAP TCP forwarding traffic to workloads carrying the approved administrative target tag.

Administrative access is limited to TCP ports `22` and `3389` through the IAP source range. No direct public SSH or RDP allow rule is declared.

A logged, low-priority deny rule rejects unmatched IPv4 ingress.

### Egress

Higher-priority allow rules permit:

1. same-country subnet destinations;
2. DNS to the metadata resolver over TCP and UDP port `53`;
3. HTTPS to the restricted Google API virtual IP range;
4. the country-owned private service access range.

A logged, low-priority deny rule rejects unmatched IPv4 egress.

This is a deny-by-default reference boundary. Production workloads requiring additional external destinations must receive narrow, reviewed exceptions rather than a general internet allow rule.

## Private Google API DNS

The `private-google-dns` module creates country-local private zones associated only with the relevant Shared VPC.

The configured zones direct Google API and container registry names toward the restricted Google API endpoint. The DNS policy is paired with the restricted API route and egress allow rule so name resolution, routing, and firewall policy express the same boundary.

## Private service access

The `private-service-access` module reserves a country-owned internal peering range and creates a Service Networking connection.

The ranges are separated from application subnets and Serverless VPC Access connector ranges. This provides address-space ownership for managed private services without creating cross-country connectivity.

## Serverless VPC Access

The `serverless-vpc-connector` module creates one connector per country using a dedicated `/28` range.

Connector ranges are:

- unique across the inventory;
- validated as `/28` networks;
- included in same-country firewall trust calculations;
- never shared between country networks.

The module exposes instance, machine-type, and throughput controls but does not bind any Cloud Run service. Workload attachment follows in a later deployment slice.

## Observability

The design enables:

- VPC Flow Logs on application subnets;
- Cloud NAT logging;
- firewall logging on explicit fallback deny rules.

Log sinks, retention, alerting, and Security Command Center integration are not implemented in v0.7C.

## Terraform composition

The network root is located at:

```text
infra/terraform/environments/network
```

Reusable modules are located under:

```text
infra/terraform/modules/shared-vpc
infra/terraform/modules/network-firewall
infra/terraform/modules/private-service-access
infra/terraform/modules/private-google-dns
infra/terraform/modules/serverless-vpc-connector
```

Pull-request validation performs formatting, backend-free initialization, and static validation. It does not authenticate to Google Cloud and does not create resources.

## Security properties

The implementation is intended to provide these properties:

- country network boundaries are explicit in code;
- address ranges are unique and reviewable;
- service-project attachment is allowlisted;
- public administrative ingress is absent;
- unmatched ingress and egress are denied and logged;
- Google API access is constrained to the restricted endpoint path;
- managed private-service ranges are country owned;
- serverless connectors do not become shared cross-country transit points;
- network creation does not rely on console defaults.

## Known boundaries

The following remain outside this static implementation:

- live GCP apply and connectivity testing;
- effective firewall evaluation against deployed workloads;
- IPv6 policy;
- hierarchical firewall policies;
- Cloud Armor, load balancers, certificates, and public DNS;
- Cloud Run service attachment and egress-mode validation;
- centralized log routing, retention, detection, and alerting;
- VPC Service Controls;
- partner connectivity, VPN, Interconnect, or private service endpoints;
- runtime proof that cross-country traffic is blocked.

These controls must remain described as **designed or statically validated**, not operationally proven, until reviewed deployment evidence exists.
