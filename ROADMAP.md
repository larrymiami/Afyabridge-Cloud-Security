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
| v0.4 | Network and perimeter architecture | **Completed** |
| v0.5 | Data protection and encryption architecture | **In review** |
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
- [x] Create the structured threat model and threat register
- [x] Create the security control matrix
- [x] Establish architecture decision record conventions
- [x] Publish the initial project roadmap

**Primary outcome:** A documented security problem, threat model, and control baseline that later phases can trace back to.

---

## v0.2 — Google Cloud landing zone architecture

**Status:** Completed  
**Control state:** Designed

- [x] Design the Google Cloud resource hierarchy
- [x] Define country, environment, and shared-services separation
- [x] Define the regional deployment strategy
- [x] Define naming, labeling, centralized logging, and asset inventory
- [x] Define billing, budgets, and cost controls
- [x] Design Terraform bootstrap, remote state, and the project factory
- [x] Define progressive organization policies
- [x] Record landing-zone architecture decisions and diagrams

**Primary outcome:** A repeatable Google Cloud organization and project structure suitable for country-isolated production environments and shared non-production services.

---

## v0.3 — Identity and access architecture

**Status:** Completed  
**Control state:** Designed

- [x] Define workforce, workload, application, and external identity domains
- [x] Define group-based workforce access and country-scoped membership
- [x] Define dedicated workload identities and GitHub Actions federation
- [x] Define application authorization and the unified role model
- [x] Design temporary privileged access and break-glass controls
- [x] Define identity lifecycle, reviews, monitoring, and drift detection
- [x] Record identity architecture decisions and diagrams

**Primary outcome:** A complete human, machine, application, external, and emergency identity model with country-scoped authorization and minimal standing privilege.

---

## v0.4 — Network and perimeter architecture

**Status:** Completed  
**Control state:** Designed  
**Merged:** PR #4

- [x] Design country- and environment-scoped Shared VPC topology
- [x] Define service-project attachment and network ownership
- [x] Define non-overlapping subnet and address allocations
- [x] Define edge, application, data, operations, connector, and administration zones
- [x] Define public ingress, WAF, TLS, rate limiting, and origin restrictions
- [x] Define controlled and attributable production egress
- [x] Design private managed-service connectivity
- [x] Define authenticated service-to-service communication
- [x] Define identity-aware administrative access
- [x] Define third-party connectivity, DNS, certificates, and monitoring
- [x] Record Shared VPC, edge-protection, and egress decisions
- [x] Create topology, ingress/egress, and private-service diagrams

**Primary outcome:** Country-isolated network architecture with controlled public exposure, private service access, authenticated east-west communication, and governed egress.

---

## v0.5 — Data protection and encryption architecture

**Status:** In review  
**Control state:** Designed

- [x] Create the authoritative Public, Internal, Confidential, and Restricted classification model
- [x] Define health, identity, operational, security, integration, analytics, and cryptographic data domains
- [x] Map systems of record, stores, processors, flows, and country boundaries
- [x] Define flow registration, ownership, lineage, minimization, and prohibited replication
- [x] Define encryption at rest and in transit
- [x] Define the Cloud KMS hierarchy, country and environment separation, ownership, rotation, disablement, destruction, and recovery
- [x] Define risk-based CMEK application and separation of key administration from data administration
- [x] Define Secret Manager architecture, workload access, rotation, emergency access, and detection
- [x] Define database isolation, runtime and migration identities, auditing, masking, and maintenance controls
- [x] Define object-storage separation, public-access prevention, signed access, upload validation, lifecycle, and retention
- [x] Define country-scoped backups, isolated restoration, recovery objectives, restore testing, and evidence
- [x] Define retention schedules, legal holds, deletion propagation, restored-data reconciliation, and destruction verification
- [x] Define country residency, shared-service limitations, cross-border transfer decisions, and third-party boundaries
- [x] Define export approvals, de-identification, analytical workspaces, dashboards, research, AI use, and downstream deletion
- [x] Define sensitive-data monitoring, anomalous access, export and exfiltration detections, key and secret monitoring, residency drift, and response integration
- [x] Record classification, CMEK, and country-residency architecture decisions
- [x] Create data-protection, key-management, and backup-recovery diagrams
- [x] Update the architecture index and project roadmap

**Merge condition:** Review and merge the v0.5 pull request without unresolved classification, encryption, residency, retention, recovery, or monitoring inconsistencies.

**Primary outcome:** A country-aware protection model for sensitive health and identity data from creation through verified deletion.

---

## v0.6 — Application security baseline

**Status:** Planned  
**Target control state:** Implemented and tested in a minimal application

- [ ] Build the minimum community-health worker web application
- [ ] Build household, patient, and referral services
- [ ] Build the offline synchronization worker
- [ ] Use synthetic health and household data only
- [ ] Implement authentication and server-side authorization boundaries
- [ ] Implement country, programme, facility, and assignment scoping
- [ ] Implement secure session and token handling
- [ ] Add input validation, safe errors, and audit events
- [ ] Add abuse, replay, idempotency, and concurrency protections
- [ ] Create application threat scenarios and security tests

**Primary outcome:** A small, realistic application that exercises the identity, network, and data-protection architecture.

---

## v0.7 — Infrastructure as code and secure GCP deployment

**Status:** Planned  
**Target control state:** Implemented and validated

- [ ] Implement Terraform bootstrap and project-factory modules
- [ ] Implement country and non-production Shared VPC modules
- [ ] Implement network, IAM, federation, logging, and monitoring controls
- [ ] Deploy Cloud Run workloads, managed databases, and object storage
- [ ] Configure Artifact Registry, Secret Manager, and Cloud KMS
- [ ] Configure the managed HTTPS edge, Cloud Armor, DNS, and certificates
- [ ] Implement data-protection configuration from v0.5
- [ ] Add Terraform validation, deployment evidence, bootstrap, and rollback runbooks

**Primary outcome:** Reproducible infrastructure that implements the reviewed architecture without relying on manual console configuration.

---

## v0.8 — Shift-left CI/CD security pipeline

**Status:** Planned  
**Target control state:** Implemented and enforced

- [ ] Add unit, integration, authorization, and security tests
- [ ] Add secret, static, dependency, license, IaC, container, and package scanning
- [ ] Add API, schema, and policy-as-code checks
- [ ] Create severity-based security quality gates
- [ ] Define false-positive and exception workflows
- [ ] Publish machine-readable and human-readable evidence

**Primary outcome:** Security checks run before deployment and block unacceptable changes.

---

## v0.9 — Software supply-chain security

**Status:** Planned  
**Target control state:** Implemented and enforced

- [ ] Generate SBOMs and pin build dependencies
- [ ] Harden build runners and workflow permissions
- [ ] Separate build, deploy, and runtime identities
- [ ] Sign images and release artifacts
- [ ] Generate and verify build provenance
- [ ] Define dependency risk, artifact retention, and revocation procedures
- [ ] Test compromised dependency and artifact scenarios

**Primary outcome:** Build and deployment systems can establish what was built, by whom, from which source, and whether the artifact is trusted.

---

## v0.10 — Cloud security posture and governance

**Status:** Planned  
**Target control state:** Implemented and operational

- [ ] Configure Security Command Center capabilities appropriate to the project
- [ ] Implement posture, organization-policy, asset, IAM, network, DNS, logging, encryption, and data-location checks
- [ ] Create governance policies, control ownership, risk, exception, and compensating-control registers
- [ ] Map implemented controls to threats and the control matrix
- [ ] Define evidence collection, metrics, reporting, and exception-expiry tests

**Primary outcome:** Architecture and implemented controls remain observable, governed, and traceable over time.

---

## v0.11 — Shift-right validation and runtime security

**Status:** Planned  
**Target control state:** Validated and monitored

- [ ] Add dynamic and authenticated API security testing
- [ ] Add scheduled rescanning
- [ ] Validate edge, WAF, rate-limit, origin, IAM, network, egress, sensitive-data, secret, and runtime detections
- [ ] Test authorization bypass and cross-country isolation
- [ ] Run controlled abuse and denial scenarios
- [ ] Record findings, remediation, retest, and residual risk

**Primary outcome:** Deployed controls are tested against realistic attacks and misconfigurations rather than assumed effective.

---

## v0.12 — Incident response and recovery

**Status:** Planned  
**Target control state:** Operational and exercised

- [ ] Create the incident-response plan, severity model, command structure, communication, and escalation paths
- [ ] Create identity, data exposure, application, supply-chain, network, DNS, certificate, and cloud-resource playbooks
- [ ] Define forensic evidence preservation and notification decision paths
- [ ] Test backup restoration and service recovery
- [ ] Run controlled tabletop and technical simulations
- [ ] Record containment, recovery, and lessons-learned metrics

**Primary outcome:** The system can be investigated, contained, restored, and improved after a security incident.

---

## v1.0 — Multi-country production-style capstone

**Status:** Not started  
**Target control state:** Implemented, validated, and documented

- [ ] Deploy production-style workloads for Kenya, Ghana, and South Africa
- [ ] Demonstrate network, identity, application, and data isolation
- [ ] Demonstrate secure promotion from non-production
- [ ] Test service failure, backup restoration, recovery objectives, privileged access, and partner scenarios
- [ ] Consolidate architecture decisions and implementation evidence
- [ ] Reconcile threats, controls, risks, and exceptions
- [ ] Produce final implementation, operations, governance, incident, architecture, and evidence indexes

**Primary outcome:** A defensible, end-to-end cloud security and DevSecOps reference implementation for a fictional multi-country health platform.
