# Workload deployment foundation

## Status

**Implemented and statically validated.**

This document describes the v0.7D Terraform design for country-scoped workload services in Kenya, Ghana, and South Africa. The configuration has not been applied to a live Google Cloud organization, so this is not evidence of deployed or production-ready infrastructure.

## Scope

The workload root composes independent country inventories for:

- Artifact Registry repositories;
- Secret Manager secrets;
- Cloud KMS key rings and symmetric encryption keys;
- Cloud Run services and runtime identities;
- Cloud SQL for PostgreSQL instances;
- Cloud Storage buckets.

Each resource is explicitly assigned to a country, environment, project, and region or location. No cross-country resource sharing is declared.

## Country boundary

The reference inventory uses separate application projects for `ke`, `gh`, and `za`. Resource identity and validation are country scoped.

The Terraform design rejects unsupported country codes and validates uniqueness for resource identifiers. Country separation in code does not prove effective isolation after deployment; organization policy, IAM inheritance, network state, and manually created resources must also be verified.

## Artifact Registry

The reusable repository module provides:

- Docker tag immutability by default;
- cleanup policies in dry-run mode by default;
- optional customer-managed encryption keys;
- deletion protection;
- additive reader and writer IAM;
- rejection of `allUsers` and `allAuthenticatedUsers`;
- repository identity and URI outputs.

Image references consumed by Cloud Run are required to be digest pinned in the workload contract.

## Secret Manager

The secret module creates secret metadata only. It deliberately does not create secret versions or place secret payloads in Terraform state.

Controls include:

- user-managed regional replication;
- optional per-replica CMEK;
- delayed version destruction;
- optional rotation schedules and Pub/Sub notification topics;
- deletion protection;
- additive accessor and viewer IAM;
- rejection of public principals.

Rotation configuration is a notification and scheduling contract. It does not implement application-level credential replacement.

## Cloud KMS

Country key rings own symmetric `ENCRYPT_DECRYPT` keys intended for workload CMEK use.

Defaults include:

- 90-day automatic rotation;
- 30-day scheduled-destruction delay;
- Terraform destruction protection;
- additive encrypter/decrypter and viewer IAM;
- rejection of public principals.

Before deployment, service agents for Artifact Registry, Secret Manager, Cloud SQL, and Cloud Storage must receive the service-specific KMS permissions required for their encrypted resources.

## Cloud Run

The Cloud Run module creates a dedicated runtime service account and a second-generation service contract.

Security defaults include:

- internal or internal-plus-load-balancer ingress only;
- no public invoker principal;
- digest-pinned container images;
- Serverless VPC Access connector wiring;
- controlled `ALL_TRAFFIC` or `PRIVATE_RANGES_ONLY` egress;
- Secret Manager references instead of plaintext secret values;
- additive runtime roles and invoker IAM;
- deletion protection.

The module does not create external load balancers, certificates, public DNS, Cloud Armor policies, or identity-aware application access.

## Cloud SQL for PostgreSQL

The database module creates PostgreSQL instances with private service networking only.

Controls include:

- public IPv4 disabled;
- country Shared VPC network input;
- optional CMEK;
- regional high availability by default;
- SSD storage and automatic growth;
- automated backups and point-in-time recovery;
- configurable backup and transaction-log retention;
- controlled maintenance windows;
- deletion protection and Terraform `prevent_destroy`.

Database users and passwords are intentionally outside Terraform. Provisioning and rotation require a separate controlled workflow.

## Cloud Storage

The bucket module provides:

- uniform bucket-level access;
- enforced public-access prevention;
- versioning by default;
- soft-delete retention;
- optional CMEK;
- optional bucket retention policy;
- lifecycle-management rules;
- additive IAM with public-principal rejection;
- `force_destroy = false`;
- Terraform destruction protection.

Retention, soft delete, versioning, and lifecycle rules must be reviewed together because they affect recovery behavior, storage cost, and deletion timelines.

## IAM model

The modules use additive IAM member resources rather than authoritative project-wide policies. This reduces accidental replacement of unrelated bindings but does not prevent excessive permissions elsewhere in the organization.

The design does not create service-account keys. Runtime identities are referenced by email and are intended for workload identity on managed Google Cloud services.

## Encryption boundary

CMEK inputs are optional at the reusable-module level to support staged composition. A production deployment should establish the country KMS resources and service-agent permissions before enabling CMEK on dependent services.

A key existing in Terraform is not evidence that dependent services can use it. Deployment validation must confirm service-agent IAM, key location compatibility, encryption state, rotation, and recovery procedures.

## Dependency order

A controlled deployment should generally proceed in this order:

1. required APIs and service identities;
2. country KMS key rings and keys;
3. KMS IAM for managed-service agents;
4. Artifact Registry and Secret Manager metadata;
5. Cloud Storage and Cloud SQL;
6. runtime service accounts and project roles;
7. Cloud Run services;
8. application-managed secret versions and database identities;
9. runtime and negative-control testing.

Terraform dependency edges should be supplemented by operational sequencing where managed service agents or externally populated secrets are involved.

## Explicit exclusions

v0.7D does not implement or validate:

- a live Google Cloud deployment;
- application source code or container builds;
- CI workload identity federation for deployments;
- external HTTPS load balancing or Cloud Armor;
- public DNS or certificates;
- database users, passwords, schemas, or migrations;
- secret payload creation or automatic credential rotation;
- centralized logs, alerts, dashboards, or incident response;
- backup restoration tests;
- disaster recovery across regions or countries;
- cost, quota, latency, and capacity validation.

## Validation boundary

Static validation demonstrates that Terraform can format, initialize without the remote backend, and validate the workload root against the selected provider schema. It does not test API permissions, resource availability, service-agent IAM, effective network paths, runtime invocation, data access, or destructive-operation safeguards in Google Cloud.
