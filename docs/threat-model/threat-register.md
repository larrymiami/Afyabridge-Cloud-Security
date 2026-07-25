# Threat Register

## Purpose

This register records the initial threats identified for AfyaBridge Cloud Security. It is maintained alongside the architecture, security objectives, and control matrix.

Risk score is calculated as:

```text
likelihood × impact
```

| Score | Rating |
|---:|---|
| 1–4 | Low |
| 5–9 | Medium |
| 10–14 | High |
| 15–25 | Critical |

## Threat summary

| ID | Threat | STRIDE | L | I | Score | Rating | Status |
|---|---|---|---:|---:|---:|---|---|
| TH-001 | Compromised CHW account accesses authorised household data | Spoofing, Information Disclosure | 4 | 4 | 16 | Critical | Identified |
| TH-002 | Valid user accesses another country, programme, or region | Information Disclosure, Elevation of Privilege | 4 | 5 | 20 | Critical | Identified |
| TH-003 | Country administrator receives excessive privileges | Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-004 | CI/CD identity or federation trust is compromised | Spoofing, Elevation of Privilege | 4 | 5 | 20 | Critical | Identified |
| TH-005 | Database, object storage, or backup becomes publicly accessible | Information Disclosure | 3 | 5 | 15 | Critical | Identified |
| TH-006 | Secret is committed to source control, logs, images, or artifacts | Information Disclosure | 4 | 5 | 20 | Critical | Identified |
| TH-007 | Vulnerable or malicious dependency enters a release | Tampering, Elevation of Privilege | 4 | 4 | 16 | Critical | Identified |
| TH-008 | Tampered or unsigned container image is deployed | Tampering, Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-009 | Insecure infrastructure-as-code change weakens cloud controls | Tampering, Elevation of Privilege | 4 | 5 | 20 | Critical | Identified |
| TH-010 | Offline synchronisation request is replayed, altered, or duplicated | Tampering, Repudiation | 4 | 4 | 16 | Critical | Identified |
| TH-011 | Restricted data is written to application, platform, or CI logs | Information Disclosure | 4 | 4 | 16 | Critical | Identified |
| TH-012 | Health-education content is modified without approval | Tampering, Repudiation | 3 | 4 | 12 | High | Identified |
| TH-013 | Compromised workload identity enables lateral movement | Spoofing, Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-014 | KMS key or secret is accessed by an unauthorised identity | Information Disclosure, Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-015 | Cross-country analytics export contains identifiable data | Information Disclosure | 3 | 5 | 15 | Critical | Identified |
| TH-016 | Cloud posture drift creates an unmonitored exposure | Tampering, Information Disclosure | 4 | 4 | 16 | Critical | Identified |
| TH-017 | Monitoring or audit logging is disabled, bypassed, or incomplete | Repudiation | 3 | 5 | 15 | Critical | Identified |
| TH-018 | Public endpoint is abused for denial of service | Denial of Service | 4 | 4 | 16 | Critical | Identified |
| TH-019 | External identity, notification, or referral service fails or is compromised | Spoofing, Information Disclosure, Denial of Service | 3 | 4 | 12 | High | Identified |
| TH-020 | Lost or stolen CHW device exposes queued data or active sessions | Information Disclosure, Spoofing | 4 | 4 | 16 | Critical | Identified |
| TH-021 | Backup is exposed, retained too long, or restored without control | Information Disclosure, Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-022 | Regional disruption prevents access to critical workflows | Denial of Service | 3 | 5 | 15 | Critical | Identified |

## Threat records

### TH-001 — Compromised CHW account

- **Assets:** CHW identity, household, visit, and referral records
- **Trust boundaries:** TB-01, TB-02
- **Primary controls:** strong authentication, short-lived sessions, least-privilege roles, session revocation, access logging
- **Validation:** simulate stolen-session use, revoke the session, and confirm subsequent requests fail and alerts are generated
- **Residual risk:** an attacker may access data already authorised to the user before detection
- **Mapped objectives:** IAM-07, APP-02, MON-02, IR-02

### TH-002 — Cross-country or cross-programme access

- **Assets:** country records, programme assignments, restricted household and referral data
- **Trust boundaries:** TB-06, TB-07, TB-08
- **Primary controls:** country-scoped identities, server-side attribute checks, deny-by-default authorisation, separate projects and key boundaries
- **Validation:** cross-country and cross-programme requests must return `403`; country administrators must fail IAM access tests against other country projects
- **Residual risk:** approved global roles retain limited aggregated visibility
- **Mapped objectives:** IAM-03, APP-01, APP-02, KMS-01

### TH-003 — Excessive country-administrator privilege

- **Assets:** country users, configuration, records, and cloud resources
- **Trust boundaries:** TB-07, TB-11
- **Primary controls:** narrowly scoped roles, IAM Conditions, group-based assignments, temporary privilege, access reviews
- **Validation:** negative IAM tests and periodic access-review exercises
- **Residual risk:** monitored emergency access may temporarily exceed normal scope
- **Mapped objectives:** IAM-04, IAM-05, IAM-06, GOV-04

### TH-004 — Compromised CI/CD identity

- **Assets:** cloud projects, deployment pipeline, artifacts, and workloads
- **Trust boundaries:** TB-09
- **Primary controls:** Workload Identity Federation, no service-account keys, least-privilege deployer, protected environments, pinned workflow dependencies
- **Validation:** confirm no key material exists in GitHub and prove the deployment identity cannot perform prohibited actions
- **Residual risk:** an authorised but compromised workflow can act within its assigned deployment scope
- **Mapped objectives:** IAM-01, IAM-02, CICD-01, DEP-03, MON-01, IR-02

### TH-005 — Public data-service exposure

- **Assets:** operational data, exports, attachments, and backups
- **Trust boundaries:** TB-04, TB-15
- **Primary controls:** private connectivity, no public database endpoints, restricted bucket access, IaC policy gates, posture monitoring
- **Validation:** introduce a controlled public-access misconfiguration and verify prevention or rapid detection and remediation
- **Residual risk:** brief exposure may exist between drift introduction and detection
- **Mapped objectives:** NET-01, NET-06, CICD-03, CSPM-01

### TH-006 — Secret exposure

- **Assets:** API credentials, database credentials, signing material, and integration secrets
- **Trust boundaries:** TB-09, TB-12
- **Primary controls:** secret scanning, Secret Manager, masked workflows, image inspection, rotation procedures
- **Validation:** commit a recognisably fake test secret and verify the pull-request workflow fails
- **Residual risk:** unknown secret formats may evade pattern-based detection
- **Mapped objectives:** SEC-01, SEC-02, SEC-03, IR-01

### TH-007 — Vulnerable or malicious dependency

- **Assets:** application services, build pipeline, images, and operational data
- **Trust boundaries:** TB-09, TB-10
- **Primary controls:** lockfiles, approved registries, SCA, SBOMs, pinned dependencies, automated updates, release policy
- **Validation:** introduce a vulnerable transitive dependency and verify it appears in SCA and SBOM output and blocks release when policy requires
- **Residual risk:** zero-days or malicious packages without known indicators may pass build-time checks
- **Mapped objectives:** SUP-01, DEP-01, DEP-02, DEP-03, MON-04

### TH-008 — Untrusted container deployment

- **Assets:** runtime workloads, application code, and cloud data
- **Trust boundaries:** TB-10
- **Primary controls:** image signing, provenance, digest-based deployment, trusted registry, deployment admission policy
- **Validation:** attempt to deploy an unsigned or unapproved image and verify rejection
- **Residual risk:** compromise of an authorised signer or trusted build environment remains possible
- **Mapped objectives:** CICD-04, SUP-01, SUP-02, SUP-03, SUP-04

### TH-009 — Insecure infrastructure change

- **Assets:** IAM, networks, data services, logging, and security policies
- **Trust boundaries:** TB-09, TB-11
- **Primary controls:** reviewed Terraform, IaC scanning, policy as code, protected branches, controlled production deployment
- **Validation:** submit Terraform that creates a prohibited public or over-privileged resource and verify the pipeline blocks it
- **Residual risk:** scanner coverage may not detect every unsafe combination of valid resources
- **Mapped objectives:** CICD-03, GOV-03, CSPM-05

### TH-010 — Offline-sync replay or tampering

- **Assets:** queued submissions, household updates, and referral records
- **Trust boundaries:** TB-01, TB-03
- **Primary controls:** authenticated sync, request validation, idempotency keys, integrity checks, replay protection
- **Validation:** replay and alter queued requests and confirm duplicates and malformed payloads are rejected
- **Residual risk:** complex conflict resolution may still require manual review
- **Mapped objectives:** APP-04, RES-03

### TH-011 — Sensitive information in logs

- **Assets:** restricted household, maternal-care, referral, and authentication data
- **Trust boundaries:** TB-03, TB-12, TB-13
- **Primary controls:** structured logging, field allowlists, redaction, log-access controls, automated log inspection
- **Validation:** exercise sensitive workflows and scan logs for prohibited fields
- **Residual risk:** unexpected exception paths may emit unreviewed data
- **Mapped objectives:** APP-05, MON-01

### TH-012 — Unauthorised health-content modification

- **Assets:** health-education content and approval history
- **Trust boundaries:** TB-02, TB-11
- **Primary controls:** content-specific roles, approval workflow, immutable audit trail, change alerts
- **Validation:** attempt publication from an unauthorised role and verify denial and audit logging
- **Residual risk:** an authorised editor may publish incorrect content
- **Mapped objectives:** APP-06, MON-01, IR-03

### TH-013 — Workload lateral movement

- **Assets:** service accounts, APIs, country services, and data stores
- **Trust boundaries:** TB-03, TB-05, TB-06
- **Primary controls:** service account per workload, least privilege, network zoning, authenticated service calls, restricted egress
- **Validation:** compromise a test service identity and confirm it cannot access unrelated services or production resources
- **Residual risk:** required service dependencies create limited permitted attack paths
- **Mapped objectives:** IAM-02, NET-02, NET-03, NET-05, MON-01

### TH-014 — Unauthorised key or secret use

- **Assets:** KMS keys, secrets, encrypted application data
- **Trust boundaries:** TB-04, TB-11, TB-12
- **Primary controls:** country key boundaries, separation of administration and use, Secret Manager IAM, audit logging, access alerts
- **Validation:** attempt cross-country decrypt and unauthorised secret reads and verify denial and alerting
- **Residual risk:** an authorised workload can misuse material within its approved scope
- **Mapped objectives:** KMS-01, KMS-02, KMS-04, SEC-02, MON-03

### TH-015 — Identifiable analytics export

- **Assets:** analytics datasets, household identifiers, country reports
- **Trust boundaries:** TB-08, TB-14
- **Primary controls:** de-identification, approved export schemas, separate analytics access, automated field validation, audit logs
- **Validation:** inject prohibited identifiers into an export candidate and verify the export is rejected
- **Residual risk:** combinations of apparently non-identifying fields may permit re-identification
- **Mapped objectives:** APP-05, KMS-01, MON-01, GOV-04

### TH-016 — Cloud posture drift

- **Assets:** IAM, networking, storage, logging, and policy configuration
- **Trust boundaries:** TB-09, TB-11
- **Primary controls:** Terraform ownership, asset inventory, posture scanning, drift detection, remediation workflow
- **Validation:** make a controlled manual change and confirm it is detected, assigned, and reconciled
- **Residual risk:** detection latency may leave a short exposure window
- **Mapped objectives:** CSPM-05, CSPM-06, CSPM-07, GOV-03

### TH-017 — Logging disabled or bypassed

- **Assets:** audit evidence, security detections, and incident timelines
- **Trust boundaries:** TB-11, TB-13
- **Primary controls:** central log sinks, restricted logging administration, configuration monitoring, alerting on sink or policy changes
- **Validation:** attempt to disable a selected log path and verify prevention or alert generation
- **Residual risk:** service-specific logging gaps may remain
- **Mapped objectives:** MON-01, MON-06, GOV-03, IR-03

### TH-018 — Denial of service against public endpoints

- **Assets:** public application availability and sync APIs
- **Trust boundaries:** TB-01, TB-02
- **Primary controls:** Cloud Armor, rate limiting, autoscaling, request limits, health checks, graceful degradation
- **Validation:** controlled load and rate-limit tests against staging
- **Residual risk:** sufficiently large attacks or provider failures may still degrade service
- **Mapped objectives:** NET-04, MON-05, RES-01

### TH-019 — External integration failure or compromise

- **Assets:** user authentication, notifications, referral exchange, and availability
- **Trust boundaries:** TB-05
- **Primary controls:** scoped credentials, signed requests where supported, timeouts, retries, circuit breakers, data minimisation
- **Validation:** simulate provider failure and invalid responses and verify safe degradation and alerting
- **Residual risk:** service availability and security partially depend on the external provider
- **Mapped objectives:** MON-01, IR-01, RES-01

### TH-020 — Lost or stolen CHW device

- **Assets:** active sessions, offline queue, and locally cached assignments
- **Trust boundaries:** TB-01
- **Primary controls:** minimal local storage, protected browser storage, short-lived sessions, remote revocation, offline-data expiry
- **Validation:** revoke a simulated lost device session and verify queued data is not exposed through unauthenticated access
- **Residual risk:** data visible before revocation may remain exposed on a compromised device
- **Mapped objectives:** IAM-07, APP-04, IR-01

### TH-021 — Backup exposure or unsafe restore

- **Assets:** backups, restored databases, encryption keys, and historical records
- **Trust boundaries:** TB-04, TB-15
- **Primary controls:** encrypted backups, restricted restore roles, retention rules, isolated restore testing, audit logs
- **Validation:** perform a controlled restore using the approved identity and prove unauthorised identities are denied
- **Residual risk:** backups extend the lifetime of sensitive historical data
- **Mapped objectives:** KMS-01, KMS-02, RES-02

### TH-022 — Regional service disruption

- **Assets:** application availability, sync ingestion, and operational continuity
- **Trust boundaries:** TB-02, TB-03, TB-04
- **Primary controls:** multi-region design, queues, backups, health checks, documented failover and recovery procedures
- **Validation:** simulate a regional backend failure and execute recovery within documented targets
- **Residual risk:** correlated provider or dependency failures may exceed the designed recovery model
- **Mapped objectives:** RES-01, RES-02, RES-04

## Maintenance rules

- Threat IDs remain stable after creation.
- New threats receive the next sequential identifier.
- Risk scores are reassessed when controls are implemented or architecture changes.
- A threat is marked **Mitigated** only after its required validation succeeds and evidence is recorded.
- Accepted or deferred risks require an owner, rationale, and review date.
- Objective references must use identifiers defined in [`../security-objectives.md`](../security-objectives.md).
- Control references must use identifiers defined in [`../security-control-matrix.md`](../security-control-matrix.md).
