# AfyaBridge Cloud Security Roadmap

## Roadmap status model

| Status | Meaning |
|---|---|
| **Completed** | Milestone merged into `main` and reviewed. |
| **In review** | Milestone package is complete and awaiting review, validation, or merge. |
| **Planned** | Scope is agreed, but implementation has not started. |
| **Not started** | Milestone exists, but detailed scope is not finalized. |

> Architecture milestones marked complete represent a **Designed** state. Application and infrastructure controls are not considered **Validated** until tests, deployment, and evidence demonstrate the intended behavior.

## Milestone overview

| Version | Milestone | Status |
|---|---|---|
| v0.1 | Project foundation and threat model | **Completed** |
| v0.2 | Google Cloud landing zone architecture | **Completed** |
| v0.3 | Identity and access architecture | **Completed** |
| v0.4 | Network and perimeter architecture | **Completed** |
| v0.5 | Data protection and encryption architecture | **Completed** |
| v0.6 | Application security baseline | **Completed** |
| v0.7 | Infrastructure as code and secure GCP deployment | **In review** |
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
- [x] Define scope, assumptions, exclusions, objectives, assets, actors, trust boundaries, and data flows
- [x] Create the threat model, threat register, security control matrix, ADR conventions, and roadmap

**Primary outcome:** A documented security problem, threat model, and control baseline that later phases can trace back to.

---

## v0.2 — Google Cloud landing zone architecture

**Status:** Completed  
**Control state:** Designed

- [x] Define resource hierarchy and country, environment, and shared-services separation
- [x] Define regional deployment, naming, labeling, logging, inventory, billing, and budgets
- [x] Design Terraform bootstrap, remote state, project factory, organization policies, and diagrams

**Primary outcome:** A repeatable Google Cloud organization and project structure suitable for country-isolated production environments and shared non-production services.

---

## v0.3 — Identity and access architecture

**Status:** Completed  
**Control state:** Designed

- [x] Define workforce, workload, application, external, and emergency identity domains
- [x] Define group-based access, workload identities, federation, authorization, role models, lifecycle, reviews, monitoring, and drift detection
- [x] Record identity decisions and diagrams

**Primary outcome:** A complete identity model with country-scoped authorization and minimal standing privilege.

---

## v0.4 — Network and perimeter architecture

**Status:** Completed  
**Control state:** Designed  
**Merged:** PR #4

- [x] Design country- and environment-scoped Shared VPC topology and zones
- [x] Define ingress, edge security, egress, private service access, service authentication, administration, partner connectivity, DNS, certificates, and monitoring
- [x] Record decisions and create topology, ingress/egress, and private-service diagrams

**Primary outcome:** Country-isolated network architecture with controlled public exposure, private service access, authenticated east-west communication, and governed egress.

---

## v0.5 — Data protection and encryption architecture

**Status:** Completed  
**Control state:** Designed  
**Merged:** PR #5

- [x] Define authoritative classification, data domains, inventory, lineage, minimization, and country boundaries
- [x] Define encryption at rest and in transit, KMS hierarchy, CMEK use, secrets, database and object-storage controls
- [x] Define backups, recovery, retention, deletion, legal holds, residency, exports, analytics, and monitoring
- [x] Record classification, CMEK, and country-residency decisions
- [x] Create data-protection, key-management, and backup-recovery diagrams

**Primary outcome:** A country-aware protection model for sensitive health and identity data from creation through verified deletion.

---

## v0.6 — Application security baseline

**Status:** Completed  
**Control state:** Implemented and validated  
**Merged:** PR #6  
**Validated:** Application baseline workflow run #27 on commit `e3eb19f7aad2c844f38daeb924d6cd0c9b863ed1`

- [x] Establish the pnpm TypeScript monorepo and local PostgreSQL environment
- [x] Build the minimum community-health web application and health endpoint
- [x] Use synthetic household data for Kenya, Ghana, and South Africa only
- [x] Implement validated authenticated actor contexts
- [x] Implement deny-by-default server-side authorization
- [x] Enforce country, programme, facility, assignment, action, and record scope
- [x] Implement structured audit events and safe error responses
- [x] Implement durable household persistence and scoped repositories
- [x] Implement database constraints and parameterized queries
- [x] Implement household versioning and optimistic concurrency
- [x] Build the offline synchronization worker
- [x] Implement device and actor binding, replay protection, idempotency, timestamp windows, and conflict handling
- [x] Add authentication, authorization, sync, worker, database, and web security tests
- [x] Add migration and synthetic-data seed tooling
- [x] Add the application-baseline GitHub Actions workflow
- [x] Document application boundaries, authentication, authorization, validation, audit, offline sync, errors, abuse controls, tests, and diagrams
- [x] Obtain a successful GitHub Actions run for the reviewed pull-request revision
- [x] Inspect CI evidence and resolve failures before merge

**Known boundary:** The local `x-afyabridge-actor` header is an integration seam for exercising downstream controls. Production must replace it with a trusted, integrity-protected identity assertion. Patient and referral workflows are not implemented in this minimal baseline.

**Primary outcome:** A small, realistic application that exercises identity, authorization, persistence, offline synchronization, data isolation, and security validation controls.

---

## v0.7 — Infrastructure as code and secure GCP deployment

**Status:** In review  
**Control state:** Partially implemented; static validation complete, deployment validation pending

- [x] Implement the protected Terraform bootstrap, remote state, encryption, and execution-identity foundation
- [x] Implement the project factory and authoritative multi-country project inventory
- [x] Implement shared-services, Kenya, Ghana, and South Africa folder hierarchy modules
- [x] Implement baseline folder policies preventing service-account key creation and upload
- [x] Implement additive project IAM with public-principal rejection
- [x] Implement project budgets and notification-threshold contracts
- [x] Add bootstrap and foundation deployment runbooks
- [x] Record successful static Terraform validation evidence for v0.7A and v0.7B
- [ ] Apply and validate the bootstrap and foundation stacks in a reviewed Google Cloud environment
- [ ] Implement country and non-production Shared VPC modules
- [ ] Implement network, federation, logging, and monitoring controls
- [ ] Deploy Cloud Run workloads, managed databases, and object storage
- [ ] Configure Artifact Registry, Secret Manager, Cloud KMS, edge security, DNS, and certificates
- [ ] Add deployment, rollback, recovery, and runtime validation evidence

**Validated:** Terraform foundation workflow run #25 on commit `0965ade4395c94d46cd35c55f4b86d712faa3f1c` completed formatting, backend-free initialization, and static validation for the bootstrap and composed foundation roots.

**Current boundary:** No v0.7 infrastructure has yet been applied to a live Google Cloud organization. Folder creation, project placement, effective organization policies, IAM propagation, budget alerts, remote-state behavior, and cross-country isolation remain deployment-validation requirements.

**Primary outcome:** Reproducible infrastructure that implements the reviewed architecture without relying on manual console configuration.

---

## v0.8 — Shift-left CI/CD security pipeline

**Status:** Planned  
**Target control state:** Implemented and enforced

- [ ] Add secret, static, dependency, license, IaC, container, and package scanning
- [ ] Add API, schema, and policy-as-code checks
- [ ] Create severity-based security quality gates and exception workflows
- [ ] Publish machine-readable and human-readable evidence

**Primary outcome:** Security checks run before deployment and block unacceptable changes.

---

## v0.9 — Software supply-chain security

**Status:** Planned  
**Target control state:** Implemented and enforced

- [ ] Generate SBOMs and pin build dependencies
- [ ] Harden runners and separate build, deploy, and runtime identities
- [ ] Sign artifacts and generate verifiable provenance
- [ ] Define dependency risk, artifact retention, revocation, and compromise tests

**Primary outcome:** Build and deployment systems can establish what was built, by whom, from which source, and whether the artifact is trusted.

---

## v0.10 — Cloud security posture and governance

**Status:** Planned  
**Target control state:** Implemented and operational

- [ ] Configure cloud posture, organization-policy, asset, IAM, network, DNS, logging, encryption, and data-location checks
- [ ] Create governance, ownership, risk, exception, compensating-control, evidence, metrics, and reporting processes

**Primary outcome:** Architecture and implemented controls remain observable, governed, and traceable over time.

---

## v0.11 — Shift-right validation and runtime security

**Status:** Planned  
**Target control state:** Validated and monitored

- [ ] Add dynamic and authenticated API security testing and scheduled rescanning
- [ ] Validate edge, origin, IAM, network, egress, secret, data, and runtime detections
- [ ] Test authorization bypass, cross-country isolation, abuse, and denial scenarios
- [ ] Record findings, remediation, retest, and residual risk

**Primary outcome:** Deployed controls are tested against realistic attacks and misconfigurations rather than assumed effective.

---

## v0.12 — Incident response and recovery

**Status:** Planned  
**Target control state:** Operational and exercised

- [ ] Create incident-response governance, communication, escalation, and technical playbooks
- [ ] Define forensic evidence preservation and notification decisions
- [ ] Test service recovery, backup restoration, tabletop exercises, and technical simulations

**Primary outcome:** The system can be investigated, contained, restored, and improved after a security incident.

---

## v1.0 — Multi-country production-style capstone

**Status:** Not started  
**Target control state:** Implemented, validated, and documented

- [ ] Deploy production-style workloads for Kenya, Ghana, and South Africa
- [ ] Demonstrate network, identity, application, and data isolation
- [ ] Test promotion, service failure, recovery, privileged access, and partner scenarios
- [ ] Consolidate implementation evidence and reconcile threats, controls, risks, and exceptions

**Primary outcome:** A defensible, end-to-end cloud security and DevSecOps reference implementation for a fictional multi-country health platform.
