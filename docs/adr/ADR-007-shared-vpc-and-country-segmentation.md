# ADR-007: Shared VPC and Country Segmentation

- **Status:** Accepted for design
- **Date:** 2026-07-26
- **Decision owners:** Cloud platform and security architecture
- **Related phase:** v0.4 Network and Perimeter Architecture

## Context

AfyaBridge operates production workloads for Kenya, Ghana, and South Africa. The platform requires central network governance while preserving strong country and environment boundaries.

The network model must support:

- repeatable subnet, route, firewall, DNS, and logging standards;
- separate application, data, operations, connector, and administration zones;
- private access to managed services;
- serverless connectivity;
- controlled public ingress and outbound traffic;
- independent production-country incident containment;
- future country onboarding;
- clear ownership and auditable change control.

A single organization-wide network would simplify central administration but would increase blast radius and make accidental transitive connectivity easier. Fully independent project-owned networks would strengthen local autonomy but duplicate governance and make consistent security controls harder to enforce.

## Decision

AfyaBridge will use **separate Shared VPC host projects for each production country**, with separate Shared VPC environments for staging and development.

The initial model is:

```text
Kenya production host project
  -> Kenya application, data, and operations service projects

Ghana production host project
  -> Ghana application, data, and operations service projects

South Africa production host project
  -> South Africa application, data, and operations service projects

Staging host project
  -> shared staging service projects with logical country awareness

Development host project
  -> shared development service projects with logical country awareness
```

The model includes the following constraints:

1. Production countries do not have direct routes to one another.
2. Development and staging do not route into production.
3. Shared services do not become an unrestricted transitive hub.
4. Each host project owns its networks, subnets, routes, firewall policy attachments, NAT, private allocations, and network telemetry.
5. Service projects own workloads but cannot independently weaken host-project network controls.
6. Country-specific application authorization remains mandatory; network separation is not the only country boundary.
7. Cross-country or hybrid connectivity requires a separate ADR and explicit threat review.

## Rationale

### Country blast-radius reduction

A compromised or misconfigured service in one production country should not receive a routable path into another country's application or data services.

### Central governance without a global transit network

Shared VPC allows a platform or networking function to govern foundational network resources while workload teams deploy into service projects. Separate host projects retain this operating model without placing every country in one routing domain.

### Alignment with resource hierarchy

The decision follows the v0.2 production-country folder and project model. Network ownership therefore reinforces the same country boundaries already used for IAM, data, logging, billing, and deployment.

### Repeatable onboarding

A new country can receive the same host-project pattern, subnet classes, policy baseline, telemetry, and validation without attaching it to an existing country's routing domain.

## Options considered

### Option 1: One global Shared VPC host project

**Advantages**

- fewer host projects;
- centralized route and firewall administration;
- easier shared internal service connectivity.

**Rejected because**

- country production workloads would share a routing domain;
- accidental route or firewall expansion would have a larger blast radius;
- shared services could become implicit transit;
- country isolation would depend more heavily on rule correctness inside one network.

### Option 2: Independent VPC networks in every workload project

**Advantages**

- strong project-level autonomy;
- simple local ownership;
- limited default blast radius.

**Rejected because**

- duplicated NAT, DNS, logging, firewall, and private-service configuration;
- inconsistent policy is more likely;
- workload teams would need broader network permissions;
- service-to-service connectivity and central operations would become harder to govern.

### Option 3: One host project per environment only

Under this option, all production countries would attach to one production host project, while development and staging remained separate.

**Rejected because**

- it separates environments but not production countries;
- country incident containment and route review remain coupled;
- production-country onboarding changes the same high-impact network.

### Option 4: Separate Shared VPC host projects per production country

**Selected because** it balances centralized standards, workload-project separation, country isolation, and repeatable operations.

## Consequences

### Positive

- smaller country-specific routing and firewall blast radius;
- network ownership aligns with production folder boundaries;
- independent NAT, connector, partner, and private-service controls;
- easier country-specific incident containment and teardown;
- consistent network modules can be reused without sharing a routing domain;
- clearer attribution of network cost and telemetry.

### Negative

- additional host projects and duplicated managed network resources;
- more Terraform state boundaries and deployment identities;
- approved cross-country services require explicit application-level or separately governed connectivity;
- operational teams need aggregated visibility across multiple networks;
- address planning must remain coordinated organization-wide.

## Security implications

The decision reduces but does not eliminate cross-country risk.

Required complementary controls include:

- country-scoped workforce and workload identities;
- no broad IAM bindings across host projects;
- application authorization using authoritative country and assignment data;
- non-overlapping address ranges;
- no transitive route export or import;
- hierarchical and VPC firewall policies;
- controlled ingress and egress;
- centralized network and audit telemetry;
- policy-as-code tests for prohibited connectivity;
- incident procedures that can isolate one country without disabling the others.

## Ownership model

| Responsibility | Owner |
|---|---|
| Organization network standards | Central cloud platform and security |
| Country host project and production routes | Central platform with approved country change ownership |
| Workload connectivity requirements | Workload owner |
| Country-specific partner approval | Country system owner and security |
| Firewall-policy baseline | Security and network engineering |
| Network telemetry and detection | Security operations |
| IP allocation registry | Network engineering |
| Application-level country authorization | Application engineering and data owners |

## Exceptions

An exception that introduces connectivity between country production networks must include:

- specific business purpose;
- source and destination workloads;
- data classification;
- protocol and direction;
- authentication and authorization model;
- alternatives considered;
- threat analysis;
- monitoring and containment plan;
- expiry or review date;
- approval from security and both affected country system owners.

A broad route between country address blocks is not an acceptable shortcut for one application integration.

## Validation

Implementation must demonstrate that:

- each production country uses a distinct host project and VPC;
- production country CIDRs do not overlap;
- no direct country-to-country routes exist;
- no non-production route reaches production;
- service projects cannot create unauthorized network resources or weaken host controls;
- network logs are centrally visible without granting broad data access;
- prohibited-route tests fail the pipeline;
- country isolation survives representative ingress, egress, and service-to-service tests.

## Evidence required before implementation status

- Terraform module and plan output;
- host and service-project attachment inventory;
- subnet allocation registry;
- route-table exports;
- firewall-policy exports;
- negative connectivity test results;
- VPC flow-log and firewall-log samples;
- country-isolation incident exercise evidence.

## Status interpretation

This ADR records an accepted architecture decision. It does not claim the Shared VPC host projects, routes, firewall policies, NAT services, or validation tests have been implemented.
