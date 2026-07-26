# Access Lifecycle

## Purpose

This document defines the joiner, mover, leaver, contractor, temporary-assignment, and emergency-change processes for AfyaBridge identities and access.

The lifecycle applies to:

- workforce identities;
- Google Group memberships;
- Google Cloud IAM access;
- application roles and assignments;
- CI/CD and workload-identity trust relationships;
- privileged-access eligibility;
- third-party and auditor access;
- emergency accounts.

## Objectives

The lifecycle must ensure that:

1. Access begins only after an authoritative relationship exists.
2. Access is based on current role, country, programme, facility, and duty.
3. Access changes promptly when responsibilities change.
4. Access ends promptly when the relationship ends.
5. Temporary access expires automatically where possible.
6. Orphaned identities and stale privileges are detected.
7. Every access change has an owner, reason, approver, and timestamp.
8. Workforce and application entitlements remain consistent.

## Authoritative attributes

The identity lifecycle relies on authoritative attributes such as:

| Attribute | Example | Primary use |
|---|---|---|
| Employment or contract status | active, suspended, ended | Account enablement |
| Worker type | employee, contractor, partner, auditor | Policy and expiry |
| Role | country operator, engineer, security analyst | Baseline entitlement |
| Country | KE, GH, ZA | Production boundary |
| Programme | maternal health, screening, outreach | Application scope |
| Facility or region | clinic, county, district | Record assignment |
| Manager or sponsor | named owner | Approval and review |
| Start date | ISO date | Activation |
| End date | ISO date | Automatic expiry |
| Privileged eligibility | approved duty | Elevation eligibility |

Missing or ambiguous attributes must not be replaced by broad access.

## Joiner process

### Preconditions

A joiner must have:

- an approved employment, contract, partnership, or audit relationship;
- a named manager or sponsor;
- an assigned role;
- a country and programme assignment where relevant;
- a start date;
- an end date for non-employees;
- completed required policy or security acknowledgement;
- an approved device path for administrative access.

### Provisioning sequence

1. Create or activate the workforce identity from the authoritative identity source.
2. Enforce MFA enrollment before access to sensitive systems.
3. Add the user to baseline groups based on approved attributes.
4. Provision application identity and assignments.
5. Grant non-production access only when the role requires it.
6. Grant production eligibility separately and only when required.
7. Record the entitlement source and approval.
8. Validate that country, programme, and environment scope are correct.
9. Notify the manager or sponsor of access granted.

### Default-deny onboarding

A new identity receives no production, privileged, sensitive-data, billing, organization-policy, or security-administration role by default.

## Mover process

A mover is any person whose responsibilities, country, programme, facility, manager, worker type, or risk profile changes.

Mover events include:

- transfer between countries;
- transfer between programmes;
- promotion into or out of management;
- change from employee to contractor or vice versa;
- movement into engineering, security, finance, or operations;
- temporary incident assignment;
- loss of privileged duty;
- extended leave;
- disciplinary or security restriction.

### Recalculation rule

A mover event must recalculate access from the new authoritative attributes. New access must not simply be added on top of existing access.

The process must:

1. Identify entitlements that are no longer justified.
2. Remove obsolete memberships and roles.
3. Add approved new access.
4. preserve separation-of-duties constraints;
5. update application assignments;
6. update privileged eligibility;
7. verify country and environment boundaries;
8. record the effective date and approver.

### Country transfer

A country transfer requires explicit removal of prior-country production and application assignments before or at the same time as new-country access becomes effective.

Cross-country overlap is allowed only for an approved transition window with:

- named owner;
- business justification;
- expiry date;
- review of sensitive-data access;
- explicit acknowledgement that both country scopes are active.

## Leaver process

Leaver handling starts when employment, contract, partnership, or audit access ends, or when access must be suspended immediately.

### Immediate controls

For involuntary termination, suspected compromise, or severe policy violation:

1. Suspend the workforce identity.
2. Revoke active sessions and tokens where supported.
3. Remove privileged and production group memberships.
4. Disable application access.
5. Revoke external federation or partner trust.
6. invalidate temporary elevation;
7. rotate shared secrets the user could access where necessary;
8. preserve relevant audit evidence.

### Standard offboarding

For planned departures:

- schedule account suspension at the approved end time;
- remove all group memberships;
- remove direct IAM bindings;
- disable or delete application assignments according to retention policy;
- transfer ownership of repositories, dashboards, documents, alerts, and operational tasks;
- remove the person from approval chains and on-call schedules;
- revoke privileged eligibility;
- remove device and remote-access registration;
- confirm no service account, API credential, or automation is tied to the person's account;
- record completion evidence.

The workforce identity may be retained in a disabled state when required for audit attribution, but it must not remain usable.

## Contractors and partners

Contractor and partner access requires:

- a named internal sponsor;
- a defined purpose;
- a start and end date;
- minimum required country and environment scope;
- no standing privileged role unless separately approved;
- periodic review at a higher frequency than permanent employee access;
- automatic expiry where supported.

Contract extensions must be approved before expiry. Expired access must not be silently reactivated.

## Auditors

Auditor access should be:

- read-only by default;
- scoped to the evidence and period under review;
- separated from operational administration;
- time-bound;
- logged;
- removed at the end of the engagement.

Sensitive records should be minimized, masked, aggregated, or excluded unless the audit scope requires identifiable data.

## Temporary assignments

Temporary access must include:

- reason;
- source assignment;
- target role or scope;
- start time;
- expiry time;
- approver;
- review condition.

Temporary assignment examples include incident response, launch support, data migration, regional coverage, and leave substitution.

## Leave and inactivity

Extended leave or prolonged inactivity may trigger:

- suspension of privileged eligibility;
- removal from active production groups;
- session invalidation;
- revalidation before return;
- manager confirmation.

Dormant identities and groups should be detected through scheduled reporting.

## Workload identity lifecycle

Machine identities have lifecycle requirements comparable to human identities.

Each workload identity must have:

- a named service owner;
- environment and country scope;
- documented purpose;
- approved permissions;
- source repository or deployment system;
- creation record;
- rotation or federation design;
- decommission trigger.

A workload identity must be reviewed or removed when:

- the workload is retired;
- the repository is archived;
- the deployment path changes;
- the service moves country or environment;
- the owner leaves;
- permissions are unused;
- a trust condition becomes obsolete.

## Group lifecycle

Every access-granting group must have:

- a purpose;
- an owner;
- an approval authority;
- a defined scope;
- membership rules;
- review frequency;
- an expiry or decommission condition where applicable.

Empty, ownerless, duplicate, or unused groups must be reviewed and removed.

## Direct bindings

Direct user IAM bindings are exceptions. Each must include:

- exception owner;
- justification;
- resource scope;
- role;
- approval;
- creation date;
- expiry date;
- migration plan to a group or managed access mechanism.

Expired direct bindings must be removed automatically or detected as a control failure.

## Lifecycle timing targets

| Event | Target |
|---|---|
| Planned joiner activation | At approved start time, not before |
| Involuntary leaver suspension | Immediate upon authorized notice |
| Planned leaver suspension | At approved end time |
| Privileged-access removal after role change | Within 4 hours |
| Production country-scope change | By effective transfer time |
| Contractor expiry | Automatic at contract end |
| Compromised-account suspension | Immediate |
| Orphaned workload owner remediation | Within 5 business days |
| Stale direct binding remediation | Within 5 business days or sooner by severity |

These are architecture targets and become operational commitments only when implementation and measurement exist.

## Reconciliation

Scheduled reconciliation must compare:

- authoritative worker records;
- identity-provider accounts;
- group memberships;
- Google Cloud IAM policies;
- application roles and assignments;
- privileged-access eligibility;
- Workload Identity Federation principals;
- service-account ownership;
- external partner access.

Differences must be classified as expected delay, approved exception, configuration drift, or incident.

## Evidence

Lifecycle evidence includes:

- joiner, mover, or leaver event;
- authoritative attributes;
- request and approval;
- memberships and roles before and after;
- activation or suspension timestamp;
- session revocation evidence;
- application-assignment changes;
- exception and expiry data;
- reconciliation results;
- remediation ticket.

## Validation scenarios

1. A new Kenya operator receives only Kenya application and operational scope.
2. A country transfer removes prior-country access.
3. A contractor account expires automatically.
4. An involuntary leaver loses active access immediately.
5. A disabled account cannot authenticate or retain application access.
6. A role change removes obsolete privileged eligibility.
7. A direct IAM binding without expiry is detected.
8. An archived workload's service account and federation trust are removed.
9. An ownerless access group is identified.
10. Reconciliation identifies an application role not supported by workforce attributes.

## Related documents

- [`identity-domains.md`](./identity-domains.md)
- [`workforce-access.md`](./workforce-access.md)
- [`workload-identities.md`](./workload-identities.md)
- [`privileged-access.md`](./privileged-access.md)
- [`access-reviews.md`](./access-reviews.md)
- [`role-model.md`](./role-model.md)
