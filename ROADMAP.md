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
| v0.8 | Shift-left CI/CD security pipeline | **Completed** |
| v0.9 | Software supply-chain security | **Completed** |
| v0.10 | Cloud security posture and governance | **In review** |
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

**Status:** Completed  
**Control state:** Implemented and enforced in repository CI; live deployment and runtime validation remain out of scope  
**Merged:** PR #14

- [x] Add secret, static, dependency, license, IaC, container, and package scanning
- [x] Add API, schema, and policy-as-code checks
- [x] Create severity-based security quality gates and exception workflows
- [x] Publish machine-readable and human-readable evidence

**Validated:** Security gates workflow run #25 (`31167508061`) on commit `1cfb3f85e29548fb29ffed938660593ac1e47e96` completed successfully. The run validated full-history secret scanning, dependency and license review, CodeQL analysis, Terraform and package scanning, hardened container build and image scanning, OpenAPI contract drift checks, OPA/Rego policy evaluation, security-exception validation, and generation/upload of JSON and Markdown security evidence. The later v0.9 reviewer hardening added the fail-closed `Security gate verdict`, which is now the protected-main required status check rather than treating evidence generation itself as a merge verdict.
**Current boundary:** v0.8 validates the configured repository and pull-request controls only. CodeQL analysis results still depend on repository code-scanning settings for alert publication and visibility. Trivy ignores unfixed vulnerabilities by policy and blocks configured high/critical findings where remediation is available. The exception registry does not automatically suppress scanners. No live Google Cloud deployment, runtime attack simulation, dynamic API security testing, or production control effectiveness is claimed by this milestone.

**Primary outcome:** Security checks run before deployment, block configured unacceptable changes, require reviewed time-bounded handling for exceptions, and produce auditable workflow evidence.

---

## v0.9 — Software supply-chain security

**Status:** Completed  
**Control state:** Implemented and validated in repository CI; live registry and deployment trust enforcement pending  
**Merged:** PR #15  
**Validated:** Supply chain workflow run #64 (`31180475121`) on merge commit `e7cea0c88305a0103658734191ea4394ab668fe5`

- [x] Generate SBOMs and pin build dependencies
- [x] Harden runners and separate build, deploy, and runtime identities
- [x] Sign artifacts and generate verifiable provenance
- [x] Define dependency risk, artifact retention, revocation, and compromise tests

**Reviewer validation:** PR #15 completed a dedicated security reviewer pass before merge. The pass found and corrected pull-request-controlled signing, an evidence-capture defect in Cosign verification, mutable Terraform provider resolution in two roots, and a branch-protection status-check design that could otherwise report evidence success after an upstream scanner failure. The final PR revision passed the application baseline, Terraform foundation, security gates, supply-chain validation, governance validation, revocation validation, and negative compromise tests. Pull-request runs intentionally exercised only the unprivileged build/SBOM path after the signing trust boundary was hardened.

**Repository governance:** The `Protect main` repository ruleset is active for the default branch. It requires pull requests, resolved review conversations, the fail-closed `Security gate verdict` check, and an up-to-date branch before merge; it blocks deletion and non-fast-forward/force pushes and has no bypass actors. This protects `refs/heads/main`, which is the fixed signing trust anchor.

**Trusted-main validation:** After PR #15 merged, Supply chain run #64 executed on `refs/heads/main` and successfully completed both the unprivileged build/SBOM job and the dedicated signing/provenance job. The signing job checked out the exact merge commit `e7cea0c88305a0103658734191ea4394ab668fe5`, verified the checksummed build handoff and metadata binding, and allowed the source commit, exact artifact digest `sha256:fd9d5c9dbea44ee3bd81f62eb6899130d3fd4da51f08bd4451ba3d043083bec9`, and fixed workflow identity through the revocation policy before signing.

The exact exported image archive was then signed keylessly with Sigstore Cosign using the GitHub Actions OIDC identity `https://github.com/larrymiami/Afyabridge-Cloud-Security/.github/workflows/supply-chain.yml@refs/heads/main`. `cosign verify-blob` returned `Verified OK` against that exact certificate identity and the GitHub Actions OIDC issuer. GitHub build-provenance and SPDX SBOM attestations were created and verified with the signer workflow, `refs/heads/main` source ref, exact merge-commit source digest, and self-hosted-runner provenance denial. The same three trust subjects were re-checked against the revocation registry after cryptographic verification and remained allowed.

**Evidence:** Run #64 retained the unsigned build/SBOM package for 30 days and the signed provenance package for 90 days. The signed package contains the Cosign Sigstore bundle, non-empty Cosign verification output, GitHub provenance and SBOM bundles, their verification JSON, build metadata, image SPDX SBOM, pre-sign and post-verification revocation decisions, and SHA-256 evidence manifests. GitHub also uploaded the attestations to the repository and Sigstore Rekor transparency log.

**Current boundary:** v0.9 now proves repository-level build identity, dependency/provider integrity controls, artifact integrity, SBOM generation, protected-main build/signing separation, keyless signing, source/ref-bound provenance and SBOM verification, dependency governance, evidence retention, revocation, and fail-closed compromise controls for the exported CI image archive. It does **not** claim that a live Artifact Registry image digest has been signed, that Cloud Run or Binary Authorization enforces artifact trust at deployment, that Dependabot alerts/security updates are enabled solely by the committed version-update policy, or that Workload Identity Federation and Google Cloud deployment IAM have been live-validated. Those controls remain tied to the pending live v0.7 deployment path and later runtime validation.

**Primary outcome:** The CI supply chain establishes what was built, from which protected source and workflow identity, verifies the exact artifact and its SBOM/provenance, and makes an explicit current-trust decision that fails closed when a source, artifact, or signer identity is revoked.

---

## v0.10 — Cloud security posture and governance

**Status:** In review  
**Control state:** v0.10A and repository-scoped v0.10B implemented and CI-enforced; live cloud posture/drift and later governance/reporting slices pending

- [x] v0.10A — establish a machine-readable cloud posture baseline tied to the authoritative security-control matrix
- [x] v0.10A — define approved ownership, scope, severity/remediation, exception, validation-state, and live-cloud-source governance
- [x] v0.10A — add executable catalogue/reference validation and fail-closed negative posture tests
- [x] v0.10A — integrate posture validation into the protected-main `Security gate verdict` path
- [x] v0.10B — collect normalized repository desired-state posture and evaluate governed IAM, network, edge/DNS, KMS/secrets, storage, logging, location, and project-governance rules
- [x] v0.10B — govern required rule/control bindings, fail closed on rule-coverage/remapping drift, test collector/evaluator compromise behavior, and publish posture JSON/Markdown evidence
- [x] v0.10B — implement Terraform `show -json` drift decision logic and validate no-op, update, create, delete, replacement, and data-source scenarios with synthetic plans
- [ ] v0.10B — activate Cloud Asset Inventory/effective IAM/organization-policy/resource-location collection after the reviewed v0.7 live deployment exists
- [ ] v0.10B — run real remote-state drift plans, detect authorized out-of-band drift, and demonstrate reconciliation after the reviewed v0.7 live deployment exists
- [ ] v0.10C — implement finding ownership, remediation SLA, exception/compensating-control, expiry, and closure-evidence lifecycle
- [ ] v0.10D — produce machine-readable posture findings and human-readable posture metrics, summaries, trends, and threshold decisions

**Validated:** v0.10A Security gates workflow run #103 (`31182652111`) on implementation commit `0e066b266c1ca98f8133fb369938074f8f1adcee` validated the 18-control posture profile, governance contract, implementation-reference integrity, negative tests, and protected-main verdict integration. v0.10B Security gates run #132 (`31187557030`) on reviewer candidate `1b10cbc64d9f400028303a741dc2a555b1ea9e5f` then validated 11 executable repository posture rules with 39 assertions and 11 anchored rule/control bindings, a clean 11/11 desired-state evaluation, 10 rule-governance scenarios, 13 collector-compromise scenarios, 17 evaluator decision scenarios, 6 Terraform drift-decision scenarios, posture evidence upload, the existing security scanner/policy suite, and the fail-closed `Security gate verdict`. Detailed evidence is recorded in `docs/evidence/v0.10a-validation.md` and `docs/evidence/v0.10b-validation.md`.

**Current boundary:** Repository posture PASS results prove reviewed desired-state invariants, not live Google Cloud effective state. Cloud Asset Inventory and Security Command Center remain explicitly planned; all 11 v0.10B repository rules still map to controls requiring live validation. The source collector is a focused checker over reviewed Terraform contracts and is not a general HCL/effective-state engine. No live Google Cloud asset/effective IAM/organization-policy/location inventory, real remote-state drift plan, out-of-band console change, reconciliation, finding lifecycle, or operational posture dashboard is claimed yet.

**Primary outcome:** Architecture and implemented controls now have a governed posture source of truth plus executable repository desired-state checks and tested drift decision logic, with machine-readable and reviewer-readable evidence. Live-state collection and drift validation remain deliberately gated on the v0.7 deployment path before v0.10C/D operationalize findings and reporting.

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