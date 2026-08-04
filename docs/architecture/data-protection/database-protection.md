# Database Protection

## Purpose

This document defines security requirements for databases that store AfyaBridge household, patient, referral, clinical, identity, audit, configuration, and operational data.

The design applies to transactional databases, managed relational databases, document stores, caches that may contain sensitive values, migration tooling, read replicas, exports, snapshots, and restored copies.

## Design principles

- Each production country has a separate system of record.
- Production databases are private and are not reachable directly from the public internet.
- Database access requires both an approved network path and an attributable identity.
- Applications use dedicated database identities with least privilege.
- Human database access is exceptional, temporary, approved, and audited.
- Restricted data is not copied into development or sandbox environments.
- Backups, replicas, exports, and restored databases inherit the source classification.
- Schema changes and data migrations are controlled production changes.
- Database audit evidence must support investigation without exposing unnecessary health data.

## Country and environment separation

Kenya, Ghana, and South Africa production databases are logically and operationally separate. A failure or compromise in one country must not provide an implicit database path to another.

The following are prohibited by default:

- one shared production database containing all countries;
- cross-country read replicas;
- global administrative database accounts;
- non-production replicas of production datasets;
- shared database credentials across environments;
- direct queries from a shared analytics system into country production databases.

Approved cross-country reporting uses transformed, minimized outputs under the export and analytics design.

## Connectivity

Production database endpoints use private connectivity where supported. Firewall, route, private-service, and serverless connector controls restrict reachability to approved workloads and administration paths.

Network reachability alone does not grant database access. The database must also authenticate the calling workload or operator.

Public database endpoints are prohibited as a normal operating model. A temporary public endpoint is not an accepted incident-recovery shortcut.

## Application identities

Each deployable workload receives a dedicated database identity or credential. Database permissions are scoped to required schemas, tables, views, procedures, and operations.

Examples:

| Workload | Expected access |
|---|---|
| Household API | Read and write assigned household and demographic records |
| Referral service | Read minimum referral context; create and update referral records |
| Offline sync worker | Apply validated sync operations through controlled procedures |
| Reporting exporter | Read approved views or execute approved export procedures |
| Migration job | Temporary schema-change permissions during an approved release |
| Monitoring job | Metadata and health access without clinical record access |

A runtime application identity does not receive schema-owner or database-administrator rights.

## Role separation

The database role model separates:

- runtime read/write roles;
- read-only reporting roles;
- migration roles;
- backup and restore roles;
- audit-review roles;
- emergency administration roles;
- service-managed identities.

Migration identities are not reused as runtime identities. Human operators do not share application database accounts.

## Schema and field protections

The application data model must:

- minimize collection of identifiers;
- separate identity data from clinical or programme data where practical;
- avoid storing secrets in ordinary application tables;
- use strict data types, constraints, and referential integrity;
- prevent unbounded free-text fields from becoming uncontrolled sensitive-data stores;
- classify newly introduced fields during schema review;
- document fields requiring application-layer encryption, tokenization, or masking.

Highly sensitive fields may require additional application-layer protection when database-level encryption and access controls do not sufficiently reduce the threat. Such protection must include an explicit key, search, rotation, recovery, and observability design.

Application-layer encryption is not added indiscriminately because it can weaken validation, search, integrity, and recovery when poorly designed.

## Query authorization

Database permissions do not replace application authorization. The application must enforce country, programme, facility, assignment, and record scope before executing a query.

Where practical, database controls provide defense in depth through:

- country-specific databases;
- separate schemas;
- restricted views;
- stored procedures for high-risk operations;
- row-level policies where their operational complexity is justified;
- explicit denial of direct table access to reporting consumers.

Client-provided identifiers are never sufficient proof that a record may be accessed.

## Administrative access

Direct human access to production data is exceptional and follows the privileged-access architecture.

Required controls include:

1. named operator identity;
2. approved incident, maintenance, or support purpose;
3. country- and environment-specific scope;
4. temporary elevation;
5. private administrative path;
6. session and query logging where supported;
7. post-access review for Restricted data;
8. automatic expiry and verified revocation.

Generic shared accounts and standing global database administrator access are prohibited.

## Schema migrations

Schema and data migrations are version-controlled and executed by a dedicated deployment or migration identity.

Migration controls include:

- peer review;
- backward-compatibility assessment;
- classification review for new fields;
- backup or recovery point where required;
- dry run or non-production validation;
- lock and availability impact assessment;
- rollback or forward-fix plan;
- post-deployment validation;
- recorded migration evidence.

An application deployment must not silently obtain database-owner rights to run uncontrolled migrations at startup.

## Audit logging

Database audit telemetry should record:

- authentication success and failure;
- privilege and role changes;
- schema changes;
- database creation, deletion, clone, and restore operations;
- backup and export actions;
- administrative queries where supported;
- unusually large reads or writes;
- access outside expected workload identity or execution context;
- failed attempts to access another country or environment.

Audit logs must avoid recording full query parameters or result sets when they may contain Restricted data. Where full query text is required, access to those logs is restricted and retention is justified.

## Data masking and support use

Support, testing, demonstrations, and training use synthetic data by default.

When realistic structure is required, a controlled transformation process must:

- remove direct identifiers;
- transform quasi-identifiers;
- break links to source identifiers;
- assess re-identification risk;
- preserve only the fields necessary for the approved purpose;
- produce the dataset outside the production database;
- record the source, transformation, owner, expiry, and recipients.

A database dump with names removed is not automatically anonymized.

## Backups, replicas, and clones

Backups, replicas, snapshots, point-in-time logs, and clones inherit the database classification and country boundary.

They require:

- encryption under the approved key design;
- location and residency controls;
- restricted restore permissions;
- documented retention;
- access logging;
- periodic restore tests;
- secure deletion after expiry.

Restored databases are isolated until validation confirms that access, logging, encryption, and network controls match the intended environment.

## Caches and temporary stores

Caches are treated as data stores when they contain Restricted or Confidential values.

Controls include:

- private connectivity;
- authentication where supported;
- short time-to-live values;
- avoidance of unnecessary full-record caching;
- no secrets in cache keys;
- encryption in transit;
- controlled persistence settings;
- explicit invalidation after authorization or record changes.

## Monitoring and detections

Priority detections include:

- public endpoint creation;
- new broad database role grants;
- human login to a production database;
- database access by an unexpected workload identity;
- unusual export, snapshot, clone, or restore activity;
- high-volume reads of Restricted tables;
- disabled audit logging;
- cross-country connection attempts;
- non-production identities accessing production;
- backup or replica creation in an unapproved location;
- destructive queries outside an approved change window.

## Validation requirements

Before database protection is marked implemented, evidence must show:

1. production endpoints are private;
2. country databases are separately controlled;
3. runtime identities cannot administer schemas;
4. non-production identities cannot authenticate to production;
5. direct human access requires temporary approval;
6. Restricted data is absent from development and sandbox;
7. audit logs capture seeded administrative and export events;
8. backups and restores retain the expected controls;
9. schema migrations are attributable and repeatable;
10. detection alerts reach an assigned owner.

## Status

**Designed.** No database endpoint, role, audit configuration, migration control, masking process, backup policy, or detection is considered implemented until configuration, tests, and evidence exist.
