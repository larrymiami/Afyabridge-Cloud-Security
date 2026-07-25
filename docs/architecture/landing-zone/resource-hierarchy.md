# Google Cloud Resource Hierarchy

## 1. Decision

AfyaBridge uses a combined folder-based and project-based isolation model.

- **Folders** represent major governance boundaries such as bootstrap, common services, production, non-production, sandbox, and individual production countries.
- **Projects** provide workload, billing, quota, IAM, API, logging, and lifecycle boundaries.
- **Country production environments** receive dedicated folders with separate application, data, and operations projects.
- **Shared services** remain outside country folders and expose only approved capabilities through controlled interfaces.

This structure supports policy inheritance without placing unrelated workloads in the same project.

## 2. Proposed hierarchy

```text
Google Cloud Organization
│
├── fld-bootstrap
│   └── prj-bootstrap-core
│
├── fld-common
│   ├── prj-common-security
│   ├── prj-common-logging
│   ├── prj-common-networking
│   ├── prj-common-cicd
│   ├── prj-common-artifacts
│   └── prj-common-dns
│
├── fld-production
│   ├── fld-prd-kenya
│   │   ├── prj-prd-ke-app
│   │   ├── prj-prd-ke-data
│   │   └── prj-prd-ke-ops
│   │
│   ├── fld-prd-ghana
│   │   ├── prj-prd-gh-app
│   │   ├── prj-prd-gh-data
│   │   └── prj-prd-gh-ops
│   │
│   └── fld-prd-south-africa
│       ├── prj-prd-za-app
│       ├── prj-prd-za-data
│       └── prj-prd-za-ops
│
├── fld-nonproduction
│   ├── prj-nonprd-development
│   ├── prj-nonprd-staging-app
│   ├── prj-nonprd-staging-data
│   └── prj-nonprd-operations
│
└── fld-sandbox
    └── prj-sbx-expiring
```

Names shown here are logical names. Final Google Cloud project IDs must remain globally unique and comply with the naming standard defined later in `naming-and-labeling.md`.

## 3. Boundary rationale

### 3.1 Organisation

The organisation is the root trust and policy boundary. It is responsible for:

- organisation policies;
- folder hierarchy;
- central audit configuration;
- billing attachment;
- domain-scoped identity controls;
- security posture visibility;
- approved locations and services where enforceable.

No workload is placed directly under the organisation root.

### 3.2 Bootstrap folder

The bootstrap folder contains only resources required to create and manage the rest of the landing zone.

The initial bootstrap project contains:

- Terraform state storage;
- state encryption configuration;
- bootstrap and project-factory service accounts;
- Workload Identity Federation prerequisites;
- minimum APIs needed to create folders and projects;
- recovery documentation for state and deployment access.

Application workloads, runtime secrets, operational databases, and general CI/CD artifacts are not stored in the bootstrap project.

### 3.3 Common folder

The common folder hosts shared control-plane services.

| Project | Primary responsibility |
|---|---|
| Security | Security findings, selected detections, asset visibility, and security automation |
| Logging | Aggregated audit and platform logs with restricted access |
| Networking | Shared VPC hosts, connectivity, DNS forwarding, and network policy administration |
| CI/CD | Federated deployment identities and delivery automation |
| Artifacts | Approved container images, SBOMs, signatures, and provenance |
| DNS | Public and private DNS zones and certificate-related configuration |

Common projects must not become a route for unrestricted access to country data. Central visibility should use logs, findings, metadata, and approved de-identified exports rather than direct database permissions.

### 3.4 Production folder

The production folder applies controls shared by all production environments, including:

- stricter IAM administration;
- restricted deployment identities;
- approved location policies;
- mandatory logging;
- prohibition or detection of service-account keys;
- restricted public exposure;
- controlled infrastructure changes;
- production metadata requirements.

Each country receives a child folder so additional country-specific policy can be inherited without affecting other countries.

### 3.5 Country production folders

Country folders are the primary production governance boundary.

They allow:

- country-scoped administrative groups;
- country-specific approved regions;
- separate KMS and secrets policies;
- country-level budgets and reports;
- resource inventory by country;
- independent onboarding and offboarding;
- future legal or contractual controls without redesigning the whole hierarchy.

A country administrator may receive limited permissions within the relevant country folder but must not receive roles at the production or organisation level.

### 3.6 Country workload projects

Each production country initially uses three projects.

#### Application project

Contains:

- Cloud Run or GKE application workloads;
- load-balancer backends;
- service accounts assigned to application services;
- application monitoring configuration;
- runtime configuration that does not belong in the data project.

#### Data project

Contains:

- operational databases;
- storage containing confidential or restricted data;
- country-specific KMS resources where selected;
- backup resources;
- data-service networking configuration.

This project has a narrower administrative surface than the application project.

#### Operations project

Contains country-scoped operational components such as:

- notification queues;
- scheduled jobs;
- operational dashboards;
- country-specific integration components;
- approved support tooling.

A later implementation may split additional projects when risk, scale, quotas, or lifecycle requirements justify it. Project separation must be driven by a clear boundary rather than by creating one project per service.

### 3.7 Non-production folder

Development and staging are shared initially to avoid unnecessary duplication.

Non-production must still enforce:

- synthetic data only;
- separate deployment identities;
- separate Terraform state;
- separate secrets and keys;
- no connectivity to production data services;
- no inherited production permissions;
- controlled public exposure for staging tests;
- clear environment metadata.

Staging may use country-aware datasets and authorisation tests without hosting real or production-derived data.

### 3.8 Sandbox folder

Sandbox resources are intended for short-lived experiments.

Controls include:

- restricted service catalogue;
- low quotas where practical;
- budget alerts;
- mandatory owner and expiry metadata;
- no connectivity to production;
- synthetic data only;
- automatic or documented cleanup.

Sandbox identities do not receive production deployment permissions.

## 4. IAM inheritance model

Permissions should be granted at the highest level that matches the intended scope, but no higher.

| Identity group | Expected scope |
|---|---|
| Organisation security administrators | Organisation or common-security scope only where required |
| Platform administrators | Selected common and bootstrap resources, not unrestricted application data |
| Network administrators | Common networking and approved network resources |
| Country platform engineers | One country folder or selected projects within it |
| Developers | Non-production application resources and repository workflows |
| Production deployer | Specific production projects through federated CI/CD |
| Data analysts | Approved analytics datasets, not operational databases |
| Auditors | Read-only access to selected policies, logs, findings, and evidence |

Basic roles such as Owner and Editor are not used for routine access. Direct user bindings should be avoided in favour of groups and workload identities.

## 5. Policy inheritance model

| Level | Example policy responsibility |
|---|---|
| Organisation | Baseline restrictions, audit requirements, allowed identity domains |
| Bootstrap | State and deployment prerequisite protection |
| Common | Shared-service administration and central visibility controls |
| Production | Strong change control, approved locations, key restrictions, public-access controls |
| Country | Country region, ownership, encryption, and administrative constraints |
| Non-production | Synthetic data, lower cost, separate identities, no production reachability |
| Sandbox | Expiry, quotas, restricted services, and no production connectivity |
| Project | Workload-specific APIs, IAM, budgets, logging, and service configuration |

Policies should be inherited where possible. Project-level exceptions require an owner, rationale, compensating controls, and expiry date.

## 6. Project lifecycle

Projects must be created through the project factory rather than manually.

The minimum lifecycle is:

1. Request with owner, environment, country, workload, data classification, and billing information.
2. Policy and naming validation.
3. Project creation in the approved folder.
4. Billing attachment and budget configuration.
5. Baseline API, IAM, logging, network, and metadata configuration.
6. Validation against landing-zone requirements.
7. Handover to the authorised workload pipeline.
8. Periodic ownership and access review.
9. Controlled decommissioning and evidence retention.

## 7. Country onboarding

Adding a country should require configuration rather than structural redesign.

A country onboarding record must define:

- country code and display name;
- primary and recovery regions;
- responsible groups and owners;
- required projects;
- billing and budget thresholds;
- data classification assumptions;
- KMS and secrets boundaries;
- network ranges and connectivity requirements;
- log and security integration;
- approved exceptions.

The project factory then creates the folder, baseline projects, metadata, policies, and access bindings.

## 8. Security objectives supported

This hierarchy directly supports:

- `IAM-02` — separate workload identities;
- `IAM-03` — country-scoped administration;
- `IAM-05` — separation of duties;
- `NET-02` — network zoning;
- `NET-05` — production and non-production isolation;
- `CSPM-03` — approved locations;
- `CSPM-06` — asset visibility;
- `GOV-01` — required metadata;
- `GOV-02` — environment separation;
- `GOV-03` — controlled infrastructure changes;
- `GOV-05` — cost control;
- `GOV-06` — repeatable country onboarding.

## 9. Threats addressed

The hierarchy contributes to reducing:

- `TH-002` — cross-country or cross-programme access;
- `TH-003` — excessive country-administrator privilege;
- `TH-004` — stolen or leaked CI/CD credentials;
- `TH-005` — public database or storage exposure;
- `TH-009` — insecure infrastructure-as-code changes;
- `TH-013` — service-account compromise and lateral movement;
- `TH-014` — unauthorised KMS or secret access;
- `TH-016` — cloud posture drift;
- `TH-017` — disabled or bypassed monitoring;
- `TH-021` — backup exposure.

The hierarchy does not mitigate these threats by itself. IAM, networking, policy, logging, KMS, CI/CD, and validation controls are still required.

## 10. Constraints and open decisions

The following remain to be resolved in subsequent documents:

- final project-ID convention and uniqueness suffix;
- whether DNS remains in a separate project or is managed within networking;
- final Shared VPC host-project topology;
- exact organisation policies available in the implementation environment;
- final primary and recovery regions;
- Terraform state partitioning by environment and component;
- whether staging should later become country-specific;
- which common services require separate billing or stricter access boundaries.

## 11. Status

**Designed.**

No folders, projects, policies, or IAM bindings described here are represented as implemented until Terraform, deployment records, validation output, and evidence are available.
