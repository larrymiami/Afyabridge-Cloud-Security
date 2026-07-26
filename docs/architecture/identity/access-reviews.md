# Access Reviews

## Purpose

This document defines periodic and event-driven certification of AfyaBridge workforce access, Google Cloud IAM, application entitlements, privileged eligibility, workload identities, and external access.

Access reviews verify that every entitlement remains necessary, correctly scoped, owned, and supported by current responsibilities.

## Principles

1. Review access according to risk, not on one universal schedule.
2. Reviewers must understand the role and resource being certified.
3. Privileged, production, and sensitive-data access require more frequent review.
4. Review evidence must identify what was reviewed, by whom, when, and with what outcome.
5. Review completion without meaningful decisions is not sufficient.
6. Unclear or unsupported access is removed or suspended pending clarification.
7. Exceptions require owners, expiry, and compensating controls.
8. Access reviews complement, but do not replace, automated lifecycle controls.

## Review scope

The review programme includes:

- workforce accounts;
- Google Group membership;
- organization, folder, project, and resource IAM;
- application roles;
- country, programme, facility, and record assignments;
- privileged-access eligibility and active elevation;
- direct user bindings;
- service accounts;
- Workload Identity Federation principals and conditions;
- CI/CD deployment identities;
- break-glass accounts;
- contractors, partners, and auditors;
- access-granting groups and their owners;
- approval and separation-of-duties roles.

## Review frequency

| Access class | Minimum design frequency |
|---|---|
| Organization, IAM, policy, billing, security, and network administration | Monthly |
| Break-glass accounts and recovery material ownership | Monthly |
| Production privileged eligibility | Monthly |
| Production operator and sensitive-data access | Quarterly |
| Direct user IAM bindings | Monthly |
| Contractor, partner, and auditor access | Monthly or at engagement milestone |
| Application country and programme assignments | Quarterly |
| Non-production engineering access | Semi-annually |
| Service accounts and workload federation | Quarterly |
| Access-granting groups and group ownership | Quarterly |
| Sandbox access | At expiry and at least quarterly |

These frequencies are initial architecture targets. Higher-risk findings or incidents may require more frequent review.

## Review ownership

| Entitlement | Primary reviewer | Independent oversight |
|---|---|---|
| Workforce baseline access | Line manager or sponsor | Identity administrator |
| Country production access | Country service owner | Platform or security owner |
| Application clinical or programme role | Programme or data owner | Application security owner |
| Organization and shared-services administration | Platform or security owner | Independent senior approver |
| Security monitoring access | Security lead | Governance or audit representative |
| Billing access | Finance owner | Platform owner |
| Workload identity | Service owner | Platform or security engineering |
| CI/CD deployment identity | Delivery owner | Security engineering |
| Break-glass account | Security and platform owners | Governance or audit representative |
| Contractor or partner access | Internal sponsor | Identity or security owner |

A person must not be the only reviewer of their own privileged access.

## Review inputs

Each review should include:

- identity or principal;
- identity type;
- current status;
- manager, sponsor, or service owner;
- country and programme assignments;
- group memberships;
- cloud IAM roles and resource scopes;
- application roles and assignments;
- privileged eligibility;
- last authentication or use where available;
- grant date and source request;
- expiry date;
- exception status;
- relevant separation-of-duties conflicts;
- prior review outcome;
- recent security findings or incidents.

## Review decisions

Permitted decisions are:

- **Certify** — access remains necessary and correctly scoped.
- **Reduce** — access is still required but must be narrowed.
- **Reassign** — ownership, country, programme, group, or role must change.
- **Remove** — access is no longer justified.
- **Suspend** — access is temporarily disabled pending investigation or clarification.
- **Exception** — access remains temporarily under an approved exception with expiry.

“Reviewed” without one of these outcomes is not a valid decision.

## Review procedure

1. Generate the authoritative review population.
2. Reconcile identities, groups, cloud IAM, and application entitlements.
3. Assign each item to a responsible reviewer.
4. Present entitlement context and recent use information.
5. Record a decision and rationale.
6. Route reductions, removals, suspensions, or corrections for execution.
7. Verify that remediation completed.
8. Escalate overdue reviews and unresolved findings.
9. Retain the review evidence.
10. Report coverage, outcomes, overdue items, and recurring control failures.

## Privileged-access review

Privileged reviews must verify:

- named eligibility owner;
- business duty requiring elevation;
- country and environment scope;
- last elevation event;
- duration and approval quality;
- whether direct privilege exists outside the approved model;
- separation of requester and approver;
- anomalous or unused privilege;
- timely expiry and revocation;
- evidence for break-glass or high-risk actions.

Unused privileged eligibility should be removed unless a documented operational duty justifies retention.

## Workload-identity review

For each service account or federated workload principal, reviewers must verify:

- active workload and repository;
- service owner;
- environment and country;
- purpose;
- assigned roles;
- resource scope;
- last observed use where available;
- federation issuer, subject, audience, repository, branch, or environment conditions;
- key status;
- ability to impersonate other service accounts;
- decommission condition.

Unknown, ownerless, unused, or overprivileged identities must be disabled or remediated.

## Application-access review

Application reviews must verify both role and data scope.

Examples:

- a CHW role is limited to assigned programme and geography;
- a clinician can view only records permitted by assignment and care relationship;
- a country administrator does not automatically receive another country's data;
- support personnel do not retain clinical-data access after a support case closes;
- an auditor receives only approved evidence scope;
- a suspended workforce identity does not remain active in the application.

## Direct-binding review

Direct user bindings receive explicit scrutiny because they bypass the normal group model.

For each direct binding, verify:

- current justification;
- owner;
- approver;
- resource and role scope;
- creation date;
- expiry;
- evidence of recent need;
- migration plan to a managed group or temporary elevation mechanism.

Bindings without valid evidence or expiry must be removed.

## Break-glass review

The review must confirm:

- emergency accounts remain separate from routine identities;
- MFA and recovery methods remain usable;
- recovery material custody is current;
- every authentication generated an alert;
- every use has an incident reference and post-use review;
- no routine activity occurred;
- credentials or factors were reset when required;
- account permissions remain minimal for emergency recovery.

## Event-driven reviews

An immediate review may be triggered by:

- country or programme transfer;
- change in employment or contract status;
- security incident;
- suspicious authentication;
- privileged-access misuse;
- material architecture change;
- merger or new partner integration;
- discovery of public exposure or IAM drift;
- service-owner departure;
- policy exception expiry;
- audit finding.

## Overdue reviews

Overdue high-risk reviews must result in escalation and may result in suspension.

Suggested escalation order:

1. Reviewer reminder.
2. Manager or service-owner escalation.
3. Security or governance escalation.
4. Suspension of unverified high-risk access.
5. Incident creation if the access presents immediate risk.

## Metrics

Useful metrics include:

- review population coverage;
- completion rate;
- overdue rate;
- percentage certified, reduced, removed, suspended, or excepted;
- remediation completion time;
- privileged access removed;
- stale direct bindings discovered;
- ownerless service accounts discovered;
- cross-country assignment conflicts;
- contractor access past end date;
- recurring findings by team or system;
- accounts with no recent use but active entitlement.

Metrics should distinguish review completion from remediation completion.

## Evidence retention

Review evidence should contain:

- review name and period;
- scope and source population;
- extraction timestamp;
- reviewer assignments;
- entitlement details presented;
- reviewer decisions and rationale;
- exceptions;
- remediation records;
- completion verification;
- escalations;
- summary metrics.

Sensitive review exports must be protected and retained only for the approved period.

## Validation scenarios

1. A quarterly review detects a former programme assignment.
2. A monthly privileged review removes unused production eligibility.
3. An ownerless service account is detected and disabled.
4. A contractor account past its end date is removed.
5. A direct binding without expiry is escalated.
6. A reviewer cannot self-certify sole administrative access.
7. A removal decision creates and completes remediation.
8. A break-glass event appears in the next review with incident evidence.
9. Cross-country application scope is identified.
10. Review metrics distinguish decision completion from actual removal.

## Related documents

- [`access-lifecycle.md`](./access-lifecycle.md)
- [`privileged-access.md`](./privileged-access.md)
- [`role-model.md`](./role-model.md)
- [`workforce-access.md`](./workforce-access.md)
- [`workload-identities.md`](./workload-identities.md)
- [`application-authorization.md`](./application-authorization.md)
