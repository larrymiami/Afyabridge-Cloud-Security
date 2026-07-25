# Environment Separation

## Purpose

This document defines how production, staging, development, and sandbox environments are separated within the AfyaBridge Google Cloud landing zone.

The objective is to prevent accidental or unauthorised movement between environments while preserving a practical promotion path from development to production.

## Environment model

| Environment | Scope | Primary purpose | Data | Lifetime |
|---|---|---|---|---|
| Production | Country-specific | Live operational workloads | Synthetic restricted test data treated as sensitive | Persistent while active |
| Staging | Shared, country-aware | Production-like validation, DAST, release verification | Synthetic | Intermittent |
| Development | Shared | Integration and feature development | Synthetic | Intermittent |
| Sandbox | Isolated, short-lived | Experiments and controlled misconfiguration tests | Synthetic only | Hours or days |

## Separation principles

1. Production is isolated from non-production at the folder, project, identity, network, state, and secret layers.
2. Production deployment identities are distinct from development and staging identities.
3. Non-production identities cannot deploy to or administer production.
4. Production data services are not reachable from development or sandbox networks.
5. Secrets, encryption keys, service accounts, and Terraform state are environment-specific.
6. Artifacts move forward through a controlled promotion process; source is not rebuilt separately for production.
7. Manual changes to production are prohibited except through an approved emergency process.
8. Sandbox resources must have an owner, expiry date, budget, and cleanup path.

## Production model

Each production country has its own folder and workload projects.

```text
production/
├── kenya/
│   ├── app
│   ├── data
│   └── ops
├── ghana/
│   ├── app
│   ├── data
│   └── ops
└── south-africa/
    ├── app
    ├── data
    └── ops
```

Production boundaries include:

- country-scoped IAM groups and service accounts;
- separate workload projects;
- separate data projects;
- country-aware encryption keys;
- dedicated production Terraform state;
- production-only deployment identities;
- restricted networking and private data services;
- centrally exported logs with country metadata;
- independent budgets and cost attribution.

## Non-production model

Development and staging are shared initially to reduce cost and operational overhead.

They must still preserve logical country boundaries in:

- test identities;
- application claims;
- database records;
- test suites;
- logs and metrics;
- deployment configuration.

Shared non-production does not imply shared production access.

## Promotion path

The intended release flow is:

```text
feature branch
    ↓
pull request validation
    ↓
development deployment
    ↓
staging deployment
    ↓
security and release validation
    ↓
production approval
    ↓
promotion of the same signed artifact digest
```

Production promotion requires:

- passing mandatory tests and security scans;
- a signed image and verifiable provenance;
- approved Terraform plan where infrastructure changes are included;
- environment-specific approval;
- production deployment through a dedicated identity;
- post-deployment health and security checks.

## Identity separation

| Identity type | Development | Staging | Production |
|---|---|---|---|
| Human developers | Contributor access | Read and limited operational access | No standing administrative access |
| Deployment identity | Development only | Staging only | Production only |
| Runtime service accounts | Per service | Per service | Per service and country |
| Security operators | Read security telemetry | Read security telemetry | Controlled investigative access |
| Break-glass identity | Not required | Not required | Restricted, monitored, temporary |

## Terraform state separation

Terraform state must be separated by environment and, for production, by country or major platform boundary.

Example state layout:

```text
bootstrap/
common/
nonprod/development/
nonprod/staging/
production/kenya/
production/ghana/
production/south-africa/
```

Production state must not be stored locally or shared with development state.

## Secret and key separation

- Secret Manager secrets are environment-specific.
- Production secrets are not copied into non-production.
- Test secrets are synthetic and separately generated.
- Production key rings and keys are separate from non-production.
- Country workloads must not use another country’s assigned keys.
- Key administration remains separate from workload key use.

## Network separation

- Development and staging use non-production network boundaries.
- Production country projects attach only to approved production network segments.
- Non-production routes must not provide access to production data services.
- Shared services expose only explicitly approved interfaces.
- Default-deny rules apply between environment zones.

## Logging and monitoring

All environments export selected security-relevant logs to central logging and security services.

Environment metadata must be present on:

- projects;
- log sinks;
- alerts;
- dashboards;
- findings;
- incident records.

Production alerts use stricter severity and escalation criteria than development alerts.

## Sandbox controls

Sandbox environments must:

- use synthetic data only;
- be isolated from production and shared sensitive services;
- have an expiry date;
- have a defined owner;
- use budget alerts;
- be removable through Terraform or documented cleanup commands;
- never host long-lived credentials;
- be reviewed before any public endpoint is enabled.

## Exceptions

Any exception to environment separation must document:

- business or engineering reason;
- owner;
- affected environments;
- temporary duration;
- compensating controls;
- approval;
- removal date.

## Validation

The separation model will be validated through:

- denied production deployment from non-production identities;
- failed network connectivity from development to production data services;
- IAM tests across country and environment boundaries;
- state and secret inventory checks;
- artifact-promotion verification;
- drift detection for manual production changes.

## Related objectives and threats

**Objectives:** GOV-02, GOV-03, IAM-02, IAM-03, IAM-05, NET-03, NET-05, KMS-01, SEC-02, SUP-03  
**Threats:** TH-002, TH-003, TH-004, TH-005, TH-009, TH-013, TH-014, TH-016
