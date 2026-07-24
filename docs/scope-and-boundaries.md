# Scope and Boundaries

## 1. Purpose

This document defines what AfyaBridge Cloud Security will and will not build.

The project is intentionally broad in security coverage but narrow in product functionality. Its primary purpose is to demonstrate cloud engineering, cloud security, DevSecOps, governance, software supply-chain security, and incident response on Google Cloud.

The community-health application exists as a realistic workload for the security platform. It is not intended to become a complete healthcare product within this repository.

## 2. Project outcomes

The completed project should provide credible evidence that its author can:

- design a secure Google Cloud foundation for multiple countries and environments;
- translate business and health-data risks into technical security requirements;
- implement infrastructure as code and policy as code;
- build security controls into CI/CD workflows;
- deploy and operate cloud-native workloads securely;
- manage workforce, workload, and application identities;
- design network, encryption, logging, and governance controls;
- manage software supply-chain and dependency risk;
- detect cloud posture drift and suspicious activity;
- plan, execute, and document incident-response simulations;
- explain engineering decisions, trade-offs, costs, and residual risks.

## 3. In scope

### 3.1 Architecture and security design

The project includes:

- business and technical scenario definition;
- data classification;
- security objectives and measurable success criteria;
- threat modelling;
- trust-boundary analysis;
- security control mapping;
- architecture decision records;
- cost and operational assumptions.

### 3.2 Google Cloud foundation

The project includes the design and, where practical, implementation of:

- a Google Cloud resource hierarchy;
- environment and country separation;
- shared security, networking, logging, and delivery services;
- project creation and baseline configuration;
- mandatory labels and tags;
- budget alerts and cost controls;
- approved-region controls;
- organisation-policy concepts and selected enforceable policies;
- centralised logging and asset inventory.

A real Google Cloud organisation may not be available for every feature. Controls requiring organisation-level privileges may therefore be implemented in one of three ways:

1. directly in a dedicated lab organisation;
2. as tested Terraform and policy code without applying it;
3. as documented enterprise extensions with local evidence for equivalent controls.

The repository must clearly distinguish implemented, simulated, and design-only controls.

### 3.3 Identity and access management

The project includes:

- workforce identity design;
- workload identity design;
- application identity and authorisation design;
- Google Groups-based access patterns;
- predefined and custom IAM roles;
- IAM Conditions;
- least-privilege service accounts;
- Workload Identity Federation for CI/CD;
- Workload Identity for GKE where used;
- privileged and break-glass access procedures;
- joiner, mover, and leaver workflows;
- access reviews and separation of duties.

### 3.4 Secure network architecture

The project includes:

- shared VPC and environment separation design;
- edge, application, data, management, security, and analytics zones;
- ingress and egress control;
- hierarchical firewall-policy concepts;
- private service connectivity;
- controlled outbound access;
- private database access;
- Cloud Armor and web application firewall controls;
- Kubernetes NetworkPolicies where GKE is used;
- data-perimeter and VPC Service Controls design where practical.

### 3.5 Application workload

The demonstration application includes a limited set of synthetic workflows:

- household registration;
- assigned household visits;
- maternal-care follow-up status;
- health-education content;
- facility referrals;
- offline submission queue and synchronisation;
- audit events;
- de-identified analytics export.

The application must be sufficient to demonstrate:

- authentication and authorisation;
- country and programme isolation;
- service-to-service identity;
- data classification and protection;
- logging and monitoring;
- secure deployment;
- selected application-security vulnerabilities and remediations.

### 3.6 Cloud runtimes and deployment

The project includes:

- containerised services;
- Artifact Registry;
- Cloud Run as the initial managed runtime;
- GKE Autopilot as an advanced implementation;
- private or restricted data services;
- Secret Manager;
- Cloud KMS;
- global or regional load-balancing concepts;
- multi-region deployment and resilience testing;
- infrastructure cleanup and cost-control procedures.

Cloud Run and GKE do not need to host identical production architectures. Cloud Run will demonstrate a lower-operational-overhead design, while GKE will demonstrate advanced policy and runtime controls.

### 3.7 DevSecOps and software supply-chain security

The project includes:

- pull-request validation;
- linting, testing, and coverage;
- secret scanning;
- static application security testing;
- software composition analysis;
- infrastructure-as-code scanning;
- container vulnerability scanning;
- dynamic application security testing against staging;
- security quality gates;
- SBOM generation;
- artifact signing;
- build provenance and attestations;
- trusted registry and deployment-policy controls;
- pinned CI/CD dependencies;
- dependency update automation;
- vulnerability and licence exception workflows.

### 3.8 Cloud Security Posture Management

The project includes:

- baseline cloud-security standards;
- preventive policy controls;
- posture scanning and findings;
- Cloud Asset Inventory queries;
- Security Command Center capabilities where available;
- drift detection;
- risk-based prioritisation;
- posture dashboards;
- controlled misconfiguration scenarios;
- remediation workflows and evidence.

### 3.9 Key, secrets, and data protection

The project includes:

- country- and environment-aware key hierarchy design;
- customer-managed encryption keys where practical;
- key rotation;
- separation of key administration and key use;
- key-access logging and alerting;
- secret storage and rotation;
- de-identification of analytics data;
- retention and deletion policies;
- backup-encryption considerations.

### 3.10 Governance

The project includes:

- resource and naming standards;
- mandatory metadata;
- approved-service and approved-region policies;
- production change controls;
- exception management;
- risk register;
- evidence retention;
- country onboarding and offboarding controls;
- data-classification and handling rules;
- documented ownership and accountability.

### 3.11 Monitoring, detection, and incident response

The project includes:

- audit and application logging;
- security-relevant metrics;
- alerting;
- selected detection rules;
- incident severity and escalation model;
- playbooks;
- controlled incident simulations;
- investigation evidence;
- containment and recovery steps;
- post-incident reviews;
- response metrics.

### 3.12 Reliability and resilience

The project includes:

- backups;
- restore testing;
- regional deployment design;
- regional failure simulation;
- recovery time and recovery point targets;
- queue retry and idempotency tests;
- health checks and rollback procedures;
- documented disaster-recovery trade-offs.

### 3.13 Documentation and public communication

The project includes:

- implementation guides;
- architecture diagrams;
- decision records;
- evidence and screenshots;
- weekly or milestone-based technical articles;
- LinkedIn and X/Twitter summaries;
- a final flagship case study.

Public content will describe the work as an independent fictional portfolio project and will not disclose employer systems, confidential architecture, credentials, data, or internal processes.

## 4. Out of scope

### 4.1 Real healthcare operations

The project will not:

- process real patient, CHW, facility, or employee data;
- connect to real NGO, government, hospital, or national-health systems;
- provide diagnosis, clinical decision support, treatment, or emergency guidance;
- claim to be approved for real healthcare use;
- operate as a live production healthcare service.

### 4.2 Full product implementation

The project will not build:

- a complete electronic medical record;
- a full community-health information system;
- comprehensive case management;
- payments or insurance processing;
- advanced scheduling;
- full content-management tooling;
- a production mobile application;
- a production-grade offline-first sync engine;
- a complete analytics or business-intelligence product.

The user interface may be intentionally minimal where deeper product work does not add security-engineering evidence.

### 4.3 Formal legal or compliance certification

The project will not claim:

- HIPAA compliance;
- GDPR certification;
- ISO 27001 certification;
- SOC 2 compliance;
- Kenya Data Protection Act certification;
- POPIA certification;
- Ghana Data Protection Act certification;
- any other legal, regulatory, or industry attestation.

Relevant frameworks and laws may be used as design references or control-mapping exercises only. Formal compliance requires legal interpretation, organisational processes, contracts, audits, and production evidence beyond this portfolio project.

### 4.4 Enterprise services outside the available lab

The project may document but not fully activate:

- paid Security Command Center tiers;
- enterprise SIEM or SOAR platforms;
- premium Cloud Armor features;
- full BeyondCorp Enterprise deployment;
- advanced organisation-level posture management;
- dedicated hardware security modules;
- commercial vulnerability-management platforms;
- production paging and 24/7 security operations.

Where a paid or unavailable service is relevant, the repository must provide:

- the intended enterprise design;
- the control objective;
- a lower-cost implementation or simulation;
- a clear statement that the enterprise feature was not activated.

### 4.5 Continuous production operations

The project will not provide:

- 24/7 on-call support;
- real production service-level agreements;
- continuous human monitoring;
- real incident notification obligations;
- production customer support;
- indefinite cloud-resource operation.

Cloud environments may be deployed temporarily for testing and removed afterward to control cost.

### 4.6 Offensive security outside the lab

Security testing is limited to:

- systems owned by the project author;
- deliberately vulnerable local components;
- isolated lab environments;
- authorised cloud resources created for this project.

The project will not test, scan, exploit, or target third-party systems without explicit authorisation.

## 5. Security and safety boundaries

The following rules apply throughout the project:

1. Only synthetic data may be committed or processed.
2. Real credentials, API keys, tokens, private keys, and certificates must never be committed.
3. Deliberately exposed test secrets must be recognisably fake and revocation-safe.
4. Vulnerable infrastructure must not be deployed to an uncontrolled or shared environment.
5. Intentionally public resources must be temporary, contain no sensitive data, and be removed immediately after testing.
6. Security tests must target only approved project environments.
7. Destructive tests must include recovery and cleanup procedures.
8. Evidence must be sanitised before publication.
9. Cloud resources must be labelled, budgeted, and removable through documented commands.
10. Controls that are not actually implemented must not be represented as complete.

## 6. Environment boundaries

The intended environments are:

| Environment | Purpose | Data | Exposure | Expected lifetime |
|---|---|---|---|---|
| Local | Development and vulnerable baseline | Synthetic | Developer machine only | Persistent as needed |
| Sandbox | Short-lived experiments | Synthetic | Restricted | Hours or days |
| Development | Integrated application and infrastructure work | Synthetic | Restricted | Intermittent |
| Staging | Production-like validation and DAST | Synthetic | Controlled public endpoints where required | Intermittent |
| Production lab | Secure deployment, governance, and resilience demonstrations | Synthetic | Controlled | Temporary or scheduled |

No environment is a real healthcare production environment.

## 7. Trust boundaries

The initial trust boundaries include:

- user device to public edge;
- public edge to application services;
- application services to data services;
- one application service to another;
- country environment to shared services;
- one country environment to another;
- CI/CD platform to Google Cloud;
- human administrator to privileged cloud resources;
- operational data to analytics pipelines;
- cloud workloads to external notification or identity providers.

Each boundary must later be represented in the threat model and architecture diagrams.

## 8. Implementation depth labels

Every major feature should be marked using one of these labels:

| Label | Meaning |
|---|---|
| **Implemented** | Deployed or executed with evidence |
| **Simulated** | Tested through a controlled local or cloud exercise |
| **Code complete** | Configuration exists and is validated but was not applied |
| **Designed** | Architecture and controls are documented but not built |
| **Enterprise extension** | Recommended production capability outside the portfolio budget or access level |

This prevents ambiguity and makes the final project credible.

## 9. Definition of project completion

AfyaBridge Cloud Security reaches version 1.0 when:

- the core scenario, architecture, threat model, and control matrix are complete;
- the demonstration application supports the minimum workflows;
- the secure delivery pipeline produces tested, scanned, signed, and traceable artifacts;
- a secure Google Cloud deployment is demonstrated;
- IAM, network, key, posture, governance, and monitoring controls have evidence;
- selected shift-left and shift-right controls are validated;
- incident-response and resilience exercises are documented;
- implemented, simulated, and design-only controls are clearly distinguished;
- deployment and cleanup instructions are reproducible;
- the final technical case study links architecture, implementation, evidence, costs, trade-offs, and lessons learned.
