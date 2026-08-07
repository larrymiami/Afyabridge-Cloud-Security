# Security Control Matrix

## 1. Purpose

This matrix provides traceability between the AfyaBridge Cloud Security threat model, security objectives, planned controls, validation activities, and implementation evidence.

It is the authoritative control catalogue for the project. Detailed implementation guidance may exist in domain-specific documents, but every material security control should have a unique identifier here and remain linked to the threats and objectives it addresses.

## 2. Control lifecycle

Each control uses one of the following statuses:

| Status | Meaning |
|---|---|
| Planned | Control is defined but implementation has not started |
| In progress | Implementation or validation is underway |
| Implemented | Control is configured or coded |
| Validated | Required positive and negative tests have passed |
| Accepted | Residual risk is documented and approved |
| Deferred | Implementation is postponed with a rationale and review point |

## 3. Control types

| Type | Purpose |
|---|---|
| Preventive | Stops or limits an unsafe action before impact |
| Detective | Identifies unsafe activity, drift, or control failure |
| Responsive | Supports containment, eradication, and recovery |
| Corrective | Restores a secure state after a failure |
| Governance | Defines ownership, approval, evidence, and accountability |

## 4. Evidence requirements

A control is not considered validated solely because a tool is installed or a configuration exists. Validation evidence must demonstrate the intended security behaviour.

Acceptable evidence includes:

- automated test output;
- denied-access or denied-deployment results;
- Terraform plans and policy evaluations;
- GitHub Actions logs;
- scanner reports;
- Cloud Audit Logs and alert timelines;
- asset and IAM inventories;
- SBOMs, signatures, and provenance attestations;
- restore and failover results;
- incident reports and remediation records.

Evidence must use synthetic data and must not contain live credentials or confidential information.

## 5. Identity and access controls

| Control ID | Control | Type | Threats | Security objectives | Validation | Planned evidence | Status |
|---|---|---|---|---|---|---|---|
| IAM-C01 | Require short-lived federated credentials for CI/CD and prohibit stored service-account keys | Preventive | TH-004, TH-006 | IAM-01, CSPM-04 | Authenticate GitHub Actions through Workload Identity Federation and verify no key is present in repository settings or artifacts | Workflow configuration, IAM policy, deployment log, key inventory | Implemented |
| IAM-C02 | Assign a dedicated least-privilege service account to each deployable workload | Preventive | TH-013, TH-014 | IAM-02, IAM-05 | Attempt cross-service access using a workload identity without the required role | Terraform IAM bindings, denied-access logs, IAM inventory | Implemented |
| IAM-C03 | Enforce country, programme, region, and assignment scope in server-side authorisation | Preventive | TH-001, TH-002, TH-003 | IAM-03, APP-01, APP-02, APP-03 | Execute cross-country, cross-programme, and cross-region requests and require `403` responses | Authorisation tests, role matrix, audit logs | Planned |
| IAM-C04 | Use group-based workforce access and prohibit direct privileged grants except documented emergency access | Preventive, Governance | TH-003, TH-017 | IAM-04, IAM-05, IAM-06 | Review IAM bindings and detect direct or stale privileged assignments | Group design, IAM report, access-review record | Planned |
| IAM-C05 | Provide time-bound privileged access and a monitored break-glass process | Preventive, Detective, Responsive | TH-003, TH-013, TH-017 | IAM-04, IAM-05 | Activate emergency access, verify expiry, and confirm audit and alert generation | Break-glass procedure, activation logs, expiry evidence | Planned |
| IAM-C06 | Support session revocation and forced reauthentication for compromised CHW identities | Preventive, Responsive | TH-001, TH-020 | IAM-07 | Revoke a test session and verify subsequent requests fail | Revocation test, authentication logs, incident timeline | Planned |
| IAM-C07 | Perform periodic human and workload identity ownership reviews | Detective, Governance | TH-003, TH-013, TH-014 | IAM-06, CSPM-02 | Identify stale, ownerless, or excessive identities from the inventory | Access-review report, remediation changes | Planned |

## 6. Application and data-isolation controls

| Control ID | Control | Type | Threats | Security objectives | Validation | Planned evidence | Status |
|---|---|---|---|---|---|---|---|
| APP-C01 | Derive tenant and country scope from trusted identity claims rather than client-supplied identifiers | Preventive | TH-002, TH-003 | APP-01, APP-02, IAM-03 | Modify country and programme identifiers in requests and verify access remains denied | Integration tests, API logs | Planned |
| APP-C02 | Apply object-level authorisation to every household, visit, referral, and content-management operation | Preventive | TH-001, TH-002, TH-012 | APP-01, APP-02, APP-03, APP-06 | Attempt insecure direct-object-reference scenarios across roles and countries | Authorisation test suite | Planned |
| APP-C03 | Limit facility referral responses to the minimum required data fields | Preventive | TH-002, TH-015 | APP-03 | Compare API responses across CHW, facility, supervisor, and analyst roles | Contract tests, response samples | Planned |
| APP-C04 | Authenticate, validate, sign or integrity-protect, and make offline synchronisation requests idempotent | Preventive, Detective | TH-010, TH-020 | APP-04, RES-03 | Replay, alter, duplicate, and submit malformed sync payloads | Security test output, duplicate-prevention evidence | Planned |
| APP-C05 | Redact restricted fields from application, infrastructure, pipeline, and audit logs | Preventive, Detective | TH-006, TH-011, TH-015 | APP-05, MON-01 | Submit synthetic restricted values and scan all selected log destinations | Automated log inspection, sanitised samples | Planned |
| APP-C06 | Require authorised approval and immutable audit events for health-content changes | Preventive, Detective | TH-012 | APP-06, MON-01 | Attempt unauthorised publication and verify approved changes retain actor and version details | Authorisation tests, content audit trail | Planned |
| APP-C07 | De-identify or aggregate data before global analytics export | Preventive, Detective | TH-015 | APP-03, APP-05 | Run re-identification checks against synthetic export datasets and verify restricted fields are absent | Export test, schema comparison, query results | Planned |

## 7. Network and edge controls

| Control ID | Control | Type | Threats | Security objectives | Validation | Planned evidence | Status |
|---|---|---|---|---|---|---|---|
| NET-C01 | Keep production databases and restricted data services off public endpoints | Preventive | TH-005, TH-021 | NET-01, NET-06 | Verify public connectivity fails and asset inventory shows no public database endpoint | Terraform plan, connectivity test, asset report | Implemented |
| NET-C02 | Define edge, application, data, management, security, and analytics zones with explicit permitted flows | Preventive, Governance | TH-005, TH-013, TH-015 | NET-02, NET-03 | Run positive and negative connectivity tests for documented and undocumented paths | Network diagram, firewall policy, test results | Planned |
| NET-C03 | Separate production from development, staging, and sandbox networks and identities | Preventive | TH-005, TH-009, TH-013 | NET-05, GOV-02 | Attempt non-production access to production services and require denial | Connectivity and IAM test results | Planned |
| NET-C04 | Route public traffic through approved load balancing, TLS, WAF, and rate-limiting controls | Preventive, Detective | TH-018, TH-019 | NET-04, MON-05 | Test TLS, security headers, rate limits, and selected WAF rules against staging | DAST and WAF results, load-balancer configuration | Implemented |
| NET-C05 | Restrict service egress and access to sensitive Google Cloud services through approved paths | Preventive | TH-013, TH-014, TH-019 | NET-03, NET-06 | Attempt unapproved egress and sensitive-service access | Firewall logs, denied connectivity tests | Planned |

## 8. Secrets, encryption, and key controls

| Control ID | Control | Type | Threats | Security objectives | Validation | Planned evidence | Status |
|---|---|---|---|---|---|---|---|
| KMS-C01 | Maintain country- and environment-scoped key rings and key-use permissions | Preventive | TH-002, TH-014, TH-015, TH-021 | KMS-01 | Attempt cross-country encrypt and decrypt operations and require denial | KMS IAM policy, denied decrypt log | Implemented |
| KMS-C02 | Separate key administration from encryption and decryption permissions | Preventive, Governance | TH-003, TH-014 | IAM-05, KMS-02 | Verify key administrators cannot decrypt application data by default | Role matrix, denied-access test | Planned |
| KMS-C03 | Configure and test cryptographic-key rotation | Preventive, Corrective | TH-014, TH-021 | KMS-03 | Rotate a test key and confirm dependent services continue operating | KMS configuration, audit logs, application test | Implemented |
| KMS-C04 | Alert on selected unusual decrypt, key-policy, and key-disable activity | Detective, Responsive | TH-014, TH-017 | KMS-04, MON-03 | Generate controlled unusual KMS events and verify alert delivery | Audit logs, alert rule, incident timeline | Planned |
| SEC-C01 | Block secrets in source code, workflow logs, images, and build artifacts | Preventive, Detective | TH-004, TH-006 | SEC-01, CICD-01 | Commit a recognisably fake test secret and require pipeline failure | Gitleaks report, failed workflow, remediation commit | Planned |
| SEC-C02 | Store runtime secrets in Secret Manager and prevent plaintext secrets in images and Terraform state | Preventive | TH-006, TH-014 | SEC-02 | Inspect image layers, environment configuration, and Terraform state | Image inspection, state review, runtime configuration | Implemented |
| SEC-C03 | Support application-secret rotation without source-code changes | Corrective, Responsive | TH-006, TH-014, TH-019 | SEC-03 | Rotate a test secret and verify service recovery and old-secret rejection | Rotation logs, application test, audit events | Planned |

## 9. DevSecOps and software supply-chain controls

| Control ID | Control | Type | Threats | Security objectives | Validation | Planned evidence | Status |
|---|---|---|---|---|---|---|---|
| CICD-C01 | Require pull-request review and successful mandatory security checks before merge | Preventive, Governance | TH-004, TH-006, TH-007, TH-009 | CICD-01, GOV-03 | Open a test pull request with a failing required check and verify merge is blocked | Branch rules, failed PR, audit history | Implemented |
| CICD-C02 | Run SAST against application and automation code | Detective | TH-007, TH-010, TH-011, TH-012 | CICD-02 | Add selected intentionally insecure patterns and verify detection | Scanner report, failed quality gate | Planned |
| CICD-C03 | Scan Terraform and policy code and block prohibited critical findings | Preventive, Detective | TH-005, TH-009, TH-016, TH-017 | CICD-03, GOV-03 | Introduce public exposure, broad IAM, or disabled logging in a test change | Checkov or equivalent report, failed pipeline | Planned |
| CICD-C04 | Scan container images before promotion and continuously rescan deployed artifacts | Detective, Preventive | TH-007, TH-008, TH-016 | CICD-04, MON-04 | Build an image with a prohibited critical vulnerability and require promotion failure | Trivy or equivalent report, scheduled scan evidence | Planned |
| SUP-C01 | Generate a CycloneDX or SPDX SBOM for every release image | Detective, Governance | TH-007, TH-008 | SUP-01, DEP-02 | Verify each release digest has an associated machine-readable SBOM | SBOM artifact, workflow logs | Planned |
| SUP-C02 | Sign production-eligible images and verify signatures by immutable digest | Preventive, Detective | TH-008 | SUP-02, SUP-03 | Attempt to deploy an unsigned image and require policy rejection | Signature output, denied deployment | Planned |
| SUP-C03 | Generate provenance that links each artifact to its source commit, workflow, and build environment | Detective, Governance | TH-004, TH-007, TH-008 | SUP-04 | Verify provenance for a release digest and detect a mismatched source reference | Attestation, verification output | Planned |
| DEP-C01 | Enforce dependency vulnerability, provenance, source, and licence policy | Preventive, Governance | TH-007 | DEP-01, DEP-02 | Introduce a vulnerable transitive dependency and a prohibited dependency condition | SCA report, dependency tree, failed gate | Planned |
| DEP-C02 | Pin third-party GitHub Actions and build dependencies to approved immutable versions | Preventive | TH-004, TH-007 | DEP-03 | Scan workflow files for floating action tags and require failure | Workflow lint report, reviewed SHA updates | Implemented |

## 10. Cloud posture and governance controls

| Control ID | Control | Type | Threats | Security objectives | Validation | Planned evidence | Status |
|---|---|---|---|---|---|---|---|
| CSPM-C01 | Detect public data exposure, excessive IAM, and user-managed service-account keys | Detective, Corrective | TH-004, TH-005, TH-013, TH-016 | CSPM-01, CSPM-02, CSPM-04 | Introduce controlled misconfigurations and verify findings and remediation | Findings, alerts, policy diffs | In progress |
| CSPM-C02 | Enforce or report approved deployment locations | Preventive, Detective | TH-016, TH-022 | CSPM-03 | Attempt resource creation outside an approved location | Policy result, failed deployment | In progress |
| CSPM-C03 | Detect manual infrastructure drift and restore the reviewed Terraform state | Detective, Corrective | TH-005, TH-009, TH-016, TH-017 | CSPM-05, GOV-03 | Make an authorised test console change and verify drift detection and reconciliation | Drift report, remediation pull request | In progress |
| CSPM-C04 | Maintain a cloud asset inventory enriched with owner, country, environment, and data classification | Detective, Governance | TH-003, TH-005, TH-013, TH-016, TH-021 | CSPM-06, GOV-01 | Query for ownerless, unlabelled, public, or cross-boundary resources | Asset inventory report | In progress |
| CSPM-C05 | Track findings by severity, owner, due date, exception, status, and closure evidence | Governance, Corrective | TH-005, TH-013, TH-014, TH-016, TH-017 | CSPM-07, GOV-04 | Review sample findings from creation through verified closure | Findings register, closure evidence | In progress |
| GOV-C01 | Require resource metadata and naming standards through Terraform and policy checks | Preventive, Governance | TH-009, TH-016 | GOV-01 | Attempt to create resources without required metadata | Failed plan or policy result | Implemented |
| GOV-C02 | Restrict production deployments to approved identities, repositories, workflows, and environments | Preventive, Governance | TH-004, TH-009, TH-013 | GOV-02, GOV-03 | Attempt a production deployment from an unapproved identity or environment | Denied deployment, audit logs | Implemented |
| GOV-C03 | Record exceptions with owner, rationale, expiry, compensating controls, and approval | Governance | All threats where a control is deferred or partially implemented | GOV-04 | Review an expiring sample exception and verify closure or renewal | Exception register | Implemented |
| GOV-C04 | Apply budgets, labels, teardown procedures, and final asset checks to all lab environments | Preventive, Corrective, Governance | TH-005, TH-016, TH-021 | GOV-05, RES-05 | Destroy a test environment and verify no unintended resources remain | Budget configuration, cleanup logs, asset report | Planned |
| GOV-C05 | Provision new countries through repeatable modules and a documented approval process | Preventive, Governance | TH-002, TH-003, TH-014, TH-015, TH-016 | GOV-06 | Run a new-country onboarding simulation and verify inherited controls | Terraform plan, checklist, policy results | Planned |

## 11. Monitoring and incident-response controls

| Control ID | Control | Type | Threats | Security objectives | Validation | Planned evidence | Status |
|---|---|---|---|---|---|---|---|
| MON-C01 | Centralise selected application, IAM, KMS, load-balancer, deployment, and cloud audit logs | Detective, Governance | TH-001, TH-003, TH-004, TH-011, TH-014, TH-017, TH-018 | MON-01 | Confirm selected events from each source are queryable in the security logging destination | Log-sink configuration, queries, retention settings | Implemented |
| MON-C02 | Alert on abnormal authentication, repeated authorisation failures, and suspicious session activity | Detective, Responsive | TH-001, TH-002, TH-020 | MON-02 | Generate controlled repeated failures and stolen-session activity | Alert, event timeline, response record | Planned |
| MON-C03 | Validate staging with DAST, security headers, authorisation, WAF, and rate-limit tests | Detective | TH-002, TH-010, TH-011, TH-018 | MON-05, NET-04 | Run the approved staging security test suite and evaluate pass/fail thresholds | DAST report, test output | Planned |
| MON-C04 | Maintain negative tests for every critical preventive control | Detective, Governance | All critical threats | MON-06 | Execute the validation matrix and confirm unsafe actions fail or generate findings | Control-test results and evidence index | Planned |
| IR-C01 | Maintain version-controlled incident playbooks for the defined priority scenarios | Responsive, Governance | TH-001, TH-004, TH-005, TH-008, TH-014, TH-017 | IR-01 | Tabletop each playbook and verify prerequisites, owners, and evidence sources | Playbooks, review record | Planned |
| IR-C02 | Run at least four controlled incident simulations through detection, containment, recovery, and review | Detective, Responsive, Corrective | Selected critical threats | IR-02, IR-04, IR-05 | Execute simulations and record detection, acknowledgement, containment, and recovery times | Incident reports, timelines, metrics | Planned |
| IR-C03 | Preserve relevant logs, IAM changes, findings, image digests, and response actions during incidents | Detective, Governance | TH-004, TH-005, TH-008, TH-014, TH-017 | IR-03 | Assemble an evidence bundle for each simulation and verify integrity and completeness | Evidence index, hashes, sanitised artifacts | Planned |

## 12. Availability, backup, and recovery controls

| Control ID | Control | Type | Threats | Security objectives | Validation | Planned evidence | Status |
|---|---|---|---|---|---|---|---|
| RES-C01 | Maintain tested backups with restricted access, encryption, retention, and restore procedures | Preventive, Corrective | TH-021, TH-022 | RES-02, RES-04 | Restore critical synthetic data within the target recovery window | Backup policy, restore logs, validation checklist | Planned |
| RES-C02 | Design and test regional service continuity for critical workflows | Preventive, Corrective | TH-019, TH-022 | RES-01, RES-04 | Simulate a regional backend failure and verify documented continuity behaviour | Failover results, availability timeline | Planned |
| RES-C03 | Apply retries, deduplication, idempotency, and bounded queue retention to offline submissions | Preventive, Corrective | TH-010, TH-019, TH-022 | APP-04, RES-03 | Replay and retry submissions during service interruption and recovery | Queue tests, record-integrity comparison | Planned |
| RES-C04 | Document recovery objectives, dependencies, owners, and escalation paths for critical services | Governance | TH-019, TH-021, TH-022 | RES-04 | Review recovery documentation against the deployed architecture | Recovery plan, dependency map | Planned |

## 13. Initial control priorities

The following controls are considered foundational because later implementation depends on them:

1. IAM-C01 — federated CI/CD identity;
2. IAM-C02 — workload identity separation;
3. IAM-C03 — country and programme authorisation;
4. NET-C01 — private production data services;
5. NET-C02 — documented and tested network zoning;
6. SEC-C01 — secret scanning and blocking;
7. CICD-C01 — mandatory pull-request gates;
8. CICD-C03 — infrastructure-as-code security validation;
9. SUP-C01 — release SBOM generation;
10. SUP-C02 — image signing and trusted deployment;
11. CSPM-C03 — drift detection and reconciliation;
12. MON-C01 — centralised security-relevant logging.

Priority does not indicate that other controls are optional. It defines implementation order and dependency.

## 14. Traceability rules

- Every critical or high threat must map to at least one preventive control and one detective or responsive control.
- Every security objective must map to at least one control.
- Every validated control must link to reproducible evidence.
- Control status must reflect demonstrated behaviour, not planned tooling.
- Accepted or deferred controls require a documented residual risk, owner, and review point.
- Threat and objective mappings must be updated when identifiers or architecture boundaries change.

## 15. Review triggers

The matrix must be reviewed when:

- a threat is added, removed, rescored, or accepted;
- a security objective changes;
- a new country, environment, runtime, or external integration is introduced;
- a control fails validation;
- an incident exposes an unmodelled weakness;
- a compensating control or exception expires;
- architecture changes move a trust boundary.

## 16. Related documents

- [`project-scenario.md`](./project-scenario.md)
- [`scope-and-boundaries.md`](./scope-and-boundaries.md)
- [`security-objectives.md`](./security-objectives.md)
- [`threat-model/README.md`](./threat-model/README.md)
- [`threat-model/trust-boundaries.md`](./threat-model/trust-boundaries.md)
- [`threat-model/threat-register.md`](./threat-model/threat-register.md)
- [`architecture/diagrams/system-context.md`](./architecture/diagrams/system-context.md)
