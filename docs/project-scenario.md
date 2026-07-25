# Project Scenario

## 1. Overview

AfyaBridge Cloud Security is a fictional, multi-country community-health platform designed to demonstrate secure cloud architecture, cloud governance, DevSecOps, and incident response on Google Cloud.

The platform is operated by a fictional international NGO that supports community health programmes in Kenya, Ghana, and South Africa. Its field teams work with community health workers, supervisors, partner facilities, and country programme offices to improve access to health education, maternal-care follow-up, referrals, and routine household outreach.

This repository contains no production systems, real patient records, employer infrastructure, or confidential organisational information. All identities, records, facilities, and events used in the project are synthetic.

## 2. Business problem

The NGO currently operates separate community-health programmes in multiple countries. Each programme has similar workflows but different teams, partner organisations, geographic structures, regulatory expectations, and operational constraints.

The organisation needs a shared digital platform that can:

- support community health workers conducting door-to-door visits;
- remain usable in low-bandwidth and intermittently connected environments;
- protect sensitive household and maternal-care information;
- isolate country and programme data;
- support country-specific administration without granting unnecessary global access;
- connect community referrals to formal health facilities;
- provide de-identified regional and global analytics;
- scale to new countries without rebuilding the platform;
- maintain auditable security, governance, and incident-response controls.

The security challenge is not limited to application vulnerabilities. The platform must also address identity, cloud configuration, software supply-chain risk, network segmentation, encryption, governance, monitoring, and operational resilience.

## 3. Countries and deployment model

The initial fictional rollout covers:

| Country | Initial scale | Primary operating context |
|---|---:|---|
| Kenya | 2,500 CHWs | Large programme with urban and rural deployments |
| Ghana | 1,200 CHWs | Growing programme operated with regional partners |
| South Africa | 1,800 CHWs | Multi-province deployment with stricter administrative separation |

The architecture should support expansion to at least ten countries without redesigning the security model.

Each country must have:

- a logically isolated production environment;
- country-scoped identities and permissions;
- approved deployment regions;
- separate encryption boundaries where practical;
- independent operational dashboards;
- centralised but access-controlled security monitoring;
- a defined onboarding and offboarding process.

Shared services may be centralised where this improves governance, security, and cost efficiency. Examples include CI/CD, security monitoring, artifact storage, policy enforcement, and central logging.

## 4. User personas

### 4.1 Community Health Worker

A CHW uses a mobile-friendly web application to:

- view assigned households;
- record household visits;
- deliver approved health-education content;
- record maternal-care follow-ups;
- create facility referrals;
- submit records while offline and synchronise later.

A CHW must only access records for assigned programmes and geographic areas.

### 4.2 CHW Supervisor

A supervisor:

- reviews CHW activity;
- manages assignments within an authorised region;
- follows up incomplete visits and referrals;
- views operational reports for their team.

A supervisor must not automatically gain country-wide or cross-country access.

### 4.3 Facility Worker

A facility worker:

- receives referrals;
- updates referral status;
- views only the minimum information required to process the referral.

Facility workers do not receive broad household-record access.

### 4.4 Country Programme Administrator

A country administrator:

- manages users and programme configuration within one country;
- views country-level operational reports;
- approves health content and programme settings;
- cannot administer another country.

### 4.5 Global Programme Manager

A global programme manager:

- views aggregated and de-identified programme metrics;
- compares country performance;
- does not receive unrestricted access to identifiable household records.

### 4.6 Data Analyst

A data analyst:

- uses approved analytics datasets;
- works with de-identified or aggregated data;
- cannot query operational databases directly.

### 4.7 Platform Engineer

A platform engineer:

- manages shared cloud infrastructure;
- deploys changes through approved pipelines;
- does not use persistent owner-level access;
- cannot bypass production controls without an approved emergency process.

### 4.8 Security Engineer

A security engineer:

- reviews cloud posture and security findings;
- manages security policies and detections;
- investigates incidents;
- has limited, auditable access to sensitive systems.

### 4.9 Auditor

An auditor:

- receives read-only access to selected logs, policies, evidence, and reports;
- cannot modify infrastructure or operational data.

## 5. Core application capabilities

The demonstration application will remain intentionally small. Its purpose is to provide a realistic workload for cloud and security engineering.

The initial capabilities are:

1. **Household registration** — synthetic household and location records.
2. **Visit management** — assigned visits and completion records.
3. **Maternal-care follow-up** — non-diagnostic follow-up status and reminders.
4. **Health education** — approved content assigned by programme and country.
5. **Facility referrals** — referral creation, routing, and status tracking.
6. **Offline synchronisation** — queued field submissions with retry and conflict handling.
7. **Audit logging** — security-relevant user and system activity.
8. **Analytics export** — approved, de-identified operational metrics.

The platform will not perform diagnosis, treatment recommendations, or emergency medical decision-making.

## 6. Data classification

| Classification | Examples | Expected handling |
|---|---|---|
| Public | Published health education content | Public access permitted after approval |
| Internal | Programme configuration, non-sensitive operational metrics | Restricted to authorised staff |
| Confidential | CHW assignments, referral status, household contact details | Encryption, least privilege, audited access |
| Restricted | Maternal-care notes, identifiable household records, authentication data | Strong isolation, minimal access, encryption, enhanced monitoring |

All project data is synthetic, but the architecture treats it as though it were sensitive production data.

## 7. Key security and operational concerns

The project must address:

- compromised CHW or administrator accounts;
- cross-country and cross-programme access;
- excessive IAM permissions;
- long-lived deployment credentials;
- exposed storage or databases;
- vulnerable or malicious dependencies;
- tampered container images;
- secrets committed to source control;
- insecure infrastructure-as-code changes;
- sensitive information appearing in logs;
- unauthorised health-content modification;
- abuse of offline synchronisation endpoints;
- cloud configuration drift;
- encryption-key misuse;
- regional service disruption;
- failure to detect or respond to incidents.

## 8. Availability and resilience assumptions

The platform supports field operations where brief service interruptions are possible, but prolonged outages should not prevent CHWs from collecting work locally.

Initial targets for the portfolio implementation are:

| Requirement | Target |
|---|---:|
| Monthly service availability | 99.9% design target |
| Recovery time objective | 4 hours |
| Recovery point objective | 1 hour for critical operational data |
| Offline queue retention | At least 7 days on the test client |
| Security alert generation | Within 5 minutes for selected simulations |
| New-country onboarding | Repeatable through documented infrastructure and governance modules |

These are architecture targets for the lab, not production service commitments.

## 9. Connectivity assumptions

CHWs may use low-cost mobile devices and unstable mobile networks. The design should therefore consider:

- low-bandwidth payloads;
- resumable or retryable synchronisation;
- idempotent submissions;
- local queue protection;
- short-lived credentials;
- safe conflict resolution;
- prevention of duplicate records;
- remote session revocation when a device is lost.

## 10. External systems

The platform may integrate with fictional or sandbox services for:

- SMS and messaging notifications;
- facility directories;
- identity federation;
- security ticketing;
- alert delivery;
- analytics visualisation.

No real healthcare, government, or NGO systems are required for the project.

## 11. Architectural principles

The project will follow these principles:

1. **Least privilege by default.**
2. **No long-lived cloud credentials in CI/CD.**
3. **Country and environment separation.**
4. **Private data services wherever practical.**
5. **Infrastructure changes through version-controlled automation.**
6. **Security controls implemented as code where possible.**
7. **Every deployable artifact is traceable to reviewed source.**
8. **Security continues after deployment through monitoring and testing.**
9. **All critical controls produce reviewable evidence.**
10. **The system must be removable without leaving uncontrolled cloud resources or costs.**

## 12. Success of the scenario

The scenario is successful when the repository can demonstrate, with code and evidence, that:

- a secure Google Cloud foundation can support multiple countries and environments;
- identities are separated across workforce, workload, and application use cases;
- application and cloud controls prevent unauthorised cross-country access;
- the delivery pipeline blocks unsafe code, dependencies, images, and infrastructure;
- deployed systems are continuously monitored for posture drift and suspicious activity;
- controlled incident simulations are detected, contained, and documented;
- regional failure and recovery procedures are tested;
- a new country can be introduced through a repeatable, governed process.
