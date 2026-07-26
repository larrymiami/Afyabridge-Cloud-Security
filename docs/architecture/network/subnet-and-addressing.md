# Subnet and Addressing Strategy

## Purpose

This document defines the private IP allocation model for AfyaBridge networks. The design provides deterministic country and environment boundaries, avoids accidental overlap, supports future connectivity, and makes route intent visible in code review.

## Design principles

1. Production countries receive non-overlapping address blocks.
2. Development and staging do not share production ranges.
3. Subnets are assigned by function rather than by individual application team.
4. Address space is reserved before it is consumed.
5. Peering, private service access, and connector ranges must be planned together.
6. No subnet may be created outside the approved allocation registry.
7. Overlapping ranges are treated as deployment-blocking defects.
8. IP allocation does not replace identity or application authorization.

## Top-level allocation

The following ranges are design allocations, not implemented resources.

| Scope | Reserved CIDR | Purpose |
|---|---:|---|
| Kenya production | `10.40.0.0/16` | Kenya application, data, operations, connector, and administration subnets |
| Ghana production | `10.50.0.0/16` | Ghana application, data, operations, connector, and administration subnets |
| South Africa production | `10.60.0.0/16` | South Africa application, data, operations, connector, and administration subnets |
| Staging | `10.70.0.0/16` | Shared staging with logical country separation |
| Development | `10.80.0.0/16` | Shared development with logical country separation |
| Sandbox | `10.90.0.0/16` | Short-lived restricted experiments |
| Shared infrastructure reservations | `10.100.0.0/16` | Future private integration or platform ranges; no implicit transit role |

## Standard subnet classes

Each environment block is divided into repeatable subnet classes.

| Subnet class | Default size | Intended use |
|---|---:|---|
| Application | `/20` | Serverless connectors, internal application services, and approved compute |
| Data | `/22` | Data-plane clients, proxies, and approved private data access components |
| Operations | `/23` | Monitoring, security collectors, automation, and operational services |
| Connectors | `/24` | Third-party or partner connectivity components requiring dedicated policy |
| Administration | `/25` | Identity-aware administrative proxies or tightly controlled management components |
| Private service allocation | `/20` or larger | Managed-service private connectivity and future growth |
| Serverless connector ranges | `/28` per connector | Dedicated connector ranges; never shared across environments |

Subnet sizes are starting points. Any deviation must document capacity, risk, routing impact, and future expansion.

## Example country layout

For Kenya production:

| Function | Example range |
|---|---:|
| Application | `10.40.0.0/20` |
| Data | `10.40.16.0/22` |
| Operations | `10.40.20.0/23` |
| Connectors | `10.40.22.0/24` |
| Administration | `10.40.23.0/25` |
| Reserved connector ranges | `10.40.24.0/21` |
| Private service allocation | `10.40.32.0/20` |
| Future growth | remaining space in `10.40.0.0/16` |

Equivalent offsets should be used for Ghana and South Africa to keep troubleshooting and policy definitions predictable.

## Regional placement

Subnets are regional. Initial production subnets are expected in the approved production region defined by the landing-zone region strategy.

A second-region subnet is not created by default. It requires:

- an approved resilience or recovery design;
- non-overlapping ranges from the same country block;
- documented data-location implications;
- updated routes, firewall policies, and observability;
- tested failover and rollback procedures.

## Secondary ranges

Secondary ranges are reserved only when a platform requires them. They must be:

- unique within the environment;
- declared in the allocation registry;
- sized for expected growth;
- excluded from routes that could create unintended transit;
- reviewed before cluster or service deletion to prevent orphaned allocations.

## Serverless connectivity

Each serverless VPC connector receives a dedicated `/28` range. Connectors must not be shared between:

- production countries;
- production and non-production;
- workloads with materially different egress requirements;
- unrelated trust zones.

Connector creation must identify the owning workload, environment, country, routing mode, and expected destinations.

## Private service allocations

Private service allocations must be reserved before managed services are created. They must not overlap with:

- current subnets;
- future subnet reservations;
- serverless connector ranges;
- partner or hybrid-network ranges;
- recovery-region allocations.

A request for a private allocation must identify the service, owner, environment, country, expected growth, and deletion process.

## Route design

The default routing model is local to each Shared VPC environment. The following are prohibited unless separately approved:

- transitive routing between country production networks;
- non-production routes into production;
- broad custom routes to `0.0.0.0/0` through unmanaged appliances;
- route import or export that collapses country boundaries;
- partner routes that expose unrelated subnet classes.

Custom routes must include an owner, purpose, destination, next hop, expiry where temporary, and validation evidence.

## Allocation registry

The repository should eventually contain a machine-readable allocation registry with at least:

- environment;
- country;
- region;
- network and subnet name;
- primary range;
- secondary ranges;
- purpose;
- owning team;
- lifecycle status;
- reservation date;
- decommission date where applicable.

The registry becomes the source for overlap checks and Terraform validation.

## Validation requirements

Validation must fail when:

- a subnet overlaps any existing or reserved range;
- a connector range is reused;
- production and non-production ranges overlap;
- a subnet is created outside an approved environment block;
- required flow logging is absent;
- an undocumented custom route is introduced;
- a partner route exposes a broader range than approved;
- a deleted resource leaves an allocation without a lifecycle decision.

## Evidence

Implementation evidence should include:

- generated allocation registry;
- overlap-test output;
- Terraform plans showing subnet and route changes;
- flow-log configuration;
- route-table snapshots;
- private-service allocation verification;
- teardown evidence for temporary ranges.

## Status

**Designed.** No subnet, route, connector range, or private allocation is represented as implemented until code, deployment, validation, and evidence exist.
