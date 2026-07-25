# Google Cloud Landing Zone

## Purpose

This section defines the Google Cloud foundation for AfyaBridge Cloud Security. The landing zone establishes the resource hierarchy, environment boundaries, shared services, governance controls, deployment identities, state management, and cost controls required by later phases.

The design supports:

- multiple countries;
- separate production and non-production environments;
- centralised security and logging;
- shared networking and delivery services;
- repeatable project creation;
- controlled infrastructure changes;
- least-privilege access;
- traceable ownership and cost allocation;
- safe teardown of temporary lab resources.

## Design goals

The landing zone must:

1. Separate production from non-production.
2. Separate country production environments.
3. Place shared security capabilities outside country workload folders.
4. Prevent development identities and pipelines from modifying production.
5. Support policy inheritance from organisation and folder levels.
6. Provide a repeatable path for onboarding additional countries.
7. Centralise audit, security, and asset visibility without creating unrestricted data access.
8. Keep Terraform state, deployment identities, and bootstrap resources isolated from workload projects.
9. Make resource ownership, environment, country, data classification, and cost visible through metadata.
10. Allow unavailable organisation-level controls to be represented as code and documented as designed rather than implemented.

## Landing-zone components

| Component | Responsibility |
|---|---|
| Organisation | Root policy, billing, domain, and security boundary |
| Bootstrap | Terraform state, deployment identities, and project-factory prerequisites |
| Common services | Security, logging, networking, CI/CD, DNS, and artifact services |
| Production | Country-specific production folders and projects |
| Non-production | Shared development and staging environments |
| Sandbox | Short-lived experiments with restricted permissions and expiry controls |

## Document index

| Document | Status | Purpose |
|---|---|---|
| [`resource-hierarchy.md`](./resource-hierarchy.md) | Designed | Folder and project structure, inheritance, and ownership boundaries |
| `project-factory.md` | Planned | Repeatable project creation and baseline configuration |
| `environment-separation.md` | Planned | Production, staging, development, and sandbox controls |
| `shared-services.md` | Planned | Central security, logging, networking, and delivery services |
| `region-strategy.md` | Planned | Approved regions, recovery regions, and global-service exceptions |
| `naming-and-labeling.md` | Planned | Project IDs, names, labels, tags, and metadata rules |
| `billing-and-cost-controls.md` | Planned | Billing accounts, budgets, alerts, quotas, and cleanup rules |
| `bootstrap-and-state.md` | Planned | Terraform state, bootstrap identities, federation, and recovery |

## Related architecture

- [`../diagrams/landing-zone.md`](../diagrams/landing-zone.md)
- [`../diagrams/system-context.md`](../diagrams/system-context.md)
- [`../../security-objectives.md`](../../security-objectives.md)
- [`../../security-control-matrix.md`](../../security-control-matrix.md)
- [`../../threat-model/trust-boundaries.md`](../../threat-model/trust-boundaries.md)

## Initial implementation status

The v0.2 landing zone begins in the **Designed** state. A control moves to another status only when the repository contains the required code, validation output, and evidence.

| Status | Meaning |
|---|---|
| Designed | Architecture and control intent are documented |
| Code complete | Configuration exists and has been validated without deployment |
| Implemented | Resources or controls have been deployed and verified |
| Simulated | Behaviour has been exercised in a controlled test |
| Enterprise extension | Relevant capability requires privileges or services outside the available environment |

## Decision summary

The initial model uses:

- country folders for production isolation;
- separate workload projects for application, data, and operations concerns;
- shared development and staging environments initially;
- separate common projects for security, logging, networking, and CI/CD;
- a dedicated bootstrap project for Terraform state and deployment prerequisites;
- explicit project metadata and inherited policy at organisation and folder levels;
- no direct developer access to production infrastructure.

Detailed rationale is documented in [`resource-hierarchy.md`](./resource-hierarchy.md).
