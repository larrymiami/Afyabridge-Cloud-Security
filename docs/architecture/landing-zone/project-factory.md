# Project Factory

## 1. Purpose

The project factory defines the controlled, repeatable process used to create and baseline Google Cloud projects for AfyaBridge Cloud Security.

Its role is to ensure that projects are not created manually with inconsistent IAM, billing, logging, labels, APIs, regions, or security controls.

## 2. Design objectives

The project factory must:

- create projects from reviewed configuration;
- place projects beneath the correct folder;
- attach the approved billing account;
- apply mandatory labels and ownership metadata;
- enable only approved APIs;
- establish logging, monitoring, and asset visibility;
- assign least-privilege administrative groups and service accounts;
- create budgets and quotas;
- enforce environment and country boundaries;
- support repeatable onboarding and safe decommissioning;
- produce evidence of every project creation or update.

## 3. Factory boundary

The project factory manages the project lifecycle and project baseline.

It may manage:

- project creation;
- folder placement;
- billing attachment;
- project-level APIs;
- baseline IAM;
- labels and tags;
- log sinks;
- monitoring configuration;
- budgets;
- quota requests or limits;
- service-account creation for later deployment stages;
- default network removal;
- baseline organization-policy inheritance and exceptions.

It does not manage detailed application resources such as Cloud Run services, databases, application secrets, or application-specific IAM.

## 4. Project classes

The initial project classes are:

| Class | Purpose | Examples |
|---|---|---|
| Bootstrap | Infrastructure-management prerequisites | `afyabridge-bootstrap-core` |
| Common security | Security findings, posture, detections | `afyabridge-common-security` |
| Common logging | Central log aggregation and retention | `afyabridge-common-logging` |
| Common networking | Shared VPC hosts and network services | `afyabridge-common-network` |
| Common delivery | CI/CD identities and delivery tooling | `afyabridge-common-cicd` |
| Common artifacts | Artifact Registry and release metadata | `afyabridge-common-artifacts` |
| Country application | Country production application workloads | `afyabridge-prd-ke-app` |
| Country data | Country production data services | `afyabridge-prd-ke-data` |
| Country operations | Country monitoring and operations | `afyabridge-prd-ke-ops` |
| Shared non-production | Development or staging workloads | `afyabridge-stg-shared-app` |
| Sandbox | Short-lived experiments | generated project ID with expiry metadata |

Each class has an approved baseline and allowed deviations.

## 5. Project request contract

A project is declared through version-controlled input.

A project request must contain:

```yaml
project_id: afyabridge-prd-ke-app
display_name: AfyaBridge Kenya Production Application
project_class: country-application
folder_key: production-ke
billing_account_key: primary
environment: production
country: ke
owner: platform-engineering
technical_contact: platform-engineering
cost_center: kenya-programme
data_classification: restricted
managed_by: terraform
primary_region: africa-south1
required_apis:
  - run.googleapis.com
  - artifactregistry.googleapis.com
  - secretmanager.googleapis.com
budget_profile: production-country
network_profile: production-spoke
log_profile: production-restricted
exception_ids: []
```

The exact file format may change during implementation, but the contract fields remain stable unless changed through an ADR.

## 6. Required inputs

Every request must define:

- globally unique project ID;
- human-readable display name;
- project class;
- destination folder;
- billing profile;
- environment;
- country or `global` scope;
- accountable owner;
- technical contact;
- cost centre;
- data classification;
- management method;
- primary region;
- API profile;
- budget profile;
- network profile;
- logging profile;
- approved exception references.

Temporary projects must also define an expiry date.

## 7. Validation rules

The factory rejects a request when:

- the project ID violates the naming standard;
- the destination folder does not match environment or country;
- required labels are missing;
- a production project is declared without a country;
- the region is not approved for the project class;
- unapproved APIs are requested;
- the billing profile is missing;
- the owner or technical contact is unknown;
- a temporary project lacks an expiry date;
- an exception is referenced without a valid record;
- the request attempts to grant basic `Owner` or `Editor` roles;
- the request bypasses centralized logging or monitoring.

## 8. Baseline actions

For every project, the factory performs the following actions.

### 8.1 Resource hierarchy

- create or adopt the project;
- place it beneath the approved folder;
- prevent direct placement under the organization root;
- record project class and ownership.

### 8.2 Billing and cost

- attach the approved billing account;
- create the assigned budget;
- configure alert thresholds;
- apply cost-centre labels;
- apply quotas or service limits where supported;
- configure expiry controls for temporary projects.

### 8.3 APIs

- enable APIs from an approved profile;
- reject APIs outside the profile unless an exception exists;
- record enabled-service changes;
- disable unused services where safe.

### 8.4 Networking

- remove the default VPC where the project class does not require it;
- attach the project to the approved Shared VPC host when applicable;
- prevent ad hoc public networks;
- apply the correct network profile.

### 8.5 IAM

- create or reference required deployment service accounts;
- assign approved groups and custom roles;
- avoid user-managed service-account keys;
- enforce environment-specific deployment identities;
- prevent country administrators from receiving global access;
- apply conditional bindings where appropriate.

### 8.6 Logging and monitoring

- route required audit and security logs to central logging;
- apply log exclusions only through approved profiles;
- register project monitoring with the appropriate operations scope;
- enable required data-access logs where justified;
- ensure project creation and IAM changes remain auditable.

### 8.7 Security and governance

- apply mandatory labels and tags;
- inherit or apply approved policies;
- register the project in asset inventory;
- assign the approved data classification;
- configure baseline Security Command Center coverage where available;
- attach exception records and expiry dates.

## 9. Project-factory identities

The project factory uses a dedicated deployment identity.

The identity may require permissions to:

- create projects;
- move projects into approved folders;
- attach billing;
- enable services;
- configure baseline IAM;
- create budgets;
- configure logging and monitoring;
- set labels and tags.

Because these permissions are sensitive, the identity must:

- authenticate through workload identity federation;
- be usable only by the approved workflow;
- have no downloadable key;
- have no application-data access;
- be monitored for unusual use;
- be separated from application deployment identities;
- be disabled quickly during an incident.

## 10. Change workflow

The project lifecycle follows this workflow:

1. submit or update a project declaration;
2. validate schema and naming;
3. run policy checks;
4. create a Terraform plan;
5. review folder, billing, IAM, API, and logging changes;
6. merge the approved pull request;
7. authenticate through workload identity federation;
8. apply through the project-factory identity;
9. run post-creation validation;
10. retain evidence and update the project inventory.

Manual project creation is considered drift and must be reconciled or removed.

## 11. Post-creation validation

The factory verifies that:

- the project is beneath the expected folder;
- billing is attached;
- required labels are present;
- only approved APIs are enabled;
- no default network remains unless explicitly required;
- log sinks exist and are active;
- required IAM groups and service accounts exist;
- forbidden broad roles are absent;
- the assigned budget exists;
- the project appears in asset inventory;
- the region and network profiles match the request;
- temporary resources have an expiry mechanism.

Validation failure blocks project handoff.

## 12. Country onboarding

Adding a new production country requires:

- an approved country code;
- a country folder;
- production application, data, and operations project declarations;
- regional and data-location decisions;
- country IAM groups;
- country logging and monitoring configuration;
- country key and secret boundaries;
- budget profiles;
- updated threat and control mappings.

The factory must make country onboarding a parameterized operation rather than a manual redesign.

## 13. Sandbox lifecycle

Sandbox projects are treated as temporary.

They must:

- use synthetic data only;
- have a named owner;
- have a defined expiry date;
- have strict quotas and budgets;
- avoid production connectivity;
- avoid production identities and secrets;
- be deleted through the same controlled workflow.

Expired sandbox projects are disabled or removed after validation that no required evidence remains.

## 14. Project decommissioning

Project retirement requires:

1. approved decommission request;
2. data classification and retention review;
3. backup or evidence disposition;
4. removal of external dependencies;
5. revocation of identities and federation access;
6. deletion or transfer of secrets and keys;
7. logging and audit preservation as required;
8. billing detachment after cleanup;
9. project shutdown or deletion;
10. final asset and cost verification.

Deletion protection must be removed only during the approved decommission workflow.

## 15. Drift detection

The factory baseline is continuously compared with actual project configuration.

Drift includes:

- manually enabled APIs;
- missing labels;
- broad IAM grants;
- modified log sinks;
- detached budgets;
- unauthorized network creation;
- folder movement;
- missing expiry metadata;
- public resources introduced outside approved code.

Drift must create a finding, issue, or remediation pull request depending on severity.

## 16. Exceptions

A project may deviate from its class baseline only through an approved exception containing:

- exception ID;
- control or rule being bypassed;
- business and technical rationale;
- accountable owner;
- compensating controls;
- expiry date;
- approval;
- review status.

Expired exceptions cause validation failure until renewed or removed.

## 17. Evidence

Expected project-factory evidence includes:

- project request files;
- schema and policy validation output;
- Terraform plans;
- apply logs;
- folder and billing verification;
- IAM policy output;
- enabled-service inventory;
- budget configuration;
- log-sink configuration;
- asset inventory queries;
- project-decommission records.

## 18. Threat and objective traceability

This design primarily addresses:

- `TH-002` — cross-country or cross-programme access;
- `TH-003` — excessive country-administrator privilege;
- `TH-005` — public data-service exposure;
- `TH-009` — insecure infrastructure-as-code changes;
- `TH-013` — compromised service-account lateral movement;
- `TH-016` — cloud posture drift;
- `TH-017` — disabled or bypassed monitoring.

Mapped objectives include:

- `IAM-02`;
- `IAM-03`;
- `IAM-05`;
- `NET-01`;
- `NET-05`;
- `CSPM-03`;
- `CSPM-05`;
- `CSPM-06`;
- `GOV-01`;
- `GOV-02`;
- `GOV-03`;
- `GOV-05`;
- `GOV-06`;
- `MON-01`.

## 19. Implementation status

**Designed** — the project-factory contract and baseline are defined but have not yet been implemented or validated.