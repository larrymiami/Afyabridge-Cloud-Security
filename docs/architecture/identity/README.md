# Identity Architecture

## Purpose

This section defines the identity architecture for AfyaBridge Cloud Security. It establishes how human users, workloads, application users, CI/CD systems, and emergency operators authenticate, receive authorization, and are monitored across Google Cloud and the AfyaBridge application.

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

## Identity domains

| Domain | Examples | Primary control plane |
|---|---|---|
| Workforce | engineers, security staff, country operators, auditors | Cloud Identity or Google Workspace, Google Groups, Google Cloud IAM |
| Application users | CHWs, supervisors, facility workers, programme administrators | Application identity provider, session service, application authorization layer |
| Workloads | APIs, sync workers, background jobs, logging agents | Google Cloud service accounts and workload identity |
| CI/CD | GitHub Actions workflows and deployment jobs | GitHub OIDC, Workload Identity Federation, deployment service accounts |
| External parties | approved support vendors, auditors, notification or referral integrations | Federation, restricted accounts, service-specific credentials |
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

## Document index

| Document | Status | Purpose |
|---|---|---|
| [`identity-domains.md`](./identity-domains.md) | Designed | Identity classes, authorities, trust boundaries, and ownership |
| [`workforce-access.md`](./workforce-access.md) | Designed | Workforce authentication, group-based access, and environment separation |
| `workload-identities.md` | Planned | Service accounts, impersonation, federation, and machine identity lifecycle |
| `application-authorization.md` | Planned | Application roles, country and programme scope, and authorization enforcement |
| `privileged-access.md` | Planned | Temporary elevation, approvals, and break-glass access |
| `access-lifecycle.md` | Planned | Joiner, mover, leaver, revocation, and ownership processes |
| `role-model.md` | Planned | Workforce, cloud, and application role definitions |
| `access-reviews.md` | Planned | Review frequency, evidence, and remediation |
| `identity-monitoring.md` | Planned | Authentication, IAM, service-account, and privilege detections |

## Related architecture

- [`../diagrams/identity-flow.md`](../diagrams/identity-flow.md)
- [`../landing-zone/environment-separation.md`](../landing-zone/environment-separation.md)
- [`../landing-zone/bootstrap-and-state.md`](../landing-zone/bootstrap-and-state.md)
- [`../../security-objectives.md`](../../security-objectives.md)
- [`../../security-control-matrix.md`](../../security-control-matrix.md)
- [`../../threat-model/threat-register.md`](../../threat-model/threat-register.md)

## Initial status

The v0.3 identity architecture begins in the **Designed** state. Authentication, authorization, group membership, IAM policy, federation, and revocation controls are not considered implemented until configuration, tests, and evidence exist.