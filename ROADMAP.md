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
| v0.8 | Shift-left CI/CD security pipeline | **In review** |
| v0.9 | Software supply-chain security | **In review** |
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
**Control state:** Implemented and statically validated; live deployment validation pending

- [x] Implement the protected Terraform bootstrap, remote state, encryption, and execution-identity foundation
- [x] Implement the project factory and authoritative multi-country project inventory
- [x] Implement shared-services, Kenya, Ghana, and South Africa folder hierarchy modules
- [x] Implement baseline folder policies preventing service-account key creation and upload
- [x] Implement additive project IAM with public-principal rejection
- [x] Implement project budgets and notification-threshold contracts
- [x] Add bootstrap and foundation deployment runbooks
- [x] Record successful static Terraform validation evidence for v0.7A and v0.7B
- [x] Implement country-isolated custom-mode Shared VPC modules and service-project attachments
- [x] Implement regional subnets, Private Google Access, VPC Flow Logs, Cloud Router, Cloud NAT, and restricted Google API routing
- [x] Implement deny-by-default ingress and egress firewall controls with health-check and IAP allowlists
- [x] Implement country-owned private service access ranges and private Google API DNS
- [x] Implement country-specific Serverless VPC Access connectors with unique `/28` ranges
- [x] Add network architecture documentation, deployment runbook, and v0.7C static-validation evidence
- [x] Implement country-scoped Artifact Registry repositories with immutable tags, cleanup-policy contracts, CMEK hooks, and non-public IAM
- [x] Implement Secret Manager metadata with user-managed replication, delayed version destruction, rotation contracts, CMEK hooks, and no secret payloads in Terraform
- [x] Implement country Cloud KMS key rings and symmetric keys with rotation, destruction delays, and additive IAM
- [x] Implement Cloud Run runtime identities, private ingress, digest-pinned images, VPC connector egress, secret references, and non-public invocation
- [x] Implement private-IP Cloud SQL for PostgreSQL with backups, point-in-time recovery, maintenance controls, CMEK hooks, and deletion protection
- [x] Implement country Cloud Storage buckets with uniform access, public-access prevention, versioning, soft delete, lifecycle, retention, CMEK hooks, and destruction protection
- [x] Add workload architecture documentation, deployment runbook, and v0.7D static-validation evidence
- [x] Generate, review, commit, and validate the workload provider lockfile
- [x] Implement GitHub OIDC Workload Identity Federation with immutable repository claims and separate plan/apply providers
- [x] Implement separate Terraform plan and apply service accounts with fixed impersonation paths and primitive-role rejection
- [x] Add pull-request plan and approval-gated saved-plan apply workflow contracts
- [x] Add federation bootstrap, trust-boundary, role-matrix, and v0.7E static-validation documentation
- [x] Implement centralized Cloud Logging buckets and non-intercepting organization sinks with country-aware routing, retention controls, and least-privilege sink-writer IAM
- [x] Implement reusable Cloud Monitoring notification-channel and alert-policy controls with initial Cloud Run, Cloud SQL, and logging-pipeline policies
- [x] Implement log-based security-detection metrics and disabled-by-default alert policies for IAM, public access, logging changes, KMS changes, and Secret Manager denial
- [x] Add centralized-observability architecture, detection catalogue, response runbook, and v0.7F static-validation evidence
- [x] Implement country-scoped regional external Application Load Balancers with Cloud Run serverless NEG backends, dedicated proxy-only subnets, and reserved regional public addresses
- [x] Implement regional Cloud Armor policies with preview-first OWASP CRS 4.22 WAF rules, per-IP throttling, verbose logging, and backend attachment
- [x] Implement country-scoped public DNS contracts, regional DNS authorizations, Google-managed certificates, TLS 1.2+ HTTPS listeners, and HTTP-to-HTTPS redirects
- [x] Add public-edge architecture documentation, deployment and rollback runbook, negative-test matrix, and v0.7G static-validation evidence
- [ ] Bootstrap and live-validate Workload Identity Federation, repository variables, protected environment controls, and deployment IAM
- [ ] Apply and validate the bootstrap, foundation, network, workload, observability, and edge stacks in a reviewed Google Cloud environment
- [ ] Live-validate logging delivery, country isolation, notification channels, monitoring alerts, detection metrics, detection alerts, and responder workflows
- [ ] Live-validate DNS delegation, certificate issuance, HTTPS routing, origin-bypass prevention, Cloud Armor behavior, edge logging, and country-specific public ingress
- [ ] Add live deployment, rollback, recovery, and runtime validation evidence

**Validated:** Terraform foundation workflow run #240 on commit `5e0670210616ff795690f4f6a2d9c01d32bcaca4` completed recursive formatting checks and backend-free initialization and static validation for the repository Terraform roots, including bootstrap, foundation, network, workload, federation, observability, and edge. Earlier v0.7 evidence remains valid for the revisions it records. Workload Identity Federation, observability, public DNS, certificates, Cloud Armor, and edge routing remain unvalidated against live GitHub and Google Cloud execution.

**Current boundary:** No v0.7 infrastructure has yet been applied to a live Google Cloud organization. Workload Identity Federation token exchange, service-account impersonation, protected-environment enforcement, exact deployment IAM, folder creation, project placement, effective organization policies, budgets, remote state, routes, DNS, firewall enforcement, private-service connectivity, managed-service agents, CMEK effectiveness, Artifact Registry behavior, secret access, Cloud Run ingress and egress, Cloud SQL backup and restore, storage recovery, log delivery, sink writer behavior, log retention, cross-country telemetry isolation, notification delivery, alert triggering and recovery, log-based metric increments, detection fidelity, responder escalation, DNS delegation, certificate issuance and renewal, TLS negotiation, HTTP redirects, Cloud Run origin-bypass prevention, Cloud Armor WAF and throttling behavior, country-specific edge routing, public ingress logging, rollback, recovery, and drift remain deployment-validation requirements.

**Primary outcome:** Reproducible infrastructure and a keyless deployment-control path with implemented country-isolated workloads, observability, detections, and protected public edge controls, without claiming unperformed live validation.

---

## v0.8 — Shift-left CI/CD security pipeline

**Status:** In review  
**Control state:** Implemented and enforced in repository CI; live deployment and runtime validation remain out of scope

- [x] Add secret, static, dependency, license, IaC, container, and package scanning
- [x] Add API, schema, and policy-as-code checks
- [x] Create severity-based security quality gates and exception workflows
- [x] Publish machine-readable and human-readable evidence

**Validated:** Security gates workflow run #25 (`31167508061`) on commit `1cfb3f85e29548fb29ffed938660593ac1e47e96` completed successfully. The run validated full-history secret scanning, dependency and license review, CodeQL analysis, Terraform and package scanning, hardened container build and image scanning, OpenAPI contract drift checks, OPA/Rego policy evaluation, security-exception validation, and generation/upload of JSON and Markdown security evidence.

**Current boundary:** v0.8 validates the configured repository and pull-request controls only. CodeQL analysis results still depend on repository code-scanning and merge-protection settings for alert-based merge blocking. Trivy ignores unfixed vulnerabilities by policy and blocks configured high/critical findings where remediation is available. The exception registry does not automatically suppress scanners. No live Google Cloud deployment, runtime attack simulation, dynamic API security testing, or production control effectiveness is claimed by this milestone.

**Primary outcome:** Security checks run before deployment, block configured unacceptable changes, require reviewed time-bounded handling for exceptions, and produce auditable workflow evidence.

---

## v0.9 — Software supply-chain security

**Status:** In review  
**Control state:** Implemented and enforced in repository CI; live registry and deployment trust enforcement pending

- [x] Generate SBOMs and pin build dependencies
- [x] Harden runners and separate build, deploy, and runtime identities
- [x] Sign artifacts and generate verifiable provenance
- [x] Define dependency risk, artifact retention, revocation, and compromise tests

**Validated:** Supply chain workflow run #34 (`31175552878`) on commit `35fa8a49d6957ec5d88121cc150d4c84a8bdbd58` completed successfully. The run validated full-SHA workflow dependencies, runner and identity boundaries, weekly dependency-update policy, evidence-retention contracts, the trust-revocation registry, negative compromise scenarios, repository/image CycloneDX and SPDX SBOMs, exact-image export and SHA-256 handoff, keyless Sigstore signing, exact GitHub Actions workflow-identity verification, GitHub build provenance, GitHub SPDX SBOM attestation, pre-sign revocation enforcement, post-verification revocation enforcement, and evidence upload. Application baseline #96 and Terraform foundation #278 also succeeded for the same revision; Terraform federation plan #49 skipped as expected because live WIF repository variables are not configured.

**Current boundary:** v0.9 proves repository-level build identity, artifact integrity, SBOM generation, keyless signing, attestation, dependency-governance, retention, revocation, and fail-closed compromise controls for the exported CI image archive. It does not yet claim that a live Artifact Registry digest has been signed, that Cloud Run or Binary Authorization enforces artifact trust at deployment, that Dependabot alerts/security updates are enabled by repository settings, or that Workload Identity Federation and Google Cloud deployment IAM have been live-validated. Those controls depend on the pending live v0.7 deployment path and later runtime validation.

**Primary outcome:** The CI supply chain can establish what was built, from which source and workflow identity, verify the exact artifact and its SBOM/provenance, and make an explicit current-trust decision that can fail closed when a source, artifact, or signer identity is revoked.

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
