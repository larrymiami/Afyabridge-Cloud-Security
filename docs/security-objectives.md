# Security Objectives

## 1. Purpose

This document defines the measurable security objectives for AfyaBridge Cloud Security. The objectives translate the project scenario into controls that can be implemented, tested, and evidenced throughout the project.

Each objective has:

- a unique identifier;
- a security outcome;
- measurable success criteria;
- expected evidence;
- a target delivery phase.

The objectives are deliberately outcome-focused. Installing a security tool does not satisfy an objective unless the expected security behaviour is demonstrated.

## 2. Security principles

The project adopts the following principles:

1. Least privilege.
2. Zero standing privilege where practical.
3. Strong separation between countries and environments.
4. No long-lived cloud credentials in CI/CD.
5. Private-by-default networking and data services.
6. Encryption in transit and at rest.
7. Security controls and infrastructure managed as code.
8. Traceable and trusted software artifacts.
9. Continuous posture monitoring after deployment.
10. Tested incident response and recovery.

## 3. Identity and access management

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| IAM-01 | Eliminate long-lived CI/CD credentials | GitHub Actions authenticates to Google Cloud through Workload Identity Federation; no service-account key is stored in GitHub | Workflow configuration, IAM policy, successful deployment logs | v0.6–v0.8 |
| IAM-02 | Separate workload identities | Every deployable service uses a dedicated service account with only required permissions | IAM inventory, Terraform, access tests | v0.8 |
| IAM-03 | Enforce country-scoped administration | A country administrator cannot read or manage another country’s resources or application records | Automated authorization tests returning `403`, IAM policy evidence | v0.3–v0.8 |
| IAM-04 | Limit standing privilege | Privileged access is time-bound, approved, or provided through a monitored break-glass process | Access design, test activation, audit logs | v0.3–v0.9 |
| IAM-05 | Enforce separation of duties | Developers cannot directly modify production infrastructure; key administrators cannot read protected application data by default | Role matrix, denied-access tests | v0.3–v0.9 |
| IAM-06 | Support access review | Human and service identities can be inventoried, assigned an owner, and reviewed against intended access | Access-review report and stale-access findings | v0.9 |
| IAM-07 | Protect application sessions | Lost or compromised CHW sessions can be revoked without disabling unrelated users | Revocation test and audit event | v0.5–v0.10 |

## 4. Application and tenant isolation

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| APP-01 | Prevent cross-country record access | Requests for records outside the user’s country return `403` regardless of guessed identifiers | Integration test results | v0.5–v0.6 |
| APP-02 | Prevent cross-programme and cross-region access | CHWs and supervisors can access only assigned programmes and geographic areas | Authorization test suite | v0.5–v0.6 |
| APP-03 | Protect facility referral data | Facility workers receive only the minimum data required for an assigned referral | API response tests and role matrix | v0.5–v0.6 |
| APP-04 | Protect offline synchronisation | Sync requests are authenticated, validated, idempotent, and reject malformed or replayed submissions | Security tests and duplicate-submission evidence | v0.5–v0.10 |
| APP-05 | Prevent sensitive log leakage | Restricted fields do not appear in application, pipeline, or platform logs | Automated log inspection and sample evidence | v0.5–v0.10 |
| APP-06 | Protect approved health content | Only authorised roles can publish or modify health-education content, and changes are auditable | Authorization tests and audit logs | v0.5–v0.10 |

## 5. Network security

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| NET-01 | Prevent public database exposure | No production database has a public IP address or internet-reachable endpoint | Terraform plan, connectivity test, asset inventory | v0.4–v0.8 |
| NET-02 | Enforce network zoning | Only documented communication paths between edge, application, data, management, analytics, and security zones are permitted | Network diagram, firewall policy, connectivity tests | v0.4–v0.8 |
| NET-03 | Default-deny unnecessary traffic | Unapproved ingress and egress attempts fail | Negative connectivity tests | v0.4–v0.8 |
| NET-04 | Protect public entry points | Public traffic passes through approved load-balancing and web-protection controls | Architecture evidence, WAF and rate-limit tests | v0.8–v0.10 |
| NET-05 | Isolate production from non-production | Non-production workloads cannot reach production data services or management interfaces | Connectivity and IAM tests | v0.4–v0.8 |
| NET-06 | Restrict sensitive service access | Sensitive Google Cloud services are accessed through approved private or controlled paths where practical | Network configuration and test evidence | v0.8–v0.9 |

## 6. Secrets, encryption, and key management

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| KMS-01 | Separate country encryption boundaries | Country workloads cannot use another country’s assigned encryption keys | Denied decrypt test and KMS IAM policy | v0.8–v0.9 |
| KMS-02 | Separate key administration from key use | Key administrators manage keys without receiving application decrypt permissions by default | IAM matrix and denied-access test | v0.3–v0.9 |
| KMS-03 | Rotate cryptographic keys | Managed keys have documented rotation schedules and successful rotation evidence | KMS configuration and audit logs | v0.9 |
| KMS-04 | Monitor sensitive key use | Selected unusual decrypt or key-administration events generate alerts | Alert rule and simulation evidence | v0.9–v0.11 |
| SEC-01 | Keep secrets out of source control | A committed test secret causes the pull-request workflow to fail | Failed Gitleaks job and remediation commit | v0.6 |
| SEC-02 | Centralise runtime secrets | Application secrets are retrieved from Secret Manager and are not baked into images or Terraform state in plaintext | Runtime configuration, image inspection, state review | v0.8 |
| SEC-03 | Support secret rotation | At least one application secret can be rotated without rebuilding source code | Rotation test and service recovery evidence | v0.8–v0.11 |

## 7. DevSecOps and software supply-chain security

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| CICD-01 | Enforce pull-request security gates | Pull requests cannot merge when mandatory tests or security scans fail | Branch rules and failed PR example | v0.6 |
| CICD-02 | Detect insecure source code | Selected intentionally insecure patterns are detected by SAST | Scanner report and blocked pipeline | v0.6 |
| CICD-03 | Detect infrastructure misconfiguration | Critical Terraform misconfigurations fail the pipeline before apply | Checkov or equivalent report | v0.6 |
| CICD-04 | Detect vulnerable containers | Images with prohibited critical vulnerabilities cannot be promoted | Trivy or equivalent report and failed gate | v0.6–v0.7 |
| SUP-01 | Produce an SBOM for every release | Each release image has a machine-readable CycloneDX or SPDX SBOM | Release artifact and CI evidence | v0.7 |
| SUP-02 | Sign release artifacts | Every production-eligible image is cryptographically signed | Signature verification output | v0.7 |
| SUP-03 | Enforce trusted deployment | Unsigned or unapproved images cannot deploy to the protected runtime | Denied deployment evidence | v0.7–v0.8 |
| SUP-04 | Track build provenance | Production artifacts can be traced to source commit, workflow, and build environment | Attestation and provenance record | v0.7 |
| DEP-01 | Manage dependency risk | Critical dependencies with a known fix block release; exceptions require documented approval | Dependency policy, scanner result, exception record | v0.6–v0.9 |
| DEP-02 | Detect transitive risk | At least one vulnerable transitive dependency is identified through the SBOM or SCA tooling | Dependency tree and report | v0.7 |
| DEP-03 | Pin build dependencies | Third-party GitHub Actions and build dependencies are pinned to approved versions or commit SHAs | Workflow review evidence | v0.6–v0.7 |

## 8. Cloud security posture management

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| CSPM-01 | Detect public data exposure | A controlled public-storage or public-database misconfiguration produces a finding or alert | Finding, alert, and remediation evidence | v0.9 |
| CSPM-02 | Detect excessive IAM | A controlled broad IAM grant is identified and removed | Finding and policy diff | v0.9 |
| CSPM-03 | Enforce approved locations | Resources created outside approved regions are blocked or reported | Policy result and failed deployment | v0.2–v0.9 |
| CSPM-04 | Detect service-account keys | New user-managed service-account keys are prohibited or immediately detected | Organization policy or alert evidence | v0.2–v0.9 |
| CSPM-05 | Detect posture drift | A manual change outside Terraform is detected and reconciled | Drift report and remediation pull request | v0.9–v0.10 |
| CSPM-06 | Maintain asset visibility | Cloud assets can be inventoried by owner, country, environment, and data classification | Asset inventory report | v0.2–v0.9 |
| CSPM-07 | Track remediation | Findings have severity, owner, status, due date, and closure evidence | Findings register or dashboard | v0.9 |

## 9. Governance and policy as code

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| GOV-01 | Enforce resource metadata | Resources missing required owner, country, environment, or data-classification metadata are blocked or reported | Policy test and failed plan | v0.2–v0.9 |
| GOV-02 | Enforce environment separation | Development identities and pipelines cannot deploy to production | Denied deployment test | v0.2–v0.8 |
| GOV-03 | Require controlled infrastructure changes | Production infrastructure changes originate from reviewed Terraform through approved CI/CD | Audit trail and repository history | v0.2–v0.9 |
| GOV-04 | Manage exceptions | Security-policy exceptions have an owner, business reason, expiry date, compensating controls, and approval | Exception register | v0.9 |
| GOV-05 | Control cloud cost | All deployed environments have budgets, labels, and cleanup instructions; no abandoned lab resources remain | Budget configuration and teardown evidence | v0.2–v1.0 |
| GOV-06 | Support country onboarding | A new country can be added through documented modules, controls, and approvals rather than manual redesign | Country onboarding simulation | v1.0 |

## 10. Monitoring, detection, and shift-right validation

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| MON-01 | Centralise security-relevant logs | Selected audit, application, load-balancer, IAM, KMS, and deployment logs are available to the security project | Log sink configuration and queries | v0.8–v0.10 |
| MON-02 | Detect suspicious authentication activity | A controlled abnormal login or repeated authorization failure generates an alert | Alert and event timeline | v0.10 |
| MON-03 | Detect unusual secret or key access | A controlled unusual secret read or decrypt event generates an alert | Alert and audit log | v0.10–v0.11 |
| MON-04 | Continuously rescan deployed artifacts | Previously deployed images or dependencies are re-evaluated when new vulnerability information becomes available | Scheduled workflow or registry scan evidence | v0.10 |
| MON-05 | Validate public application controls | DAST, security-header, authorization, and rate-limit tests run against staging | Reports and pass/fail criteria | v0.10 |
| MON-06 | Validate control effectiveness | Each critical preventive control has at least one negative test proving that it blocks or detects an unsafe action | Security control validation matrix | v0.10–v1.0 |

## 11. Incident response

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| IR-01 | Maintain actionable playbooks | Playbooks exist for credential leakage, public exposure, compromised identity, malicious workload activity, and key misuse | Version-controlled playbooks | v0.11 |
| IR-02 | Test detection and containment | At least four controlled incidents are detected and contained | Incident reports and timelines | v0.11 |
| IR-03 | Preserve evidence | Incident simulations retain relevant logs, image digests, IAM changes, findings, and response actions | Evidence bundle | v0.11 |
| IR-04 | Measure response performance | Selected simulations record time to detect, acknowledge, contain, and recover | Incident metrics table | v0.11 |
| IR-05 | Improve controls after incidents | Every simulation produces at least one documented lesson or control improvement | Post-incident review | v0.11 |

## 12. Availability, backup, and resilience

| ID | Objective | Success criteria | Evidence | Target phase |
|---|---|---|---|---|
| RES-01 | Support regional resilience | A controlled regional backend failure does not make the entire demonstration platform unavailable | Failover test and availability evidence | v1.0 |
| RES-02 | Validate backup restoration | Critical test data is restored successfully within the documented recovery target | Restore log and validation checklist | v0.11–v1.0 |
| RES-03 | Protect offline submissions | Retried or duplicated sync operations do not create duplicate records or corrupt state | Idempotency tests | v0.5–v0.10 |
| RES-04 | Document recovery objectives | Critical services have documented recovery-time and recovery-point objectives | Architecture and recovery documents | v0.1–v1.0 |
| RES-05 | Remove lab infrastructure safely | Terraform destroy and cleanup procedures remove resources without leaving unintended costs or public exposure | Cleanup logs and final asset inventory | Every implementation phase |

## 13. Initial release gates

The project will progressively enforce the following minimum gates before a release is considered production-eligible:

- all required tests pass;
- no committed secrets;
- no prohibited critical SAST findings;
- no prohibited critical dependency findings;
- no prohibited critical container findings;
- no prohibited critical IaC findings;
- an SBOM is generated;
- the image is signed;
- provenance is available;
- staging deployment succeeds;
- required shift-right tests pass;
- the artifact is approved for promotion.

Thresholds and exception rules will be formalised in the dependency-risk and governance phases.

## 14. Evidence standards

Evidence should be reproducible and may include:

- automated test output;
- GitHub Actions logs;
- scanner reports;
- Terraform plans;
- policy evaluation results;
- audit-log queries;
- screenshots with sensitive values removed;
- signed attestations;
- SBOM files;
- incident timelines;
- architecture diagrams;
- pull requests and commit history.

No evidence may contain real credentials, personal data, employer information, or confidential production details.

## 15. Completion criteria

The project is complete when the implemented controls demonstrate the intended outcomes across identity, application security, networking, cryptography, DevSecOps, software supply chain, posture management, governance, monitoring, incident response, and resilience.

A green pipeline alone is not sufficient. The deployed environment must also demonstrate that unsafe actions are blocked, suspicious activity is detected, findings can be remediated, and recovery procedures work.
