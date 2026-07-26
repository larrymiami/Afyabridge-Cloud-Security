# ADR-004: Group-Based Workforce Access

- Status: Accepted
- Date: 2026-07-25
- Decision owners: Platform Engineering and Security
- Related objectives: `IAM-01`, `IAM-06`, `IAM-07`, `GOV-03`
- Related threats: `TH-001`, `TH-002`, `TH-003`, `TH-017`

## Context

AfyaBridge requires human access across shared services, non-production environments, and country-specific production environments. Directly assigning Google Cloud IAM roles to individual users would make access difficult to review, revoke, reproduce, and govern consistently.

The operating model also requires clear separation between production and non-production, country-scoped administration, temporary external access, and rapid revocation when employment or assignments change.

## Decision

Workforce access to Google Cloud is assigned primarily through managed Google Groups.

Groups represent stable functions and scopes rather than individual projects or personal naming conventions. Membership is the authoritative mechanism for routine workforce grants.

Example pattern:

```text
gcp-<environment>-<country-or-shared>-<function>@<domain>
```

Examples:

```text
gcp-prd-ke-operators@<domain>
gcp-prd-gh-security-reviewers@<domain>
gcp-prd-za-deploy-approvers@<domain>
gcp-nonprd-shared-operators@<domain>
gcp-common-logging-admins@<domain>
```

Direct user IAM bindings are exceptions. They must be documented, time-bound, reviewed, and removed when the exception expires.

Production and non-production use separate groups. Production country groups are separate for Kenya, Ghana, and South Africa. Membership in one production country group does not imply membership in another.

## Rationale

Group-based access provides:

- consistent onboarding and offboarding;
- simpler access reviews;
- reduced configuration drift;
- separation of role definitions from individual identities;
- clearer country and environment boundaries;
- auditable membership changes;
- a stable target for infrastructure-as-code IAM bindings.

## Alternatives considered

### Direct IAM bindings for each user

Rejected because they create fragmented access state, increase offboarding risk, and are harder to review at scale.

### Broad organization-level groups

Rejected as the default because broad groups weaken country and environment isolation. Organization-wide groups remain limited to functions that genuinely require organization-wide visibility.

### Application roles as the source for cloud access

Rejected because application authorization and Google Cloud infrastructure authorization protect different resources and have different lifecycle and audit requirements.

### Individual privileged accounts with standing access

Rejected for routine administration because standing individual privilege increases compromise impact and complicates separation of duties.

## Consequences

### Positive

- IAM bindings become stable and version-controlled.
- User lifecycle changes are handled through membership changes.
- Reviewers can inspect access by group and scope.
- Country and environment separation is explicit.
- Temporary contractor or auditor access can use dedicated groups with expiry controls.

### Negative

- Group ownership and membership management become security-critical.
- Nested groups may make effective access harder to understand.
- Delays in directory synchronization may delay grants or revocations.
- Emergency access requires a separate controlled path.

## Constraints

- Shared or generic user accounts are prohibited.
- Group ownership must not rely on a single person.
- Privileged groups require stronger review and monitoring.
- Nested privileged groups are avoided unless effective membership can be reliably inspected.
- Group membership alone does not authorize access to application health records.
- Direct user bindings require an exception record and expiry.

## Validation

The decision is validated when:

- routine workforce IAM bindings target approved groups rather than users;
- production groups are distinct by country;
- non-production group membership does not grant production access;
- terminated users lose effective access through membership removal;
- direct bindings are detected and reconciled against the exception register;
- privileged membership changes generate auditable events.

## Review triggers

Review this decision when:

- the identity provider changes;
- just-in-time privileged-access tooling is introduced;
- Google Cloud workforce federation replaces managed domain identities;
- group scale or nesting makes effective-access review unreliable;
- a material incident identifies group governance as a control weakness.
