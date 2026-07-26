# Identity Domains

## Purpose

This document defines the identity domains used by AfyaBridge Cloud Security, the authority responsible for each domain, the trust boundaries between them, and the minimum controls required when identities cross those boundaries.

## Identity-domain model

AfyaBridge uses separate identity domains because workforce access, application access, workload execution, and CI/CD deployment have different authentication methods, lifecycle requirements, and risk profiles.

| Domain | Subjects | Authoritative source | Target resources |
|---|---|---|---|
| Workforce | employees, contractors, auditors | Cloud Identity or Google Workspace directory | Google Cloud, GitHub, monitoring and operations tools |
| Application | CHWs, supervisors, facility workers, programme and country administrators | Application identity provider and user directory | AfyaBridge web application and APIs |
| Workload | APIs, sync processors, jobs, agents | Infrastructure as code and Google Cloud IAM | Google Cloud services and internal APIs |
| CI/CD | GitHub Actions workflows | GitHub repository identity plus OIDC claims | Deployment service accounts and approved projects |
| External | support vendors, external auditors, partner services | Approved external directory or integration registry | Narrowly scoped services and data exchanges |
| Emergency | break-glass operators | Restricted emergency account inventory | Critical recovery and containment functions |

## Domain ownership

| Domain | Accountable owner | Operational owner | Review authority |
|---|---|---|---|
| Workforce | Security and platform leadership | Identity administrator | Security owner |
| Application | Product and programme leadership | Application operations | Security and data owner |
| Workload | Platform engineering | Service owner | Security and platform reviewer |
| CI/CD | Platform engineering | Repository and pipeline owner | Security reviewer |
| External | Sponsoring business owner | Integration owner | Security and data owner |
| Emergency | Security leadership | Authorized emergency custodians | Independent post-use reviewer |

## Trust boundaries

### ID-TB-01 — Workforce directory to Google Cloud

**Crossing:** A workforce identity or group is evaluated by Google Cloud IAM.

**Primary risks:** stale membership, direct user grants, excessive inherited permissions, compromised workforce accounts.

**Required controls:**

- group-based role assignment;
- MFA for workforce accounts;
- environment-specific groups;
- country-scoped groups where access is local;
- no routine direct user bindings;
- periodic access review;
- logging of authentication and IAM changes.

### ID-TB-02 — Workforce identity to GitHub

**Crossing:** A developer or administrator accesses source, workflows, environments, or repository settings.

**Primary risks:** repository takeover, unreviewed workflow modification, bypass of protected environments.

**Required controls:**

- unique GitHub identities;
- MFA;
- least-privilege repository roles;
- protected branches and environments;
- review of workflow and identity-provider changes;
- separation between repository administration and production approval where practical.

### ID-TB-03 — GitHub OIDC to Google Cloud

**Crossing:** A workflow exchanges an OIDC token for short-lived Google Cloud credentials.

**Primary risks:** overly broad federation conditions, malicious workflow execution, unauthorized branch or repository claims.

**Required controls:**

- Workload Identity Federation;
- repository, branch, environment, and workflow claim restrictions;
- dedicated deployment service accounts;
- short credential lifetime;
- no downloadable service-account keys;
- protected production environments;
- audit logs for token exchange and impersonation.

### ID-TB-04 — Application identity provider to AfyaBridge API

**Crossing:** An application session or token is validated by the application backend.

**Primary risks:** session theft, token replay, incorrect claims, broken authorization.

**Required controls:**

- signed and validated tokens;
- bounded session lifetime;
- server-side authorization;
- country, programme, role, and assignment checks;
- session revocation;
- authentication and authorization audit events.

### ID-TB-05 — Workload identity to Google Cloud service

**Crossing:** A service account calls a Google Cloud API or accesses a data service.

**Primary risks:** lateral movement, excessive service-account permissions, confused-deputy access.

**Required controls:**

- one dedicated service account per deployable service or trust role;
- least-privilege predefined or custom roles;
- no service-account keys;
- explicit impersonation policy;
- country and environment separation;
- service-account usage monitoring.

### ID-TB-06 — External identity or service to AfyaBridge

**Crossing:** A vendor, auditor, or partner integration accesses an approved interface.

**Primary risks:** third-party compromise, overbroad access, unmanaged lifecycle, data leakage.

**Required controls:**

- named sponsor and owner;
- explicit scope and expiry;
- least-privilege access;
- strong authentication or service-specific credential management;
- data minimization;
- monitored use;
- prompt revocation at contract or integration end.

### ID-TB-07 — Emergency identity to privileged control plane

**Crossing:** A break-glass operator obtains exceptional access during a declared incident.

**Primary risks:** misuse, unmonitored standing privilege, shared credentials, incomplete post-use review.

**Required controls:**

- isolated named accounts;
- phishing-resistant MFA where available;
- offline recovery procedure;
- alert on every authentication and action;
- documented incident or approval reference;
- immediate credential rotation or reset after use;
- independent post-event review.

## Identity attributes

Authoritative identity records should expose only attributes needed for access decisions.

### Workforce attributes

- immutable subject identifier;
- employment or contract status;
- organizational unit;
- country assignment;
- job function;
- manager or sponsor;
- environment eligibility;
- privileged-access eligibility.

### Application attributes

- immutable application-user identifier;
- role;
- country;
- programme;
- geographic assignment;
- facility or team assignment;
- account and session status.

### Workload attributes

- service owner;
- workload name;
- project;
- environment;
- country or shared-service scope;
- approved permissions;
- deployment source.

## Prohibited identity patterns

- shared human accounts;
- generic administrator accounts for routine activity;
- service-account keys stored on developer devices or in CI/CD;
- one service account reused across unrelated workloads;
- direct production access inherited from non-production roles;
- external identities without a sponsor, owner, scope, and expiry;
- authorization based solely on user-controlled client data;
- country scope inferred only from URL parameters or record identifiers.

## Lifecycle requirements

Every identity must have:

- an authoritative source;
- a named owner or sponsor;
- a documented purpose;
- a defined scope;
- a creation and approval record;
- a revocation mechanism;
- an access-review path;
- an auditable activity trail.

## Threat and objective mapping

This design primarily addresses:

- TH-001 — compromised CHW account;
- TH-002 — cross-country or cross-programme access;
- TH-003 — excessive country-administrator privilege;
- TH-004 — stolen or leaked CI/CD credential;
- TH-013 — compromised service account;
- TH-019 — compromised external integration;
- TH-020 — lost or stolen CHW device.

Mapped objectives include `IAM-01` through `IAM-07`, `APP-01` through `APP-04`, `CSPM-02`, `CSPM-04`, `MON-02`, and `MON-03`.