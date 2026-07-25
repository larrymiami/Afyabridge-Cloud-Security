# Identity Role Model

## Purpose

This document defines the combined cloud and application role model for AfyaBridge. It separates infrastructure administration from access to health and programme data and establishes the minimum scopes used for role assignment.

## Role dimensions

An effective grant is composed from:

```text
principal + role + environment + country + resource scope + duration
```

Application roles may additionally include programme, organization, facility, and record-assignment scope.

## Role families

| Family | Control plane | Purpose |
|---|---|---|
| Workforce platform roles | Google Cloud IAM | Operate cloud services and projects |
| Security roles | Google Cloud IAM and security tooling | Investigate, review, and respond |
| Delivery roles | CI/CD and Google Cloud IAM | Plan and apply approved changes |
| Application roles | AfyaBridge authorization layer | Access business and health functions |
| Emergency roles | Temporary elevation | Restore or protect service during incidents |
| Audit roles | Read-only evidence access | Independent review and assurance |

## Workforce platform roles

| Role | Scope | Key permissions | Explicit exclusions |
|---|---|---|---|
| Organization policy administrator | Organization policy resources | Manage approved policy definitions | Workload data access |
| Folder administrator | Assigned folder | Manage approved folder configuration | Other country folders |
| Country platform operator | One production country | Operate approved runtime resources | Other countries and unrestricted IAM changes |
| Non-production operator | Development and staging | Operate non-production resources | Production resources |
| Network operator | Shared network project and delegated network resources | Manage approved networking | Application and health data |
| Logging operator | Central logging project | Maintain sinks, storage, and routing | Unmasked health records |
| Security reviewer | Organization or approved folders | Read IAM, assets, findings, and audit evidence | Routine resource modification |
| Incident responder | Time-bound approved scope | Containment actions defined by runbook | Standing broad administration |
| Billing viewer | Billing and cost datasets | Review spending and allocation | Resource administration |

## Delivery roles

| Role | Scope | Use |
|---|---|---|
| Terraform planner | Defined state boundary | Read configuration and produce plans |
| Non-production deployer | Shared development or staging | Apply approved non-production changes |
| Kenya production deployer | Kenya production projects | Apply approved Kenya changes |
| Ghana production deployer | Ghana production projects | Apply approved Ghana changes |
| South Africa production deployer | South Africa production projects | Apply approved South Africa changes |
| Project-factory deployer | Resource hierarchy and project baseline | Create and configure approved projects |
| Database migration runner | One environment and country database | Execute approved schema migrations |

Planning and applying may use separate identities where risk warrants it. Production deployment roles are not inherited by non-production delivery identities.

## Application roles

| Role | Data scope | Typical actions |
|---|---|---|
| CHW | Assigned households and programmes | Register, screen, update, synchronize |
| Clinician | Assigned consultations or facilities | Review and update clinical records |
| Supervisor | Assigned teams and programmes | Review work, manage assignments, approve corrections |
| Programme manager | Assigned programme | View operational reports and programme configuration |
| Country operator | One country | Manage country operations and approved users |
| Support analyst | Approved support cases | Diagnose issues with masking and limited record access |
| Country security reviewer | One country | Review audit and security events |
| Auditor | Explicit evidence set | Time-bound read-only review |
| Platform administrator | Platform configuration | Manage platform settings without automatic clinical-data access |

## Prohibited combinations

The following combinations require explicit exception review or are prohibited:

- production deployment and production approval by the same person where separation of duties is required;
- platform administration combined with unrestricted health-record access;
- organization-wide IAM administration combined with routine application use;
- security-log administration combined with the ability to suppress or delete the only copy of audit evidence;
- project-factory administration combined with unreviewed billing administration;
- runtime service account and deployment service account sharing the same identity;
- one human account holding active country-operator roles for multiple production countries without documented global responsibility.

## Assignment mechanisms

### Workforce

Workforce access is assigned primarily through managed Google Groups. Direct user IAM bindings are exceptions and must be time-bound and documented.

Example group pattern:

```text
gcp-<environment>-<country-or-shared>-<function>@<domain>
```

### Workloads

Workload permissions are assigned directly to dedicated service accounts through version-controlled infrastructure definitions.

### Applications

Application roles and attributes are maintained in the application's trusted authorization store. Google Cloud group membership is not used as a substitute for record-level authorization.

## Scope hierarchy

Grants should be attached at the narrowest stable scope:

1. resource;
2. project;
3. country folder;
4. shared-services folder;
5. organization, only for truly organization-wide functions.

Inherited grants must be reviewed for unintended access to new projects.

## Custom roles

Custom IAM roles are allowed when predefined roles materially exceed required permissions.

Every custom role requires:

- a stable identifier;
- business and technical owner;
- permission list;
- intended scope;
- mapped workloads or groups;
- security review;
- test evidence;
- periodic review date;
- migration plan when permissions become obsolete.

## Temporary access

Temporary grants must include:

- requester;
- approver;
- role and scope;
- reason;
- start and expiry;
- related incident, change, or audit reference;
- post-access review where sensitive actions occurred.

Expiry is enforced technically where possible and otherwise monitored as a control gap.

## Review cadence

| Access class | Minimum review |
|---|---|
| Organization and privileged roles | Monthly |
| Production country administration | Quarterly |
| Security and incident-response roles | Quarterly |
| Non-production roles | Semi-annually |
| External and auditor roles | At each engagement and expiry |
| Workload service accounts | Quarterly and on workload change |
| Application roles | Quarterly for privileged roles; periodically for standard users |

## Validation

Role-model validation must detect:

- direct user bindings outside the exception register;
- basic `Owner`, `Editor`, or `Viewer` use where narrower access is expected;
- cross-country production grants;
- expired temporary grants;
- inactive identities retaining access;
- prohibited role combinations;
- service accounts with human-login patterns;
- application administrators with unexplained clinical-data access.

## Traceability

Primary objectives: `IAM-01` through `IAM-07`, `GOV-01`, `GOV-03`, `MON-03`.

Primary threats: `TH-001`, `TH-002`, `TH-003`, `TH-004`, `TH-013`, `TH-014`, `TH-017`.

## Status

**Designed**
