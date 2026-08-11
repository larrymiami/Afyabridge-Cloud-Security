# Terraform Bootstrap Flow

## Purpose

This diagram shows how the minimal bootstrap process establishes the remote Terraform backend, deployment identities, the intended GitHub Workload Identity Federation path, and the later project-factory execution path.

## Bootstrap flow

```mermaid
flowchart TD
    A[Authorized bootstrap operator] -->|Stage 0: temporary privileged execution| B[Local Terraform bootstrap configuration]

    B --> C[Create bootstrap project]
    C --> D[Create Terraform state bucket]
    C --> E[Create KMS key and IAM baseline]
    C --> F[Enable required APIs]
    C --> G[Create Workload Identity Pool and Provider]
    C --> H[Create bootstrap and deployment service accounts]

    D --> I[Remote state backend]
    E --> I

    J[GitHub repository] --> K[GitHub Actions workflow]
    K -->|OIDC token| G
    G -->|Short-lived federated credentials| H

    H --> L[Terraform plan]
    I --> L
    L --> M{Review and approval}
    M -->|Rejected| N[No apply]
    M -->|Approved| O[Terraform apply]

    O --> P[Resource hierarchy]
    O --> Q[Shared-service projects]
    O --> R[Project factory]
    O --> S[Organization policies]
    O --> T[Logging and asset inventory]

    R --> U[Production country projects]
    R --> V[Non-production projects]
    R --> W[Sandbox projects]

    P --> X[Cloud Audit Logs]
    Q --> X
    R --> X
    S --> X
    T --> X
    X --> Y[Central logging and security projects]
```

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
    SA -->|Read/write state| ST
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
    TF -->|Read contract| R[Bootstrap resources]
    TF -->|storage.buckets.update only| B[Protected state bucket]
    S[Remote Terraform state] --> TF
    K[KMS-protected backend] --> S
```

This validation proved the service-account impersonation and steady-state Google Cloud IAM model without using a downloaded service-account key. It did **not** validate GitHub OIDC token exchange or protected-environment enforcement.

## Execution stages

### Stage 0 — Minimal bootstrap

A temporary authorized operator creates only the resources required to move subsequent changes into the controlled delivery path:

- bootstrap project;
- state bucket;
- encryption and access controls;
- required APIs;
- Workload Identity Federation configuration;
- deployment identities.

Stage 0 does not create workload projects or application infrastructure.

The v0.7H live exercise validated the currently implemented bootstrap Terraform resources, remote state, KMS protection, service-account impersonation, and least-privilege execution-role model. Federation remains a separately pending live-validation step.

### Stage 1 — Foundation deployment

GitHub Actions assumes short-lived Google Cloud credentials and deploys:

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
- no local production Terraform state after backend migration;
- review before apply;
- separate state and identities by scope;
- remote state encryption and versioning;
- auditable changes;
- controlled project creation;
- centralized logging of administrative actions;
- a measured steady-state bootstrap read contract; and
- a bucket-scoped metadata update permission separated from the read contract.

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
