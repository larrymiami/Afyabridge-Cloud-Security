# AfyaBridge Cloud Security Roadmap

## Roadmap status model

| Status | Meaning |
|---|---|
| **Completed** | Architecture package merged into `main` and reviewed. |
| **In review** | Architecture package is complete and awaiting merge. |
| **Planned** | Scope agreed, but work has not started. |
| **Not started** | Milestone exists but detailed scope has not yet been finalized. |

> Architecture milestones marked complete represent a **Designed** state. Controls are not considered **Implemented** until infrastructure, application code, tests, deployment evidence, and operational evidence exist.

## Milestone overview

| Version | Milestone | Status |
|---|---|---|
| v0.1 | Project foundation and threat model | **Completed** |
| v0.2 | Google Cloud landing zone architecture | **Completed** |
| v0.3 | Identity and access architecture | **Completed** |
| v0.4 | Network and perimeter architecture | **In review** |
| v0.5 | Data protection and encryption architecture | **Planned** |
| v0.6 | Application security baseline | **Planned** |
| v0.7 | Infrastructure as code and secure GCP deployment | **Planned** |
| v0.8 | Shift-left CI/CD security pipeline | **Planned** |
| v0.9 | Software supply-chain security | **Planned** |
| v0.10 | Cloud security posture and governance | **Planned** |
| v0.11 | Shift-right validation and runtime security | **Planned** |
| v0.12 | Incident response and recovery | **Planned** |
| v1.0 | Multi-country production-style capstone | **Not started** |

---

## v0.1 — Project foundation and threat model

**Status:** Completed  
**Control state:** Designed

- [x] Define the fictional multi-country community-health NGO scenario
- [x] Define project scope, assumptions, and exclusions
- [x] Define security objectives and measurable success criteria
- [x] Define the system context and initial architecture
- [x] Identify assets, actors, trust boundaries, and data flows
- [x] Create the structured threat model
- [x] Create the initial threat register
- [x] Create the security control matrix
- [x] Establish architecture decision record conventions
- [x] Publish the initial project roadmap

**Primary outcome:** A documented security problem, threat model, and control baseline that later architecture phases can trace back to.

---

## v0.2 — Google Cloud landing zone architecture

**Status:** Completed  
**Control state:** Designed

- [x] Design the Google Cloud resource hierarchy
- [x] Define country, environment, and shared-services separation
- [x] Define the regional deployment strategy
- [x] Define naming and labeling standards
- [x] Design centralized logging and asset inventory
- [x] Define billing, budgets, and cost controls
- [x] Design Terraform bootstrap and remote-state management
- [x] Design the project factory
- [x] Define progressive organization policies
- [x] Record landing-zone architecture decisions
- [x] Create landing-zone and bootstrap diagrams

**Primary outcome:** A repeatable Google Cloud organization and project structure suitable for country-isolated production environments and shared non-production services.

---

## v0.3 — Identity and access architecture

**Status:** Completed  
**Control state:** Designed

- [x] Define identity domains and trust boundaries
- [x] Define workforce authentication and group-based access
- [x] Define workload and CI/CD identities
- [x] Define GitHub Actions Workload Identity Federation
- [x] Define application authorization and scope enforcement
- [x] Create the unified cloud and application role model
- [x] Design temporary privileged access and break-glass controls
- [x] Define joiner, mover, leaver, contractor, and workload lifecycle
- [x] Define periodic access reviews and evidence requirements
- [x] Define external identity governance
- [x] Define identity monitoring and drift detection
- [x] Record identity architecture decisions
- [x] Create identity and privileged-access diagrams

**Primary outcome:** A complete human, machine, application, external, and emergency identity model with country-scoped authorization and minimal standing privilege.

---

## v0.4 — Network and perimeter architecture

**Status:** In review — PR #4  
**Control state:** Designed

- [x] Design country- and environment-scoped Shared VPC topology
- [x] Define service-project attachment and network ownership
- [x] Define non-overlapping subnet and address allocations
- [x] Define edge, application, data, operations, connector, and administration zones
- [x] Define public ingress, WAF, TLS, rate limiting, and origin restrictions
- [x] Define controlled and attributable production egress
- [x] Design private managed-service connectivity
- [x] Define authenticated service-to-service communication
- [x] Define identity-aware administrative access
- [x] Define third-party, partner, vendor, and webhook connectivity
- [x] Define public and private DNS governance
- [x] Define certificate issuance, renewal, and expiry controls
- [x] Define network monitoring, detections, and drift checks
- [x] Record Shared VPC, edge-protection, and egress decisions
- [x] Create topology, ingress/egress, and private-service diagrams

**Merge condition:** Review and merge PR #4 without unresolved architecture inconsistencies.

**Primary outcome:** Country-isolated network architecture with controlled public exposure, private service access, authenticated east-west communication, and governed egress.

---

## v0.5 — Data protection and encryption architecture

**Status:** Planned  
**Target control state:** Designed

- [ ] Create the data classification model
- [ ] Define health, identity, operational, security, and synthetic-data categories
- [ ] Map data flows, stores, processors, and country boundaries
- [ ] Define data residency and cross-border transfer rules
- [ ] Define encryption in transit and at rest
- [ ] Define Cloud KMS key hierarchy and ownership
- [ ] Define key rotation, disablement, destruction, and recovery
- [ ] Define application-level encryption requirements
- [ ] Define tokenization, pseudonymization, and masking controls
- [ ] Define Secret Manager architecture and secret lifecycle
- [ ] Define database, object-storage, analytics, log, and backup protection
- [ ] Define retention, deletion, legal-hold, and data-subject workflows
- [ ] Define backup integrity and restoration evidence
- [ ] Define sensitive-data monitoring and exfiltration detections
- [ ] Record data-protection architecture decisions
- [ ] Create data-flow, encryption-boundary, and key-lifecycle diagrams

**Primary outcome:** A country-aware protection model for sensitive health and identity data from creation through deletion.

---

## v0.6 — Application security baseline

**Status:** Planned  
**Target control state:** Implemented and tested in a minimal application

- [ ] Build the minimum community-health worker web application
- [ ] Build the household and patient service
- [ ] Build the referral service
- [ ] Build the offline synchronization worker
- [ ] Add synthetic health and household data only
- [ ] Implement authentication and server-side authorization boundaries
- [ ] Implement country, programme, facility, and assignment scoping
- [ ] Implement secure session and token handling
- [ ] Add input validation and safe error handling
- [ ] Add audit events for sensitive actions
- [ ] Add initial abuse, replay, and concurrency protections
- [ ] Document intentionally vulnerable test cases separately from production paths
- [ ] Create application threat scenarios and security tests

**Primary outcome:** A small, realistic application that exercises the identity, network, and data-protection architecture.

---

## v0.7 — Infrastructure as code and secure GCP deployment

**Status:** Planned  
**Target control state:** Implemented and validated

- [ ] Create Terraform organization and project bootstrap modules
- [ ] Implement the project factory
- [ ] Implement country and non-production Shared VPC modules
- [ ] Implement subnet, firewall, routing, NAT, and private-service modules
- [ ] Implement IAM groups, service accounts, and federation bindings
- [ ] Configure Artifact Registry
- [ ] Deploy workloads to Cloud Run
- [ ] Configure managed databases and storage
- [ ] Configure Secret Manager and Cloud KMS
- [ ] Configure the managed HTTPS edge and Cloud Armor
- [ ] Configure DNS and managed certificates
- [ ] Configure centralized logging and monitoring sinks
- [ ] Add Terraform validation and deployment evidence
- [ ] Create environment bootstrap and rollback runbooks

**Primary outcome:** Reproducible infrastructure that implements the reviewed architecture without relying on manual console configuration.

---

## v0.8 — Shift-left CI/CD security pipeline

**Status:** Planned  
**Target control state:** Implemented and enforced

- [ ] Add unit, integration, authorization, and security tests
- [ ] Define minimum coverage and critical-path test requirements
- [ ] Add secret scanning
- [ ] Add static application security testing
- [ ] Add dependency and license scanning
- [ ] Add infrastructure-as-code scanning
- [ ] Add container and operating-system package scanning
- [ ] Add API and schema validation checks
- [ ] Add policy-as-code checks
- [ ] Create severity-based security quality gates
- [ ] Define false-positive and exception workflows
- [ ] Publish machine-readable and human-readable pipeline evidence

**Primary outcome:** Security checks run before deployment and block unacceptable changes.

---

## v0.9 — Software supply-chain security

**Status:** Planned  
**Target control state:** Implemented and enforced

- [ ] Generate software bills of materials
- [ ] Pin and verify build dependencies
- [ ] Harden build runners and workflow permissions
- [ ] Separate build, deploy, and runtime identities
- [ ] Sign container images and release artifacts
- [ ] Generate build provenance
- [ ] Define dependency risk and update policies
- [ ] Enforce trusted registries and artifact sources
- [ ] Verify signatures and provenance before deployment
- [ ] Define artifact retention and revocation procedures
- [ ] Test compromised dependency and artifact scenarios

**Primary outcome:** Build and deployment systems can establish what was built, by whom, from which source, and whether the artifact is trusted.

---

## v0.10 — Cloud security posture and governance

**Status:** Planned  
**Target control state:** Implemented and operational

- [ ] Configure Security Command Center capabilities appropriate to the project
- [ ] Implement posture and organization-policy checks
- [ ] Implement asset, IAM, route, firewall, DNS, and logging drift detection
- [ ] Create governance policies and control ownership records
- [ ] Create risk, exception, and compensating-control registers
- [ ] Map implemented controls to the threat register and security control matrix
- [ ] Define evidence collection and retention
- [ ] Define security metrics and reporting cadence
- [ ] Add cost-security anomaly correlation where useful
- [ ] Run governance review and exception-expiry tests

**Primary outcome:** Architecture and implemented controls remain observable, governed, and traceable over time.

---

## v0.11 — Shift-right validation and runtime security

**Status:** Planned  
**Target control state:** Validated and monitored

- [ ] Add dynamic application security testing
- [ ] Add authenticated API security testing
- [ ] Add scheduled rescanning
- [ ] Validate edge, WAF, rate-limit, and origin controls
- [ ] Test IAM and service-account drift detections
- [ ] Test network and egress detections
- [ ] Test sensitive-data and secret detections
- [ ] Validate runtime logging and alert routing
- [ ] Run authorization bypass and cross-country isolation tests
- [ ] Run controlled abuse and denial scenarios
- [ ] Record findings, remediation, retest, and residual risk

**Primary outcome:** Deployed controls are tested against realistic attack and misconfiguration scenarios rather than assumed effective.

---

## v0.12 — Incident response and recovery

**Status:** Planned  
**Target control state:** Operational and exercised

- [ ] Create the incident-response plan
- [ ] Define severity, command, communication, and escalation models
- [ ] Create identity-compromise playbooks
- [ ] Create data-exposure and exfiltration playbooks
- [ ] Create application and supply-chain compromise playbooks
- [ ] Create network, DNS, and certificate incident playbooks
- [ ] Create cloud-resource and credential-containment procedures
- [ ] Define forensic evidence preservation
- [ ] Define regulatory and affected-party notification decision paths
- [ ] Test backup restoration and service recovery
- [ ] Run controlled tabletop and technical simulations
- [ ] Record response, containment, recovery, and lessons-learned metrics

**Primary outcome:** The system can be investigated, contained, restored, and improved after a security incident.

---

## v1.0 — Multi-country production-style capstone

**Status:** Not started  
**Target control state:** Implemented, validated, and documented

- [ ] Deploy production-style workloads for Kenya, Ghana, and South Africa
- [ ] Demonstrate country network, identity, application, and data isolation
- [ ] Demonstrate secure non-production promotion into production
- [ ] Test regional and service failure scenarios
- [ ] Test backup restoration and recovery objectives
- [ ] Test break-glass and privileged-access workflows
- [ ] Test partner outage and credential-compromise scenarios
- [ ] Consolidate architecture decisions and implementation evidence
- [ ] Reconcile the threat register and security control matrix
- [ ] Resolve or formally accept remaining risks
- [ ] Produce final implementation, operations, governance, and incident documentation
- [ ] Publish a final architecture and evidence index

**Primary outcome:** A defensible, end-to-end cloud security and DevSecOps reference implementation for a fictional multi-country health platform.
