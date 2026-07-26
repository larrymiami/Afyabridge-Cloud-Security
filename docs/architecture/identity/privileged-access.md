# Privileged Access

## Purpose

This document defines how AfyaBridge grants, uses, monitors, and revokes elevated access to Google Cloud, delivery systems, shared services, production applications, and sensitive operational functions.

Privileged access is exceptional. It is not the default operating mode for engineers, administrators, support personnel, or country teams.

## Design principles

1. Standing privilege is minimized.
2. Elevated access is time-bound and purpose-bound.
3. Production elevation is separate from non-production elevation.
4. Country production access is scoped to one country unless an approved cross-country duty exists.
5. Requesters cannot approve their own elevation.
6. High-risk actions require stronger approval or dual control.
7. Every privileged session must be attributable to one named person.
8. Break-glass access is reserved for emergencies and is reviewed after every use.
9. Privileged access must not depend on downloadable service-account keys.
10. Elevation, use, expiry, and revocation must produce evidence.

## Privileged access categories

| Category | Examples | Default access model |
|---|---|---|
| Cloud platform administration | IAM, organization policy, folders, billing, networking | Time-bound group membership or approved impersonation |
| Production operations | Cloud Run configuration, deployment rollback, scaling, diagnostics | Country-scoped temporary elevation |
| Security operations | Log investigation, Security Command Center findings, containment | Security group with controlled elevated roles |
| Data administration | Database recovery, schema migration, backup restore | Dedicated task identity with approval and limited duration |
| Delivery administration | Deployment pipeline, artifact promotion, release approval | Federated CI/CD identity; human override only by exception |
| Application administration | User suspension, assignment correction, emergency support | Application role elevation with country and programme scope |
| Break-glass | Identity outage, federation failure, severe incident | Emergency account with offline recovery controls |

## Normal operating model

Privileged tasks should be performed through one of the following mechanisms, in order of preference:

1. Automated pipeline using a narrowly scoped workload identity.
2. Temporary membership in a privileged Google Group.
3. Temporary service-account impersonation for a specific operational task.
4. Emergency break-glass access when normal identity systems are unavailable or too slow for the incident.

Permanent direct user bindings are prohibited except where a documented platform limitation requires them.

## Privileged groups

Example group classes:

```text
cloud-org-admins-eligible@afyabridge.example
cloud-security-admins-eligible@afyabridge.example
cloud-network-admins-eligible@afyabridge.example
cloud-billing-admins-eligible@afyabridge.example
prod-ke-operators-eligible@afyabridge.example
prod-gh-operators-eligible@afyabridge.example
prod-za-operators-eligible@afyabridge.example
prod-data-recovery-eligible@afyabridge.example
```

Eligibility groups identify people permitted to request elevation. They do not themselves grant privileged resource access.

Active privileged groups are separate and have automatically expiring membership:

```text
cloud-security-admins-active@afyabridge.example
prod-ke-operators-active@afyabridge.example
```

## Elevation request

A privileged-access request must include:

- requester identity;
- requested role or privileged group;
- target environment and country;
- resource or service scope;
- business or incident justification;
- ticket, change, incident, or problem reference;
- requested start time;
- requested duration;
- planned actions;
- rollback or exit condition;
- approver identity.

Requests missing a scope, expiry, or traceable reason must be rejected.

## Approval rules

| Access type | Minimum approval |
|---|---|
| Non-production administrative access | Service owner or engineering lead |
| Country production operations | Country service owner and platform owner |
| IAM, organization policy, or shared network changes | Security or platform owner plus change approval |
| Sensitive-data recovery or export | Data owner plus security approval |
| Destructive production change | Two-person approval and documented rollback |
| Break-glass activation | Incident commander when available; otherwise immediate retrospective review |

The requester must not be the sole approver.

## Duration limits

Default maximum durations:

| Activity | Maximum default duration |
|---|---:|
| Routine production diagnosis | 2 hours |
| Planned production change | 4 hours |
| Security investigation | 8 hours |
| Database recovery or migration | Change window plus 1 hour |
| Multi-day incident response | 24 hours, renewable with review |
| Break-glass activation | 1 hour, renewable only during an active incident |

Longer durations require explicit justification and additional approval.

## Production session controls

Privileged production access requires:

- strong MFA;
- a managed or otherwise approved administrative device;
- a recent authenticated session;
- no shared browser or operating-system profile;
- use of the approved account and not a personal account;
- country and environment scope matching the request;
- active logging for IAM, Admin Activity, Data Access where required, and application administration;
- no local storage of production credentials or exported sensitive data.

## Service-account impersonation

Human users may impersonate a privileged service account only when:

- the task cannot be completed by the normal pipeline;
- the impersonation target is dedicated to that task class;
- the user receives only token-creation or impersonation permission, not ownership of the service account;
- the session is time-bound;
- the target account has no downloadable key;
- the impersonation event and downstream actions are logged;
- the request references the approved change or incident.

A single administrative service account must not be reused for unrelated duties.

## High-risk operations

The following actions require enhanced controls:

- modifying organization policies;
- changing privileged IAM bindings;
- disabling logging or security monitoring;
- creating or uploading service-account keys;
- modifying Workload Identity Federation trust conditions;
- changing Terraform state access;
- deleting backups or audit logs;
- exporting sensitive health information;
- changing encryption-key policy or destroying key versions;
- disabling country-isolation controls;
- performing production database restores;
- deleting production projects.

Enhanced controls include two-person approval, explicit command or change-plan review, and post-change validation.

## Break-glass access

Break-glass accounts exist only for severe conditions such as:

- workforce identity provider outage;
- Google Group or access-governance failure;
- federation failure blocking urgent response;
- widespread compromise requiring immediate containment;
- loss of normal privileged identity paths.

Break-glass requirements:

- separate named emergency accounts;
- phishing-resistant MFA where available;
- recovery material stored using an approved offline process;
- no routine use;
- alert on every authentication and privileged action;
- credentials or recovery factors tested on a controlled schedule;
- activation linked to an incident record;
- access reduced or disabled immediately after the incident;
- mandatory post-use review.

Break-glass accounts must not be shared anonymously. If organizational constraints require shared recovery material, the activation process must still identify the individuals retrieving and using it.

## Revocation and expiry

Elevation must end through automatic expiry whenever the platform supports it. Manual revocation is required when:

- the task finishes early;
- the incident is contained;
- the change is cancelled;
- the user changes role;
- suspicious activity is detected;
- the approved scope is exceeded;
- the device or account is suspected compromised.

Revocation must remove active group membership, impersonation eligibility, temporary application roles, and any session or token that can be invalidated.

## Monitoring and alerts

Alert-worthy events include:

- break-glass authentication;
- privileged group membership addition outside the approved workflow;
- direct user role binding at project, folder, or organization scope;
- privilege granted without expiry;
- service-account key creation or upload;
- privileged service-account impersonation;
- denied privileged action followed by a successful elevation;
- access to a country outside the operator's assignment;
- IAM policy change by an unexpected principal;
- privilege remaining active after the request expiry;
- logging, policy, or security control disablement.

## Evidence

Each privileged-access event should produce:

- request record;
- approval record;
- identity and scope granted;
- start and expiry times;
- group membership or IAM change evidence;
- relevant audit logs;
- change, incident, or task outcome;
- revocation evidence;
- post-use review for break-glass or high-risk access.

## Validation

The design must be tested through positive and negative scenarios:

1. An eligible operator can obtain approved country-scoped access.
2. A requester cannot approve their own request.
3. Elevation expires automatically.
4. A Kenya operator cannot use Ghana production privileges.
5. A direct privileged user binding is detected.
6. A service-account key creation attempt is blocked or alerted.
7. Break-glass authentication generates an immediate alert.
8. Privilege is revoked when the incident or change closes.
9. Expired group membership no longer authorizes access.
10. High-risk changes retain approval and validation evidence.

## Related documents

- [`workforce-access.md`](./workforce-access.md)
- [`workload-identities.md`](./workload-identities.md)
- [`access-lifecycle.md`](./access-lifecycle.md)
- [`access-reviews.md`](./access-reviews.md)
- [`role-model.md`](./role-model.md)
- [`../diagrams/privileged-access-flow.md`](../diagrams/privileged-access-flow.md)
- [`../../adr/ADR-006-privileged-access-model.md`](../../adr/ADR-006-privileged-access-model.md)
