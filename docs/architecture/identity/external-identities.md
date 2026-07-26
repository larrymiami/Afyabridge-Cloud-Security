# External Identities

## Purpose

This document defines how AfyaBridge grants and governs access for identities that are not part of the core workforce directory. External identities include partners, contractors, auditors, support providers, implementers, and limited third-party service principals.

External access is treated as an exception to normal workforce access and must remain sponsored, scoped, time-bound, monitored, and removable without affecting internal identity lifecycle controls.

## Scope

This design covers:

- external human identities;
- partner and contractor identities;
- independent auditors;
- vendor support personnel;
- third-party workload identities;
- federated external principals;
- external access to cloud, application, operational, and evidence systems.

It does not permit anonymous administrative access or shared partner accounts.

## Principles

1. Every external identity must have a named internal sponsor.
2. External identities must be uniquely attributable to one person or workload.
3. Access must have a documented purpose, scope, and expiry date.
4. Production access requires stronger approval than non-production access.
5. External access must not create cross-country visibility by default.
6. External users must not own internal access groups or privileged workflows.
7. Shared credentials and shared mailboxes are prohibited for interactive access.
8. External workload access must use federation or short-lived credentials.
9. Dormant or unsponsored external identities must be removed.
10. External access must be reviewed more frequently than standard low-risk workforce access.

## External identity classes

| Class | Example | Default scope |
|---|---|---|
| Partner operator | programme implementation partner | assigned country, programme, and application role |
| Contractor | temporary engineer or analyst | approved environment and task |
| Auditor | independent assurance provider | read-only evidence and configuration access |
| Vendor support | product or platform support specialist | case-specific, temporary access |
| External responder | specialist assisting an incident | incident-specific elevation |
| External workload | partner system or managed service | explicit API, service account, or federated principal |

## Sponsorship

Every external identity record must include:

- legal or business name;
- identity principal;
- organisation;
- internal sponsor;
- business purpose;
- requested role;
- environment;
- country and programme scope;
- approved systems;
- start date;
- expiry date;
- approving authority;
- confidentiality or contractual reference where applicable;
- review cadence.

The sponsor is responsible for confirming continuing need and initiating revocation when the engagement ends.

## Authentication requirements

External human identities must:

- use an individually assigned account;
- use MFA;
- meet the approved authentication-strength requirement for the target system;
- use managed federation where available;
- avoid consumer identities for privileged production access;
- reauthenticate before sensitive or privileged actions;
- comply with session-duration and device requirements appropriate to risk.

Where the partner identity provider cannot meet the required assurance level, AfyaBridge must issue a controlled identity or deny the requested access.

## Access models

### Application access

External application access is assigned through a specific external role and constrained by:

- country;
- programme;
- organisation;
- facility;
- permitted actions;
- record assignment;
- engagement expiry.

The application must not infer unrestricted access from an external organisation relationship.

### Cloud access

External cloud access should be rare. When required, it must use:

- dedicated external-access groups;
- predefined or custom least-privilege roles;
- the lowest practical resource level;
- IAM Conditions or equivalent expiry enforcement where available;
- no basic Owner or Editor role;
- no direct access to unrelated country or shared-security projects;
- no permission to alter the identity-monitoring path.

### Evidence and audit access

Auditors receive read-only access to the minimum evidence set required for the approved review. Evidence should be exported or exposed through an audit-specific boundary rather than granting broad access to production systems.

### Vendor support access

Vendor support access must be linked to a support case and activated only for the duration of troubleshooting. Sensitive data must be minimised, masked, or excluded where possible.

## Third-party workload identities

External systems must not use embedded long-lived Google Cloud service-account keys.

Preferred mechanisms are:

- Workload Identity Federation;
- workload-specific service accounts;
- signed requests with managed key rotation;
- OAuth client credentials stored in an approved secret manager where federation is unavailable;
- mutually authenticated service connections where justified.

Each external workload trust must restrict:

- issuer;
- audience;
- subject;
- organisation or tenant;
- approved environment;
- target service account;
- permitted APIs;
- token lifetime.

Trust conditions must prevent a partner from using one environment or repository identity to access another.

## Country and data boundaries

External access must preserve the country-isolation model.

- Kenya partner access does not imply Ghana or South Africa access.
- Cross-country access requires explicit central approval and documented purpose.
- External analytics access should use de-identified or aggregated data where feasible.
- Direct database access is prohibited by default.
- Bulk export capability requires separate approval and monitoring.
- Country-specific legal or contractual restrictions must be represented as architecture assumptions and validated by the responsible governance function.

## Privileged external access

External users do not receive standing privileged access.

Privileged access requires:

- a current engagement and sponsor;
- a specific task or incident;
- independent approval;
- temporary activation;
- country and environment scope;
- enhanced monitoring;
- verified expiry;
- post-use review.

Break-glass accounts are internal emergency identities and must not be delegated to vendors or partners.

## Lifecycle

### Onboarding

Before access is activated:

1. the sponsor submits a complete request;
2. identity assurance is confirmed;
3. required agreements are in place;
4. role conflicts are checked;
5. expiry is configured;
6. MFA is verified;
7. access is tested with negative country and environment checks.

### Changes

Changes to organisation, contract, role, country, programme, or sponsor require re-evaluation. Access must not persist automatically after a material engagement change.

### Offboarding

Access must be revoked when:

- the contract or engagement ends;
- the approved task is complete;
- sponsorship is withdrawn;
- the sponsor leaves or changes role without reassignment;
- the identity becomes inactive;
- assurance requirements are no longer met;
- misuse or compromise is suspected.

Revocation must include sessions, group membership, application assignments, impersonation permission, secrets, API clients, and federated trust where applicable.

## Review cadence

| External access type | Minimum review cadence |
|---|---|
| Production privileged access | after each use and monthly eligibility review |
| Production operational access | monthly |
| Non-production contractor access | quarterly |
| Auditor access | per engagement and on closure |
| External workload federation | quarterly and after trust changes |
| Dormant external identity | monthly detection and removal review |

## Monitoring

Monitoring must detect:

- access after expiry;
- external identities without sponsors;
- dormant accounts retaining access;
- direct grants outside approved groups;
- cross-country attempts;
- bulk or unusual data access;
- unexpected workload token exchanges;
- privileged activity without activation records;
- group ownership by external users;
- external access to central logging or security configuration outside approved scope.

## Exceptions

An exception must document:

- why the standard model cannot be used;
- affected identity and system;
- compensating controls;
- owner;
- expiry;
- review date;
- revocation plan.

Exceptions do not permit shared identities, indefinite access, service-account keys, or unmonitored privileged access.

## Validation requirements

The external-identity design is validated when tests demonstrate that:

1. access expires automatically or is reliably revoked;
2. a partner scoped to one country cannot access another;
3. an external user cannot self-approve elevation;
4. an unsponsored identity is detected;
5. an unapproved external workload subject cannot federate;
6. an auditor cannot modify production resources;
7. vendor access is removed when the support window closes;
8. external privileged activity is linked to an approval and review record.

## Threat and objective traceability

This design primarily addresses:

- TH-001 compromised CHW account;
- TH-002 cross-country or programme access;
- TH-003 excessive country administrator privilege;
- TH-004 stolen or leaked CI/CD credential;
- TH-013 compromised service account and lateral movement;
- TH-015 identifiable cross-country analytics export;
- TH-019 third-party integration failure or compromise.

Relevant objectives include IAM-01 through IAM-07, APP-01 through APP-06, CICD-01 through CICD-04, GOV-01 through GOV-06, MON-01 through MON-06, and IR-01 through IR-05.

## Status

**Designed**. External identity federation, groups, expiry automation, review workflows, tests, and evidence are implemented in later phases.
