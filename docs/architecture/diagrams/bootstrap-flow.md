# Terraform Bootstrap Flow

## Purpose

This diagram shows how the current bootstrap root establishes the remote Terraform backend and execution identity, and how the intended GitHub Workload Identity Federation and later project-factory paths attach after the bootstrap control plane exists.

## Bootstrap flow

```mermaid
flowchart TD
    A[Approved bootstrap project exists] --> B[Stage 0: local Terraform bootstrap root]

    B --> D[Create Terraform state bucket]
    B --> E[Create KMS key and IAM baseline]
    B --> F[Enable required project APIs]
    B --> H[Create terraform-deployer service account]

    D --> I[Remote state backend]
    E --> I

    J[GitHub repository] --> K[GitHub Actions workflow]
    K -->|OIDC token| G[Workload Identity Pool and Provider]
    G -->|Short-lived federated credentials| P[Plan/apply deployment identities]

    P --> L[Terraform plan]
    I --> L
    L --> M{Review and approval}
    M -->|Rejected| N[No apply]
    M -->|Approved| O[Terraform apply]

    O --> Q[Resource hierarchy]
    O --> R[Shared-service projects]
    O --> S[Project factory]
    O --> T[Organization policies]
    O --> U[Logging and asset inventory]

    S --> V[Production country projects]
    S --> W[Non-production projects]
    S --> X[Sandbox projects]

    Q --> Y[Cloud Audit Logs]
    R --> Y
    S --> Y
    T --> Y
    U --> Y
    Y --> Z[Central logging and security projects]
```

The approved bootstrap project is a precondition for `infra/terraform/bootstrap`; that root does not create the Google Cloud project itself. GitHub Workload Identity Federation is implemented in the separate federation path and remains pending live validation.

## Trust boundaries

```mermaid
flowchart LR
    subgraph Human[Human administration boundary]
        A[Bootstrap operator]
        R[Pull-request approver]
    end

    subgraph GitHub[GitHub boundary]
        G[Repository]
        W[Actions workflow]
    end

    subgraph Bootstrap[Google Cloud bootstrap boundary]
        P[Workload Identity Provider]
        SA[Deployment service accounts]
        ST[Remote Terraform state]
        KMS[KMS key]
    end

    subgraph Managed[Managed landing-zone boundary]
        H[Folders and projects]
        PF[Project factory]
        OP[Organization policies]
        LS[Logging and security services]
    end

    A -->|Initial controlled bootstrap| Bootstrap
    R -->|Approved change| G
    G --> W
    W -->|OIDC assertion| P
    P -->|Short-lived credentials| SA
    SA -->|Reviewed state access| ST
    KMS --> ST
    SA -->|Approved Terraform operations| Managed
    Managed -->|Audit and findings| LS
```

## Live bootstrap validation path

The first live validation exercised the Google Cloud bootstrap boundary before enabling the full GitHub federation path:

```mermaid
flowchart LR
    H[Authorized human ADC] -->|Service Account Token Creator on terraform-deployer only| SA[terraform-deployer]
    SA -->|Short-lived impersonated credentials| TF[Terraform Google provider]
    TF -->|Measured read contract| R[Bootstrap resources]
    TF -->|storage.buckets.update on one bucket| B[Protected state bucket]
    S[Remote Terraform state] --> TF
    K[KMS-protected backend] --> S
```

This validation proved service-account impersonation and the current bootstrap IAM model without using a downloaded service-account key. It did **not** validate GitHub OIDC token exchange or protected-environment enforcement.

The human Token Creator path is a transitional lab bridge until federation replaces local execution; it is not the final production-style operator path.

## Execution stages

### Stage 0A — Bootstrap project prerequisite

An approved, billing-enabled bootstrap project is created through the organization/project-governance process outside `infra/terraform/bootstrap`.

The bootstrap Terraform root consumes that existing project ID; it does not create its own parent project.

### Stage 0B — Minimal Terraform bootstrap

A temporary authorized operator creates only the resources required to establish the Terraform management plane inside the approved bootstrap project:

- state bucket;
- encryption and access controls;
- required APIs;
- Terraform execution identity.

Stage 0B does not create workload projects or application infrastructure.

The v0.7H live exercise validated the current bootstrap Terraform resources, remote state, KMS protection, service-account impersonation, and measured execution-role model.

### Stage 0C — Federation handoff

The separate federation configuration establishes:

- GitHub Workload Identity Pool and Provider;
- plan and apply service accounts;
- fixed impersonation paths; and
- repository/ref/environment trust restrictions.

This stage remains implemented but not yet live-validated.

### Stage 1 — Foundation deployment

GitHub Actions will assume short-lived Google Cloud credentials and deploy:

- folders;
- shared-service projects;
- baseline organization policies;
- centralized logging;
- asset inventory;
- project-factory prerequisites.

### Stage 2 — Managed project creation

The project factory creates production, non-production, and sandbox projects from version-controlled requests.

### Stage 3 — Workload deployment

Later phases deploy application, data, networking, and security controls into approved projects using separate state and deployment identities.

## Security controls

The flow enforces or is designed to enforce:

- no long-lived Google Cloud credential in GitHub;
- no service-account JSON key for the validated bootstrap execution path;
- no local Terraform state after backend migration;
- review before apply;
- separate state and identities by scope;
- remote state encryption and versioning;
- auditable changes;
- controlled project creation;
- centralized logging of administrative actions;
- a measured steady-state bootstrap read contract; and
- a bucket-scoped metadata update permission separated from the read contract.

The live bootstrap bucket updater is resource-scoped but not field-scoped, so it remains an apply capability rather than part of the read-only plan contract.

## Failure handling

| Failure | Required response |
|---|---|
| OIDC authentication failure | Stop workflow; inspect provider conditions and GitHub claims |
| State lock or concurrency conflict | Stop apply; resolve through the documented recovery process |
| Stale plan | Regenerate plan from current branch and state |
| Unauthorized resource request | Fail policy or project-factory validation |
| Partial apply | Review Terraform state and cloud audit logs before retrying |
| Suspected credential compromise | Disable federation binding or deployment identity and investigate |
| State corruption or deletion | Recover from bucket version history using the documented state-recovery procedure |

## Related documents

- [`../landing-zone/bootstrap-and-state.md`](../landing-zone/bootstrap-and-state.md)
- [`../landing-zone/project-factory.md`](../landing-zone/project-factory.md)
- [`../landing-zone/organization-policies.md`](../landing-zone/organization-policies.md)
- [`../landing-zone/logging-and-asset-inventory.md`](../landing-zone/logging-and-asset-inventory.md)
- [`../../adr/ADR-003-terraform-state-and-bootstrap.md`](../../adr/ADR-003-terraform-state-and-bootstrap.md)
- [`../../evidence/v0.7h-bootstrap-live-validation.md`](../../evidence/v0.7h-bootstrap-live-validation.md)

## Implementation status

**Partially live-validated** — the protected Terraform bootstrap control plane and scoped service-account impersonation path have been exercised in a dedicated Google Cloud lab project. GitHub Workload Identity Federation and the Stage 1–3 deployment path remain pending live validation.
