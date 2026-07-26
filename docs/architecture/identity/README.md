# Identity Architecture

## Purpose

This section defines the identity architecture for AfyaBridge Cloud Security. It establishes how human users, workloads, application users, CI/CD systems, external parties, and emergency operators authenticate, receive authorization, and are monitored across Google Cloud and the AfyaBridge application.

The design separates identity proofing, authentication, authorization, privilege elevation, lifecycle management, and auditability. No identity is trusted solely because it originates from an internal network or a managed device.

## Design goals

The identity architecture must:

1. Use unique, attributable identities for all human and machine access.
2. Prevent shared workforce and administrative accounts.
3. Assign workforce permissions through managed groups rather than direct user bindings.
4. Separate production, non-production, and sandbox access.
5. Enforce country-scoped access for country operators and administrators.
6. Use dedicated workload identities for each deployable service.
7. Eliminate long-lived credentials in CI/CD.
8. Minimize standing privilege and define controlled emergency access.
9. Keep application authorization independent from cloud IAM while preserving traceability between them.
10. Support rapid revocation, periodic access review, and complete audit trails.
11. Keep external access sponsored, scoped, monitored, and time-bound.
12. Detect identity misuse, policy drift, and control failure.

## Identity domains

| Domain | Examples | Primary control plane |
|---|---|---|
| Workforce | engineers, security staff, country operators, auditors | Cloud Identity or Google Workspace, Google Groups, Google Cloud IAM |
| Application users | CHWs, supervisors, facility workers, programme administrators | Application identity provider, session service, application authorization layer |
| Workloads | APIs, sync workers, background jobs, logging agents | Google Cloud service accounts and workload identity |
| CI/CD | GitHub Actions workflows and deployment jobs | GitHub OIDC, Workload Identity Federation, deployment service accounts |
| External parties | approved partners, contractors, support vendors, auditors, integrations | Federation, restricted accounts, external-access groups, workload-specific trust |
| Emergency access | break-glass operators | Isolated emergency identities, strong authentication, approval, monitoring |

## Core principles

- Authentication does not imply authorization.
- Human access is group-based and role-scoped.
- Machine identities are non-interactive and workload-specific.
- Production access is not inherited from development access.
- Country roles do not grant global access.
- Privilege elevation is temporary where practical.
- Direct user IAM grants are exceptional and time-bound.
- Service-account impersonation is preferred over service-account keys.
- All privileged activity must be attributable to a named identity.
- Identity changes are reviewed, logged, and reversible.
- External access requires a named sponsor and expiry.
- Monitoring covers successful, denied, and changed identity activity.

## Document index

| Document | Status | Purpose |
|---|---|---|
| [`identity-domains.md`](./identity-domains.md) | Designed | Identity classes, authorities, trust boundaries, and ownership |
| [`workforce-access.md`](./workforce-access.md) | Designed | Workforce authentication, group-based access, and environment separation |
| [`workload-identities.md`](./workload-identities.md) | Designed | Service accounts, impersonation, federation, and machine identity lifecycle |
| [`application-authorization.md`](./application-authorization.md) | Designed | Application roles, country and programme scope, and authorization enforcement |
| [`privileged-access.md`](./privileged-access.md) | Designed | Temporary elevation, approvals, and break-glass access |
| [`access-lifecycle.md`](./access-lifecycle.md) | Designed | Joiner, mover, leaver, revocation, and ownership processes |
| [`role-model.md`](./role-model.md) | Designed | Workforce, cloud, and application role definitions |
| [`access-reviews.md`](./access-reviews.md) | Designed | Review frequency, evidence, and remediation |
| [`identity-monitoring.md`](./identity-monitoring.md) | Designed | Authentication, IAM, service-account, application, and privilege detections |
| [`external-identities.md`](./external-identities.md) | Designed | Partner, contractor, auditor, vendor, and third-party workload access |

## Architecture decisions

| ADR | Decision |
|---|---|
| [`../../adr/ADR-004-group-based-workforce-access.md`](../../adr/ADR-004-group-based-workforce-access.md) | Workforce cloud access is assigned through managed groups |
| [`../../adr/ADR-005-workload-identity-model.md`](../../adr/ADR-005-workload-identity-model.md) | Workloads and CI/CD use dedicated identities and short-lived federation |
| [`../../adr/ADR-006-privileged-access-model.md`](../../adr/ADR-006-privileged-access-model.md) | Privileged access is temporary, independently approved, and monitored |

## Related diagrams

- [`../diagrams/identity-flow.md`](../diagrams/identity-flow.md)
- [`../diagrams/privileged-access-flow.md`](../diagrams/privileged-access-flow.md)

## Related architecture

- [`../landing-zone/environment-separation.md`](../landing-zone/environment-separation.md)
- [`../landing-zone/bootstrap-and-state.md`](../landing-zone/bootstrap-and-state.md)
- [`../landing-zone/logging-and-asset-inventory.md`](../landing-zone/logging-and-asset-inventory.md)
- [`../../security-objectives.md`](../../security-objectives.md)
- [`../../security-control-matrix.md`](../../security-control-matrix.md)
- [`../../threat-model/threat-register.md`](../../threat-model/threat-register.md)

## Implementation status

The v0.3 identity architecture is **Designed**. Authentication, authorization, group membership, IAM policy, federation, monitoring, review, elevation, and revocation controls are not considered implemented until configuration, tests, and evidence exist.
