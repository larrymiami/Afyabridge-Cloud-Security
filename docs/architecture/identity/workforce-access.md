# Workforce Access

## Purpose

This document defines how employees, contractors, auditors, and approved support personnel authenticate and receive access to AfyaBridge Google Cloud resources, source control, and operational tooling.

Workforce access is designed around unique identities, managed groups, strong authentication, environment separation, country scoping, and minimal standing privilege.

## Workforce identity source

Cloud Identity or Google Workspace is the authoritative workforce directory for Google Cloud access. Each person must use a unique organizational identity. Personal accounts and shared team accounts are not permitted for routine access.

The directory record should include an immutable identifier, status, manager or sponsor, organizational unit, country assignment, and role-relevant attributes.

## Authentication baseline

All workforce identities must use:

- MFA;
- organization-managed recovery methods;
- session controls appropriate to the sensitivity of the target environment;
- reauthentication for sensitive administrative actions where supported;
- prompt session revocation when an account is disabled or suspected compromised.

Phishing-resistant authentication is preferred for privileged and production-capable users. The implementation phase must record which authentication factors are available in the selected directory edition and which controls are enterprise extensions.

## Group-based authorization

Google Cloud IAM roles are assigned to managed groups rather than individual users wherever practical.

Example group pattern:

```text
gcp-<environment>-<country-or-shared>-<function>@<domain>
```

Examples:

```text
gcp-nonprd-shared-developers@afyabridge.example
gcp-prd-ke-operators@afyabridge.example
gcp-prd-gh-viewers@afyabridge.example
gcp-common-security-analysts@afyabridge.example
gcp-bootstrap-state-admins@afyabridge.example
```

Group names describe scope and function. They do not imply a specific Google Cloud role; role bindings remain explicitly managed in infrastructure code.

## Group classes

| Group class | Purpose | Typical scope |
|---|---|---|
| Viewer | Read approved metadata, configuration, or monitoring data | project, country folder, or shared service |
| Operator | Perform documented operational actions without changing IAM or foundational infrastructure | selected workload projects |
| Deployer | Execute approved deployment actions through controlled automation | environment-specific projects |
| Security analyst | Investigate logs, findings, and alerts | central security and logging services |
| Auditor | Read evidence and approved audit data | central evidence or logging views |
| Platform administrator | Manage a narrow infrastructure domain | shared networking, bootstrap, or project factory |
| Privileged eligible | Eligible to request temporary elevation | explicitly approved production domains |

## Environment separation

Production and non-production memberships are separate.

A user who belongs to a development group does not automatically receive staging or production access. Production access requires a distinct business need, approval, and group membership.

Minimum rules:

- non-production developer groups cannot modify production resources;
- production groups are separate by function and, where applicable, by country;
- production deployers use CI/CD rather than interactive infrastructure changes;
- sandbox access does not imply access to development, staging, or production;
- bootstrap and organization-level access are isolated from workload-administration roles.

## Country-scoped access

Country operators and administrators are assigned to country-specific groups. Their IAM roles are bound at the relevant country folder or project, not at the production parent unless a global role is explicitly required.

Examples:

- Kenya operators receive access only to Kenya operations resources;
- Ghana viewers cannot read South Africa project metadata or logs unless an approved central role requires it;
- country application administrators do not receive Google Cloud administration solely because of their application role;
- global security and platform roles are narrowly defined, monitored, and reviewed more frequently.

## Direct user bindings

Direct IAM bindings to individual users are prohibited for routine access.

A direct binding may be used only when:

- a service limitation prevents group use;
- the access is temporary and time-bound;
- an owner and reason are recorded;
- the binding has an expiry or removal date;
- the exception is reviewed and visible in the access register.

Direct bindings discovered outside the exception process are treated as identity drift.

## Contractors and temporary staff

Contractor access requires:

- a named internal sponsor;
- contract or engagement end date;
- restricted group membership;
- no default production access;
- automatic or scheduled expiry where available;
- review before extension;
- immediate removal when the engagement ends.

External email identities should not be granted direct access when a managed organizational identity can be issued.

## Auditor access

Auditors receive read-only access to the minimum evidence required for the review. Audit access should use curated log views, reports, and evidence repositories rather than broad access to production data.

Audit memberships must have:

- defined scope;
- start and end dates;
- a sponsor;
- data-handling expectations;
- recorded removal after the review.

## Source-control access

GitHub access follows the same unique-identity and least-privilege principles.

- repository administration is limited;
- workflow modifications require review;
- protected branches and production environments restrict unreviewed changes;
- production approvals should not rely solely on the author of the deployment change;
- inactive collaborators are removed;
- third-party GitHub Apps and integrations are reviewed for required permissions.

## Access-request workflow

A workforce access request must record:

1. Requester and target user.
2. Business reason.
3. Requested group or role scope.
4. Environment and country.
5. Duration or expiry where applicable.
6. Manager, system-owner, or data-owner approval.
7. Security approval for privileged or cross-country access.
8. Provisioning evidence.

Access must not be provisioned from an unstructured request that cannot be reviewed later.

## Revocation

Access is revoked when:

- employment or contract ends;
- role or country assignment changes;
- the business need ends;
- the account is suspected compromised;
- a temporary approval expires;
- an access review identifies excess privilege.

Disabling the authoritative workforce identity should terminate or invalidate downstream access as quickly as supported. High-risk revocation procedures must include active-session review and emergency group removal.

## Access review

At minimum:

- privileged and production-capable groups are reviewed quarterly;
- contractor and temporary memberships are reviewed monthly or against expiry;
- standard non-production groups are reviewed at least twice per year;
- direct user bindings are reviewed continuously or through scheduled drift checks;
- group owners confirm purpose, membership, and continued need.

Review evidence includes the membership snapshot, owner decision, removals, exceptions, and completion date.

## Monitoring requirements

Security-relevant events include:

- successful and failed workforce authentication;
- MFA or recovery-method changes;
- group membership changes;
- direct IAM bindings;
- privileged-role grants;
- access from unusual locations or devices where signals are available;
- repeated authorization failures;
- disabled-account activity;
- production access outside approved processes.

## Validation plan

The implementation must demonstrate that:

- a development-only user cannot modify production;
- a Kenya operator cannot access Ghana or South Africa resources;
- removing a user from a group removes the corresponding access;
- a direct user grant is detected or rejected;
- a disabled workforce identity cannot continue normal access;
- privileged group changes produce audit events;
- temporary access expires or is removed on schedule.

## Threat and objective mapping

This design addresses `TH-001`, `TH-002`, `TH-003`, `TH-004`, and `TH-017`.

Primary objectives are `IAM-03`, `IAM-04`, `IAM-05`, `IAM-06`, `IAM-07`, `GOV-02`, `GOV-03`, `CSPM-02`, `MON-01`, and `MON-02`.