# Workload Identities

## Purpose

This document defines how AfyaBridge workloads authenticate to Google Cloud and to each other without long-lived credentials.

## Principles

1. Every deployable workload receives a dedicated identity.
2. Workload identity is separated by environment, country, and responsibility.
3. Service-account keys are prohibited.
4. A workload may impersonate another identity only through an explicit, reviewed binding.
5. Permissions are granted to the narrowest resource scope that supports the workload.
6. Human users do not routinely authenticate as workload service accounts.
7. Production and non-production identities are not shared.

## Identity classes

| Class | Example | Scope |
|---|---|---|
| Runtime service account | `sa-prd-ke-api` | One runtime workload |
| Job service account | `sa-prd-ke-sync` | One scheduled or batch process |
| Deployment service account | `sa-prd-ke-deployer` | One deployment target |
| Migration service account | `sa-prd-ke-db-migrate` | Controlled schema migrations |
| Observability service account | `sa-common-log-export` | Central logging integration |
| Security automation service account | `sa-common-posture-scan` | Asset and posture inspection |

## Naming model

```text
sa-<environment>-<country-or-shared>-<purpose>
```

Examples:

```text
sa-prd-ke-api
sa-prd-gh-worker
sa-prd-za-db-migrate
sa-stg-shared-api
sa-common-log-export
```

## Runtime boundaries

Each production country uses separate service accounts for application, worker, migration, and operations workloads. A Kenya runtime identity must not receive access to Ghana or South Africa production data projects.

Shared services may access country resources only where a documented cross-project function requires it, such as centralized logging or approved security inventory. Such access must be read-only unless the service explicitly performs a controlled remediation action.

## Authentication methods

| Source | Target | Method |
|---|---|---|
| Cloud Run workload | Google Cloud API | Attached service account and Application Default Credentials |
| GitHub Actions | Deployment service account | Workload Identity Federation and service-account impersonation |
| Scheduled workload | Google Cloud API | Dedicated runtime service account |
| Service-to-service request | Internal application endpoint | Signed identity token with audience validation |
| Security automation | Asset and logging APIs | Dedicated central service account |

Long-lived JSON keys, embedded credentials, and copied access tokens are prohibited.

## Service-account impersonation

Impersonation is used to keep the external identity and target privilege separate.

Required controls:

- the caller must be explicitly authorized to impersonate the target account;
- production deployers are separate from non-production deployers;
- impersonation conditions restrict repository, branch, workflow, environment, or approved human group where supported;
- token lifetimes remain short;
- all impersonation events are logged;
- service-account token-creation privileges are not granted broadly.

## Permission design

Predefined roles are preferred where they are sufficiently narrow. Custom roles are permitted when predefined roles materially exceed the required permission set.

A workload identity must not receive:

- basic `Owner` or `Editor` roles;
- organization-wide access unless it is an approved central security function;
- permission to create service-account keys;
- permission to modify its own IAM policy;
- access to unrelated country data;
- both deployment and runtime administration privileges without documented justification.

## Deployment identity separation

Deployment identities are divided by environment and production country:

```text
sa-dev-shared-deployer
sa-stg-shared-deployer
sa-prd-ke-deployer
sa-prd-gh-deployer
sa-prd-za-deployer
```

Production deployment identities may modify only their assigned country projects and approved shared resources. A successful non-production deployment does not itself authorize production deployment.

## Database migrations

Database migration identities are distinct from runtime identities because schema changes carry elevated risk.

Controls include:

- separate migration account per environment and production country;
- use only during an approved deployment workflow;
- database permissions restricted to required migration operations;
- no standing human impersonation except emergency procedures;
- migration output and actor identity retained as deployment evidence.

## Workload lifecycle

### Provisioning

A workload identity is created from version-controlled infrastructure definitions with:

- owner;
- environment;
- country or shared scope;
- purpose;
- required roles;
- permitted impersonators;
- expected runtime;
- review date.

### Change

Permission changes require review against the workload's declared purpose and mapped threats.

### Retirement

When a workload is retired:

1. disable deployments;
2. remove impersonation bindings;
3. remove resource access;
4. disable or delete the service account after the recovery window;
5. verify no active resources still reference it;
6. retain relevant audit evidence.

## Monitoring

Alerts or periodic reviews must identify:

- newly created service accounts;
- key creation or upload attempts;
- unexpected token creation;
- cross-country access;
- permissions added outside infrastructure code;
- unused identities;
- identities with basic roles;
- identities capable of modifying their own access.

## Validation

The design is validated when tests demonstrate that:

- a Kenya workload cannot read Ghana production data;
- a non-production deployer cannot modify production;
- a GitHub workflow outside the approved repository or branch cannot impersonate a deployer;
- service-account key creation is denied;
- service-to-service tokens with an invalid audience are rejected;
- retired identities can no longer obtain tokens or access resources.

## Traceability

Primary objectives: `IAM-02`, `IAM-03`, `IAM-04`, `IAM-05`, `CICD-01`, `CICD-02`, `CICD-03`.

Primary threats: `TH-004`, `TH-006`, `TH-013`, `TH-014`, `TH-017`.

## Status

**Designed**
