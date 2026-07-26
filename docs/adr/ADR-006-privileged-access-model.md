# ADR-006: Privileged Access Model

## Status

Accepted

## Date

2026-07-26

## Context

AfyaBridge operates country-separated production environments and shared security, logging, networking, delivery, and bootstrap services. Engineers, security responders, platform operators, database administrators, and application administrators occasionally require elevated access.

Permanent privileged roles would increase the likelihood and impact of:

- compromised workforce accounts;
- accidental production changes;
- cross-country access;
- unauthorized IAM modification;
- misuse of service-account impersonation;
- disabled or bypassed logging;
- destructive data or backup operations;
- untraceable shared-account activity.

The identity architecture therefore requires a model that supports operational response without making elevated access the normal state.

## Decision

AfyaBridge will use a temporary, approval-based privileged-access model.

The preferred execution order is:

1. Approved automation using a narrowly scoped federated workload identity.
2. Time-bound membership in a privileged Google Group.
3. Time-bound impersonation of a task-specific service account.
4. Named break-glass access only when normal identity and elevation paths are unavailable or insufficient for an active emergency.

Standing direct user privilege is prohibited except as a documented, expiring exception.

## Decision details

### Eligibility and activation are separate

Eligibility to request a privileged role does not grant that role. Eligible users are maintained separately from active privileged membership.

### Access is scoped

Every elevation must specify:

- person;
- task;
- target resource;
- environment;
- country;
- role;
- start time;
- expiry;
- change, incident, or task reference.

### Approval is independent

A requester cannot be the sole approver of their own elevation. High-risk actions require two-person approval or an equivalent dual-control process.

### Credentials are short-lived

The model uses temporary group membership, federated credentials, or service-account impersonation. Downloadable service-account keys are not part of the privileged-access design.

### Production is country-scoped

Production privilege is granted separately for Kenya, Ghana, and South Africa. Cross-country privilege requires an explicit approved duty and review.

### Break-glass access is exceptional

Break-glass accounts are named, separately protected, monitored on every use, and subject to mandatory post-use review. They are not used for routine administration.

### Evidence is mandatory

The system must retain request, approval, grant, use, expiry, revocation, and validation evidence.

## Rationale

This model:

- reduces standing attack surface;
- supports least privilege;
- preserves named-user attribution;
- separates routine operations from emergency recovery;
- aligns privilege with country and environment boundaries;
- supports automated expiry;
- enables review of high-risk actions;
- avoids long-lived machine credentials;
- produces evidence for investigation and governance.

## Alternatives considered

### Permanent administrator groups

Rejected as the primary model because they create standing privilege and increase exposure when an account or device is compromised.

Permanent eligibility groups may exist, but they do not directly grant privileged resource access.

### Direct IAM grants to individual users

Rejected as the default because they are harder to govern, review, expire, and reconcile than managed group membership.

### Shared administrator accounts

Rejected because they weaken accountability, complicate MFA, and prevent reliable attribution.

### Service-account keys for administrators

Rejected because keys are long-lived, portable, difficult to attribute to one session, and vulnerable to leakage.

### Pipeline-only administration

Preferred for repeatable changes but insufficient as the only mechanism because incident response, diagnosis, and recovery may require controlled human access.

### Unrestricted organization-wide emergency admin

Rejected because emergency access should still be minimized and observable. Some recovery permissions may need broad scope, but they must be assigned only to dedicated break-glass identities.

## Consequences

### Positive

- Reduced standing privilege
- Stronger country and environment isolation
- Better attribution
- Automatic expiry
- Improved reviewability
- Safer service-account use
- Clear emergency path
- Better audit and incident evidence

### Negative

- Additional operational steps before privileged work
- Dependence on access-governance and group-management capabilities
- Need for reliable approval and expiry automation
- Risk of delayed response when the process is poorly designed
- Need to test break-glass access without normalizing its use
- Greater complexity in role and group design

## Security requirements

The implementation must provide:

- strong MFA for privileged users;
- named identities;
- separate eligibility and active access;
- independent approval;
- time-bound elevation;
- country and environment scope;
- no service-account keys;
- centralized logging;
- alerts for break-glass use and unexpected grants;
- automatic or verified revocation;
- periodic access review;
- separation-of-duties checks;
- post-use review for emergency and high-risk access.

## Implementation status

**Designed**

This ADR does not claim that temporary group membership, approval automation, break-glass accounts, or privileged-session monitoring have been implemented.

## Validation criteria

The decision is validated when evidence demonstrates that:

1. An eligible user can request and receive approved temporary privilege.
2. The requester cannot self-approve.
3. Privilege is scoped to the approved environment and country.
4. Privilege expires automatically or is verifiably revoked.
5. Direct permanent user bindings are detected.
6. Service-account keys are blocked or alerted.
7. Service-account impersonation is attributable.
8. Break-glass authentication creates an immediate alert.
9. High-risk actions retain dual-control and outcome evidence.
10. Access reviews identify stale or unused eligibility.

## Related documents

- [`../architecture/identity/privileged-access.md`](../architecture/identity/privileged-access.md)
- [`../architecture/identity/access-lifecycle.md`](../architecture/identity/access-lifecycle.md)
- [`../architecture/identity/access-reviews.md`](../architecture/identity/access-reviews.md)
- [`../architecture/identity/workload-identities.md`](../architecture/identity/workload-identities.md)
- [`../architecture/diagrams/privileged-access-flow.md`](../architecture/diagrams/privileged-access-flow.md)
- [`ADR-004-group-based-workforce-access.md`](./ADR-004-group-based-workforce-access.md)
- [`ADR-005-workload-identity-model.md`](./ADR-005-workload-identity-model.md)
