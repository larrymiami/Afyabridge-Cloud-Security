# Threat Register

## Purpose

This register records the initial threats identified for AfyaBridge Cloud Security. It is a living document and will be updated as architecture, implementation status, controls, and validation evidence evolve.

Risk score is calculated as:

```text
likelihood × impact
```

Ratings:

| Score | Rating |
|---:|---|
| 1–4 | Low |
| 5–9 | Medium |
| 10–14 | High |
| 15–25 | Critical |

## Initial threat summary

| ID | Threat | STRIDE | Likelihood | Impact | Score | Rating | Status |
|---|---|---|---:|---:|---:|---|---|
| TH-001 | Compromised CHW account accesses assigned household data | Spoofing, Information Disclosure | 4 | 4 | 16 | Critical | Identified |
| TH-002 | Valid user accesses another country or programme | Information Disclosure, Elevation of Privilege | 4 | 5 | 20 | Critical | Identified |
| TH-003 | Country administrator receives excessive privileges | Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-004 | Long-lived CI/CD credential is stolen or leaked | Spoofing, Elevation of Privilege | 4 | 5 | 20 | Critical | Identified |
| TH-005 | Database or object storage becomes publicly accessible | Information Disclosure | 3 | 5 | 15 | Critical | Identified |
| TH-006 | Secret is committed to source control or build output | Information Disclosure | 4 | 5 | 20 | Critical | Identified |
| TH-007 | Vulnerable or malicious dependency enters a release | Tampering, Elevation of Privilege | 4 | 4 | 16 | Critical | Identified |
| TH-008 | Tampered or unsigned container image is deployed | Tampering, Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-009 | Insecure Terraform change weakens cloud controls | Tampering, Elevation of Privilege | 4 | 5 | 20 | Critical | Identified |
| TH-010 | Offline synchronisation request is replayed or altered | Tampering, Repudiation | 4 | 4 | 16 | Critical | Identified |
| TH-011 | Restricted data is written to application or audit logs | Information Disclosure | 4 | 4 | 16 | Critical | Identified |
| TH-012 | Health-education content is modified without approval | Tampering, Repudiation | 3 | 4 | 12 | High | Identified |
| TH-013 | Compromised service account enables lateral movement | Spoofing, Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-014 | KMS key or secret is accessed by an unauthorised workload | Information Disclosure, Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-015 | Cross-country analytics export contains identifiable data | Information Disclosure | 3 | 5 | 15 | Critical | Identified |
| TH-016 | Cloud posture drift creates an unmonitored exposure | Tampering, Information Disclosure | 4 | 4 | 16 | Critical | Identified |
| TH-017 | Monitoring or audit logging is disabled or bypassed | Repudiation | 3 | 5 | 15 | Critical | Identified |
| TH-018 | Public endpoint is abused for denial of service | Denial of Service | 4 | 4 | 16 | Critical | Identified |
| TH-019 | Third-party notification or identity integration fails or is compromised | Spoofing, Information Disclosure, Denial of Service | 3 | 4 | 12 | High | Identified |
| TH-020 | Lost or stolen CHW device exposes queued data or active sessions | Information Disclosure, Spoofing | 4 | 4 | 16 | Critical | Identified |
| TH-021 | Backup is exposed, retained too long, or restored without control | Information Disclosure, Elevation of Privilege | 3 | 5 | 15 | Critical | Identified |
| TH-022 | Regional disruption prevents access to critical workflows | Denial of Service | 3 | 5 | 15 | Critical | Identified |

---

## Threat details

### TH-001 — Compromised CHW account

**Affected assets:** CHW identity, assigned household records, visit and referral data  
**Trust boundaries:** TB-01, TB-02  
**Threat source:** Credential theft, phishing, session theft, device compromise  
**Description:** An attacker uses a valid CHW account or session to access or alter records within the user’s assigned scope.

**Preventive controls**

- strong authentication;
- short-lived sessions;
- secure cookies and session handling;
- least-privilege application roles;
- device/session revocation;
- rate limiting and anomaly-resistant authentication flows.

**Detective controls**

- authentication and access logs;
- abnormal login and enumeration detections;
- alerts for unusual geographic or behavioural patterns.

**Response and recovery controls**

- revoke sessions;
- disable or reset the identity;
- review accessed records;
- initiate the compromised-account playbook.

**Validation**

- simulate stolen-session use;
- verify revocation blocks subsequent access;
- confirm relevant logs and alerts are generated.

**Residual risk:** A compromised valid user may access records already authorised to that user before detection.  
**Mapped objectives:** ID-01, ID-04, APP-03, MON-02, IR-02  
**Status:** Identified

### TH-002 — Cross-country or cross-programme access

**Affected assets:** Country records, programme assignments, restricted household and referral data  
**Trust boundaries:** TB-06, TB-07, TB-08  
**Threat source:** Broken authorisation, incorrect claims, broad administrative permissions  
**Description:** A valid user or workload accesses records outside its authorised country, programme, or geographic scope.

**Preventive controls**

- country-specific projects and identities;
- RBAC combined with attribute-based checks;
- server-side country and programme enforcement;
- deny-by-default service access;
- separate data and encryption boundaries where practical.

**Detective controls**

- cross-boundary access logs;
- denied-access metrics;
- alerts for repeated cross-country requests.

**Response and recovery controls**

- revoke the offending identity;
- review exposed records;
- correct role or policy assignments;
- re-run authorisation test suites.

**Validation**

- automated tests requiring cross-country requests to return `403`;
- IAM tests proving country administrators cannot access another country project.

**Residual risk:** Global operational roles may retain limited approved cross-country visibility.  
**Mapped objectives:** ID-03, APP-01, APP-02, NET-04, KMS-03  
**Status:** Identified

### TH-003 — Excessive country-administrator privilege

**Affected assets:** Country users, configuration, operational records, cloud resources  
**Trust boundaries:** TB-07, TB-11  
**Threat source:** Over-broad predefined roles, privilege accumulation, poor access review  
**Description:** A country administrator receives permissions that allow global administration, direct cloud modification, or access to restricted data beyond operational need.

**Preventive controls**

- custom or narrowly scoped roles;
- separation between application and cloud administration;
- IAM Conditions;
- group-based assignments;
- temporary privilege elevation.

**Detective controls**

- periodic access review;
- IAM policy analysis;
- alerts for privileged-role grants.

**Response and recovery controls**

- remove the excessive binding;
- review actions taken during the exposure window;
- update role definitions and approval procedures.

**Validation**

- negative IAM tests;
- quarterly simulated access review.

**Residual risk:** Emergency access may temporarily exceed normal scope.  
**Mapped objectives:** ID-02, ID-05, ID-06, GOV-04  
**Status:** Identified

### TH-004 — Stolen or leaked CI/CD credential

**Affected assets:** Google Cloud projects, deployment pipeline, artifacts, production workloads  
**Trust boundaries:** TB-09  
**Threat source:** Leaked service-account key, compromised repository, malicious workflow  
**Description:** An attacker obtains deployment credentials and modifies cloud resources or deploys unauthorised workloads.

**Preventive controls**

- Workload Identity Federation;
- no downloadable CI/CD service-account keys;
- least-privilege deployment roles;
- protected environments and approval gates;
- pinned workflow dependencies.

**Detective controls**

- deployment audit logs;
- alerts for unexpected identity use or policy changes;
- repository and workflow change review.

**Response and recovery controls**

- disable the federation binding or deployment identity;
- stop active workflows;
- roll back unauthorised deployments;
- inspect artifact provenance and audit logs.

**Validation**

- confirm no key material is stored in GitHub;
- attempt prohibited cloud actions from the deployer identity;
- simulate disabling the identity during an incident.

**Residual risk:** Compromise of an authorised workflow could still perform actions within its permitted deployment scope.  
**Mapped objectives:** ID-01, DEV-01, DEV-02, IR-03  
**Status:** Identified

### TH-005 — Public database or storage exposure

**Affected assets:** Operational data, backups, exports, attachments  
**Trust boundaries:** TB-04, TB-15  
**Threat source:** Misconfiguration, insecure Terraform, manual change  
**Description:** A database, bucket, or backup becomes publicly reachable or anonymously readable.

**Preventive controls**

- private connectivity;
- uniform bucket-level access;
- organisation and IaC policies;
- no public database endpoints;
- required review for infrastructure changes.

**Detective controls**

- CSPM findings;
- Cloud Asset Inventory queries;
- alerts for public-access policy changes.

**Response and recovery controls**

- remove public access;
- preserve logs and determine exposure duration;
- rotate affected secrets;
- assess accessed objects or records.

**Validation**

- introduce a controlled public-access misconfiguration;
- verify detection and remediation;
- confirm public connectivity tests fail after correction.

**Residual risk:** Brief exposure may occur between drift introduction and detection.  
**Mapped objectives:** NET-02, NET-03, CSPM-01, CSPM-02, IR-01  
**Status:** Identified

### TH-006 — Secret committed to source or build output

**Affected assets:** API credentials, database credentials, signing material, external integration secrets  
**Trust boundaries:** TB-09, TB-12  
**Threat source:** Developer error, unsafe logging, generated files  
**Description:** A secret is committed to Git, printed in CI logs, copied into an image, or stored in an artifact.

**Preventive controls**

- pre-commit and CI secret scanning;
- Secret Manager;
- secure workflow masking;
- image and artifact inspection;
- no long-lived service-account keys.

**Detective controls**

- repository secret scanning;
- Gitleaks pipeline gate;
- audit logs for secret access.

**Response and recovery controls**

- revoke and rotate the secret;
- remove it from repository history where required;
- identify all uses;
- document the incident timeline.

**Validation**

- commit a recognisably fake test secret on a test branch;
- confirm the pipeline blocks the change.

**Residual risk:** A novel secret format may evade pattern-based detection.  
**Mapped objectives:** ID-01, KMS-04, DEV-03, IR-03  
**Status:** Identified

### TH-007 — Vulnerable or malicious dependency

**Affected assets:** Application services, build pipeline, container images, user data  
**Trust boundaries:** TB-09, TB-10  
**Threat source:** Vulnerable direct or transitive package, typosquatting, compromised upstream  
**Description:** A dependency introduces exploitable code or malicious behaviour into a build.

**Preventive controls**

- lockfiles and pinned versions;
- approved package sources;
- dependency policy;
- automated updates and review;
- license and provenance checks where practical.

**Detective controls**

- SCA and OSV scanning;
- SBOM generation;
- scheduled rescanning;
- alerts for newly disclosed vulnerabilities.

**Response and recovery controls**

- block release;
- update or replace the dependency;
- rebuild, rescan, sign, and redeploy;
- inspect affected releases through their SBOMs.

**Validation**

- introduce a vulnerable transitive dependency;
- verify the gate and SBOM identify it.

**Residual risk:** A zero-day or malicious package may not have a known advisory at build time.  
**Mapped objectives:** SUP-01, DEP-01, DEP-02, DEP-03, DEP-04  
**Status:** Identified

### TH-008 — Tampered or unsigned container image

**Affected assets:** Runtime workloads, application code, cloud data  
**Trust boundaries:** TB-10  
**Threat source:** Registry compromise, tag replacement, untrusted build path  
**Description:** An image not produced by the approved pipeline is deployed to Cloud Run or GKE.

**Preventive controls**

- image signing;
- provenance attestations;
- digest-based deployment;
- trusted registry controls;
- Binary Authorization where supported.

**Detective controls**

- artifact and deployment audit logs;
- signature and attestation verification;
- registry vulnerability scanning.

**Response and recovery controls**

- block or remove the image;
- roll back to a trusted digest;
- investigate source and build provenance.

**Validation**

- attempt to deploy an unsigned image;
- verify policy rejection.

**Residual risk:** Compromise of an authorised signer or trusted build environment remains possible.  
**Mapped objectives:** SUP-01, SUP-02, SUP-03, SUP-04  
**Status:** Identified

### TH-009 — Insecure infrastructure-as-code change

**Affected assets:** IAM, networks, databases, logging, security policies  
**Trust boundaries:** TB-09, TB-11  
**Threat source:** Developer error, malicious pull request, unsafe module default  
**Description:** A Terraform change grants excessive access, creates public exposure, disables logging, or deploys into an unapproved region.

**Preventive controls**

- peer review;
- IaC scanning;
- policy-as-code;
- protected production branches;
- Terraform-only production changes.

**Detective controls**

- plan review;
- CSPM and drift detection;
- audit logs for out-of-band changes.

**Response and recovery controls**

- reject or revert the change;
- remediate through Terraform;
- investigate any deployment that occurred.

**Validation**

- add known insecure Terraform resources;
- verify Checkov or equivalent gates block them.

**Residual risk:** Custom or context-specific misconfigurations may not be covered by generic rules.  
**Mapped objectives:** DEV-05, CSPM-01, GOV-01, GOV-02, GOV-03  
**Status:** Identified

### TH-010 — Replayed or altered offline submission

**Affected assets:** Household visits, referrals, maternal follow-up records, audit history  
**Trust boundaries:** TB-05  
**Threat source:** Client tampering, network replay, stale queue, malicious user  
**Description:** An offline payload is modified, replayed, duplicated, submitted out of order, or applied outside the user’s authorised scope.

**Preventive controls**

- server-side authorisation;
- idempotency keys;
- version checks;
- request expiry;
- payload validation;
- conflict-resolution rules.

**Detective controls**

- duplicate and replay metrics;
- rejected-sync logs;
- anomaly alerts for unusual submission volume.

**Response and recovery controls**

- reject or quarantine the submission;
- reverse incorrect state changes where possible;
- review affected records and identity activity.

**Validation**

- replay the same request;
- alter country or household identifiers;
- submit stale versions;
- verify safe rejection or idempotent handling.

**Residual risk:** Complex legitimate conflicts may still require manual resolution.  
**Mapped objectives:** APP-01, APP-04, MON-01, IR-02, RES-04  
**Status:** Identified

### TH-011 — Restricted data in logs

**Affected assets:** Household data, maternal-care notes, tokens, secrets, identifiers  
**Trust boundaries:** TB-14  
**Threat source:** Unsafe debug statements, exception logging, request-body capture  
**Description:** Sensitive fields appear in application, proxy, pipeline, or audit logs and become accessible to broader operational roles.

**Preventive controls**

- structured logging standards;
- field redaction;
- allowlisted log fields;
- no request-body logging for restricted endpoints;
- secret masking in CI.

**Detective controls**

- log-sampling tests;
- automated searches for restricted field names or patterns;
- access monitoring for sensitive log stores.

**Response and recovery controls**

- stop the logging source;
- restrict or delete affected logs according to procedure;
- rotate exposed secrets;
- review access history.

**Validation**

- submit synthetic restricted values;
- verify they do not appear in logs.

**Residual risk:** Unexpected framework or third-party error messages may include sensitive content.  
**Mapped objectives:** DATA-02, MON-01, MON-03, GOV-05  
**Status:** Identified

### TH-012 — Unauthorised health-content modification

**Affected assets:** Approved health-education content, publication status, audit history  
**Trust boundaries:** TB-02, TB-11  
**Threat source:** Compromised administrator, broken role enforcement, missing approval workflow  
**Description:** A user modifies or publishes health-education content without appropriate country or programme approval.

**Preventive controls**

- separate author and approver roles;
- country and programme scoping;
- immutable version history;
- approval workflow.

**Detective controls**

- content-change audit logs;
- alerts for unusual bulk changes;
- periodic review of published versions.

**Response and recovery controls**

- unpublish or roll back the content;
- revoke the responsible session;
- review affected programmes.

**Validation**

- attempt publication with an author-only identity;
- verify denial and audit evidence.

**Residual risk:** An authorised approver may publish inaccurate content; clinical governance is outside this repository’s scope.  
**Mapped objectives:** APP-02, ID-05, MON-01  
**Status:** Identified

### TH-013 — Compromised workload identity and lateral movement

**Affected assets:** Internal APIs, data stores, secrets, queues, shared services  
**Trust boundaries:** TB-03, TB-04, TB-06, TB-12  
**Threat source:** Application exploit, vulnerable dependency, container compromise  
**Description:** A compromised service uses its identity or network access to reach unrelated services or data.

**Preventive controls**

- separate service accounts;
- least-privilege IAM;
- service-to-service authentication;
- NetworkPolicies or equivalent restrictions;
- per-service database roles;
- scoped secret access.

**Detective controls**

- service-level audit logs;
- unusual IAM-denial and network-flow patterns;
- runtime security detections where available.

**Response and recovery controls**

- disable the service account;
- isolate or scale down the workload;
- rotate affected secrets;
- redeploy a trusted image.

**Validation**

- attempt prohibited service and secret access from each workload identity.

**Residual risk:** A service may still misuse resources it legitimately requires.  
**Mapped objectives:** ID-02, NET-04, KMS-04, MON-02, IR-04  
**Status:** Identified

### TH-014 — Unauthorised secret or KMS key access

**Affected assets:** Secrets, encryption keys, encrypted application and backup data  
**Trust boundaries:** TB-12  
**Threat source:** Excessive IAM, compromised workload, insider misuse  
**Description:** A user or workload reads a secret or performs encryption/decryption with a key outside its approved scope.

**Preventive controls**

- per-service secret permissions;
- country- and environment-specific keys;
- separation of key administration and use;
- IAM Conditions where practical;
- no broad secret accessor roles.

**Detective controls**

- Secret Manager and KMS audit logs;
- alerts for abnormal access volume or unexpected principals.

**Response and recovery controls**

- revoke access;
- disable or rotate the key or secret;
- assess data affected by the principal;
- re-encrypt where necessary.

**Validation**

- verify services cannot access another service or country’s secret and key.

**Residual risk:** An authorised workload can misuse decrypted data after legitimate access.  
**Mapped objectives:** KMS-01, KMS-02, KMS-03, KMS-04  
**Status:** Identified

### TH-015 — Identifiable data in analytics export

**Affected assets:** Household identifiers, contact data, maternal-care records, analytics datasets  
**Trust boundaries:** TB-08  
**Threat source:** Faulty transformation, schema drift, direct database export  
**Description:** An analytics pipeline exports restricted or identifying fields to a broader-access dataset.

**Preventive controls**

- approved export schemas;
- de-identification and aggregation;
- separate analytics identity;
- no direct analyst access to operational stores;
- data-classification checks.

**Detective controls**

- automated schema tests;
- sensitive-data scanning where available;
- dataset-access auditing.

**Response and recovery controls**

- disable the export;
- restrict or remove the affected dataset;
- review access history;
- correct and re-run the pipeline.

**Validation**

- seed synthetic identifiers and verify they do not appear in approved analytics outputs.

**Residual risk:** Re-identification may still be possible from combinations of low-volume attributes.  
**Mapped objectives:** DATA-01, DATA-02, GOV-05  
**Status:** Identified

### TH-016 — Undetected cloud posture drift

**Affected assets:** IAM, networks, storage, logging, region restrictions, security policies  
**Trust boundaries:** TB-06, TB-11, TB-14  
**Threat source:** Manual change, service default, configuration regression  
**Description:** A deployed cloud resource deviates from approved configuration and remains undetected.

**Preventive controls**

- Terraform-managed infrastructure;
- organisation policies where available;
- restricted manual changes;
- mandatory labels and approved regions.

**Detective controls**

- Security Command Center;
- Cloud Asset Inventory queries;
- scheduled drift detection;
- policy-compliance reports.

**Response and recovery controls**

- remediate through infrastructure code;
- investigate the change source;
- create or improve preventive policy.

**Validation**

- introduce controlled drift such as a public bucket or broad firewall rule;
- verify detection and remediation evidence.

**Residual risk:** Detection coverage depends on available services and custom rule quality.  
**Mapped objectives:** CSPM-01, CSPM-02, CSPM-03, GOV-01  
**Status:** Identified

### TH-017 — Monitoring or logging disabled

**Affected assets:** Audit trails, security findings, incident evidence, operational visibility  
**Trust boundaries:** TB-14  
**Threat source:** Attacker evasion, administrator error, cost-driven exclusion  
**Description:** Logging, export sinks, alerts, or detections are disabled or altered, reducing visibility into malicious activity.

**Preventive controls**

- centralised logging configuration;
- restricted log-administration roles;
- policy-controlled sinks and retention;
- separation of workload and logging administration.

**Detective controls**

- alerts on sink, exclusion, and audit-configuration changes;
- heartbeat or expected-event validation;
- posture checks.

**Response and recovery controls**

- restore logging configuration;
- investigate activity during the blind period;
- preserve remaining evidence.

**Validation**

- alter a test alert or logging configuration;
- verify an independent detection identifies the change.

**Residual risk:** Some events may be unrecoverable if telemetry was not generated during the gap.  
**Mapped objectives:** MON-01, MON-02, MON-03, IR-01  
**Status:** Identified

### TH-018 — Public endpoint denial of service

**Affected assets:** CHW access, referral workflows, public APIs, cloud budget  
**Trust boundaries:** TB-01, TB-02  
**Threat source:** Automated abuse, request floods, expensive query patterns  
**Description:** An attacker or faulty client overwhelms public endpoints, exhausts quotas, or creates unexpected cost.

**Preventive controls**

- Cloud Armor rate limits;
- request-size and concurrency limits;
- efficient queries and bounded workloads;
- quotas and budget alerts;
- asynchronous processing for expensive tasks.

**Detective controls**

- latency, error-rate, request-volume, and cost alerts;
- WAF and load-balancer telemetry.

**Response and recovery controls**

- block or throttle sources;
- adjust scaling and quotas;
- disable abused endpoints if required;
- review cost impact.

**Validation**

- run a controlled request burst;
- verify throttling, availability, and alerts.

**Residual risk:** Large distributed attacks may exceed lab-level protections or budgets.  
**Mapped objectives:** NET-01, MON-02, RES-01, GOV-06  
**Status:** Identified

### TH-019 — External integration compromise or failure

**Affected assets:** User identity, notification data, referral information, service availability  
**Trust boundaries:** TB-13  
**Threat source:** Third-party outage, stolen API credential, malicious response  
**Description:** An external identity, notification, or referral provider exposes data, returns unsafe content, or becomes unavailable.

**Preventive controls**

- minimal data sharing;
- authenticated APIs;
- scoped and rotated credentials;
- strict response validation;
- explicit egress controls.

**Detective controls**

- integration error and latency metrics;
- unusual outbound-volume alerts;
- credential-use auditing where available.

**Response and recovery controls**

- disable the integration;
- rotate credentials;
- queue or retry safely;
- use a documented fallback process.

**Validation**

- simulate provider timeout, invalid response, and rejected credential.

**Residual risk:** Availability and security of the external provider remain partly outside project control.  
**Mapped objectives:** NET-05, KMS-04, MON-02, RES-04  
**Status:** Identified

### TH-020 — Lost or stolen field device

**Affected assets:** Active sessions, offline queue, assigned household data  
**Trust boundaries:** TB-01, TB-05  
**Threat source:** Physical device loss or theft  
**Description:** An unauthorised person accesses locally stored data or an active user session on a field device.

**Preventive controls**

- minimal local data retention;
- short-lived tokens;
- secure browser storage choices;
- re-authentication for sensitive operations;
- queue expiration.

**Detective controls**

- user-reported device loss;
- unusual session and device activity;
- access logs.

**Response and recovery controls**

- remote session revocation;
- disable the account if necessary;
- review records accessed after the loss;
- reassign work safely.

**Validation**

- revoke a test device session and verify queued operations cannot synchronise.

**Residual risk:** Data already displayed or cached by the device may remain accessible outside server control.  
**Mapped objectives:** APP-03, APP-04, ID-04, IR-02  
**Status:** Identified

### TH-021 — Backup exposure or uncontrolled restore

**Affected assets:** Operational data, encryption keys, restored environments  
**Trust boundaries:** TB-15  
**Threat source:** Broad backup permissions, public storage, weak retention, unsafe restore test  
**Description:** A backup is exposed, retained beyond policy, or restored into an environment with weaker controls.

**Preventive controls**

- encrypted backups;
- restricted backup and restore roles;
- retention and deletion policies;
- approved isolated restore environment;
- no public backup storage.

**Detective controls**

- backup-access audit logs;
- retention and policy checks;
- alerts for restore operations.

**Response and recovery controls**

- revoke access;
- remove uncontrolled copies;
- rotate affected keys if needed;
- investigate restoration activity.

**Validation**

- restore into an isolated environment;
- verify access controls, encryption, and cleanup.

**Residual risk:** A compromised authorised restore identity can create a temporary data copy.  
**Mapped objectives:** KMS-05, RES-02, RES-03, GOV-05  
**Status:** Identified

### TH-022 — Regional service disruption

**Affected assets:** Application availability, queued submissions, referrals, operational dashboards  
**Trust boundaries:** Cross-region platform boundary  
**Threat source:** Regional cloud outage, network partition, service dependency failure  
**Description:** A regional disruption prevents users from reaching services or delays processing beyond recovery targets.

**Preventive controls**

- multi-region or recoverable deployment design;
- durable queues;
- backups;
- idempotent processing;
- documented failover and rollback procedures.

**Detective controls**

- regional health checks;
- availability and queue-depth alerts;
- synthetic monitoring.

**Response and recovery controls**

- route to an available region or restore service;
- process queued work safely;
- communicate operational status;
- verify data consistency.

**Validation**

- remove or disable a regional backend in the lab;
- measure detection, recovery time, and data consistency.

**Residual risk:** Some managed data services may have region-specific recovery constraints and cost trade-offs.  
**Mapped objectives:** RES-01, RES-02, RES-03, RES-04  
**Status:** Identified

## Register maintenance

The register must be updated when:

- a threat is validated or mitigated;
- a control changes;
- evidence is produced;
- a new service, country, region, or integration is introduced;
- an incident reveals a new attack path;
- residual risk is accepted or deferred.

Future revisions will add control identifiers, evidence paths, owners, review dates, and residual-risk scores.
