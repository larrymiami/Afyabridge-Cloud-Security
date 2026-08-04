# Shared VPC Model

## Status

**Designed**

## Purpose

This document defines how AfyaBridge uses Google Cloud Shared VPC to separate network ownership from workload ownership while preserving country and environment isolation.

The model supports centralized network governance without creating a single flat network or unrestricted connectivity between workloads.

## Decision summary

AfyaBridge uses:

- one Shared VPC host project for each production country;
- separate Shared VPC host projects for staging and development;
- workload service projects attached only to their intended host project;
- dedicated application, data, and operations subnet classes;
- central standards and policy modules managed by the platform networking function;
- country-specific routes, firewall policies, egress, and logs;
- no Shared VPC host spanning multiple production countries.

## Host-project model

| Environment | Host project pattern | Attached service projects |
|---|---|---|
| Kenya production | `afyabridge-prd-ke-net` | Kenya app, data, and ops projects |
| Ghana production | `afyabridge-prd-gh-net` | Ghana app, data, and ops projects |
| South Africa production | `afyabridge-prd-za-net` | South Africa app, data, and ops projects |
| Staging | `afyabridge-stg-common-net` | Approved staging service projects |
| Development | `afyabridge-dev-common-net` | Approved development service projects |
| Sandbox | isolated or restricted shared sandbox host | Expiring sandbox service projects only |

Project names are illustrative and must conform to the landing-zone naming standard.

## Why production uses country-specific hosts

A separate host project for each production country provides:

- independent route domains;
- independent firewall and subnet administration;
- reduced blast radius;
- clearer cost and ownership attribution;
- simpler country-specific logging and evidence;
- prevention of accidental cross-country service-project attachment;
- a direct boundary for future country-specific regulatory requirements.

A single global production Shared VPC is rejected because it would make country isolation dependent primarily on firewall correctness inside one large routing domain.

## Responsibilities

### Central networking function

The central networking function owns:

- reusable Terraform modules;
- organization and folder network guardrails;
- IP address allocation governance;
- Shared VPC host-project baselines;
- routing standards;
- firewall policy standards;
- managed edge and egress patterns;
- connectivity review criteria;
- network logging standards;
- drift detection and evidence requirements.

### Country platform owners

Country platform owners are accountable for:

- country workload requirements;
- service dependency declarations;
- approval of country-local connectivity;
- validation of production traffic paths;
- country-specific operational response;
- periodic review of firewall and route exceptions.

They do not receive unrestricted authority to alter organization guardrails or another country network.

### Workload teams

Workload teams own:

- accurate connectivity requirements;
- workload identity and service ownership;
- application-layer authentication and authorization;
- health checks and service behavior;
- removal of obsolete dependencies.

Workload teams cannot create unmanaged networks, routes, public IP exposure, or broad firewall rules in production.

## Service-project attachment

A service project may attach to exactly the Shared VPC host approved for its environment and country.

Controls must prevent:

- a Kenya production project attaching to the Ghana or South Africa host;
- a production project attaching to a non-production host;
- a non-production project attaching to a production host;
- one service project consuming subnets from multiple production countries;
- ad hoc attachments outside the project factory.

Attachment is performed through reviewed infrastructure code and validated against project metadata.

## Subnet classes

Each host project defines subnet classes for distinct functions:

| Subnet class | Intended use | Default exposure |
|---|---|---|
| Application | APIs, web backends, workers, serverless VPC attachment | Private |
| Data | private managed-service endpoints and data infrastructure | Private and highly restricted |
| Operations | monitoring, controlled connectors, maintenance tooling | Private and restricted |
| Proxy or connector | managed proxy, load-balancer, or serverless integration ranges | Platform-specific |
| Administration | exceptional controlled administration services | Identity-aware and restricted |

Subnets do not by themselves authorize traffic. Firewall, route, workload identity, and application controls remain required.

## Shared services

Shared security, logging, artifact, DNS, and CI/CD projects are not attached indiscriminately to every production Shared VPC.

Connectivity uses the narrowest suitable mechanism, such as:

- centralized log sinks rather than general network access;
- service APIs rather than routed access;
- authenticated artifact retrieval;
- workload identity federation;
- scoped private endpoints;
- dedicated connectors where a routed path is unavoidable.

Shared services cannot become a transitive hub between country production environments.

## Routing boundaries

Each production Shared VPC maintains an independent routing domain.

The design prohibits:

- VPC peering between production countries;
- route exchange through a shared hub that connects production countries;
- transitive forwarding through security, logging, CI/CD, or DNS projects;
- non-production route advertisement into production;
- static routes that bypass approved inspection or egress controls.

Future hybrid connectivity must terminate separately per country unless a later ADR approves another model with equivalent isolation.

## Firewall policy ownership

Firewall policy follows a layered ownership model:

- central guardrails protect all environments;
- country host policies define production-country rules;
- environment policies separate production and non-production;
- workload-specific rules allow documented dependencies.

Production rules require:

- named owner;
- source and destination scope;
- protocol and port;
- business justification;
- data classification consideration;
- logging decision;
- review date or expiry for exceptions.

Direct manual firewall changes are treated as drift.

## IAM separation

Shared VPC administration is separated into distinct roles:

- network designers define approved architecture and modules;
- network administrators apply approved network changes;
- security reviewers assess high-risk connectivity;
- workload deployers consume approved subnets but cannot administer host networks;
- auditors receive read-only visibility.

Routine basic Owner and Editor roles are not used for network administration.

Service-project workload identities receive only the permissions required to use approved subnets or connectors.

## DNS integration

Private DNS zones are scoped to the environments and networks that require them.

The model avoids globally visible private records when country- or environment-specific visibility is sufficient.

Cross-environment DNS visibility does not imply route reachability and must not be used to bypass network separation.

## Logging and evidence

Each host project must produce evidence for:

- service-project attachments;
- subnet configuration;
- routes and route changes;
- firewall policies and rule changes;
- flow logs for selected subnets;
- egress configuration;
- private service connectivity;
- policy exceptions;
- drift findings.

Logs are routed to approved security and operations destinations with country and environment context.

## Change process

A production network change requires:

1. a version-controlled request;
2. identified service owner and business need;
3. connectivity and data-flow description;
4. security review for high-risk exposure or cross-boundary traffic;
5. automated validation;
6. reviewed plan output;
7. controlled deployment identity;
8. post-change connectivity and denial tests;
9. retained evidence.

Emergency changes follow the privileged-access and incident processes and must be reconciled back into code.

## Validation requirements

Implementation must verify:

- each production service project is attached only to its country host;
- production countries have independent VPCs and route tables;
- no cross-country peering or transit exists;
- workload teams cannot administer host-project networking;
- non-production cannot consume production subnets;
- shared services cannot forward traffic between country networks;
- firewall policies inherit as designed;
- all network changes are logged and attributable;
- manually introduced network resources are detected as drift.

## Rejected alternatives

### One global production Shared VPC

Rejected because it creates one large routing domain and increases dependence on perfect firewall segmentation.

### One Shared VPC per application

Rejected initially because it increases operational overhead and fragments country-level policy without a demonstrated need.

### VPC peering between production countries

Rejected because routine application operation does not require direct country-to-country traffic.

### Workload-owned standalone VPCs

Rejected because they weaken policy consistency, IP governance, logging, and centralized evidence.
