# Supply-chain identity boundaries

## Purpose

AfyaBridge separates pull-request validation, artifact construction, Terraform planning, Terraform application, and workload execution so compromise of one identity does not automatically grant the capabilities of another.

This document describes the implemented repository boundary. It does not claim that Workload Identity Federation or Google Cloud IAM has been live-validated.

## Identity model

| Boundary | Execution context | Cloud identity | Intended capability | Explicitly excluded |
|---|---|---|---|---|
| Application validation | GitHub-hosted runner | None | install locked dependencies, migrate local CI database, test, type-check, build | Google Cloud authentication, deployment, runtime access |
| Security gates | GitHub-hosted runner | None | secret, dependency, CodeQL, IaC, package, container, API and policy checks | Google Cloud authentication, deployment |
| Supply-chain evidence | GitHub-hosted runner | None | build local image, generate SBOMs, validate supply-chain invariants | Google Cloud authentication, deployment |
| Terraform static validation | GitHub-hosted runner | None | format/init/validate Terraform without backend | OIDC token issuance, Google Cloud mutation |
| Terraform plan | GitHub-hosted runner | dedicated plan service account through plan WIF provider | authenticate, refresh state/configuration required for reviewed plan generation | apply identity, production apply |
| Terraform apply | GitHub-hosted runner protected by the `production` environment | dedicated apply service account through apply WIF provider | apply the exact reviewed/saved plan | application runtime execution |
| Cloud Run runtime | Google Cloud Run | country/workload-specific runtime service account | application runtime access explicitly granted to that workload | GitHub federation, Terraform plan/apply privileges |

## GitHub token boundaries

Ordinary build, validation, security and SBOM workflows receive only `contents: read`. They do not receive `id-token: write` and they do not invoke `google-github-actions/auth`.

The federation plan workflow keeps workflow-level permissions at `contents: read`; its plan job explicitly opts into `id-token: write`.

The manual federation apply workflow also keeps workflow-level permissions at `contents: read`. Its plan and apply jobs each explicitly opt into `id-token: write`, because each authenticates through a different Workload Identity Federation provider and service account. The apply job remains bound to the GitHub `production` environment.

Repository checkout credentials are configured with `persist-credentials: false` in security-sensitive workflows so later shell steps do not inherit a reusable Git credential from checkout.

## Plan/apply separation

The plan workflow references only `GCP_TERRAFORM_PLAN_SERVICE_ACCOUNT`; it must not reference the apply service account.

The apply workflow uses the plan identity while constructing the saved plan and the apply identity only in the protected apply job. The saved plan, checksum and provenance metadata cross the job boundary as a short-lived artifact. The apply job verifies those values before applying the plan.

The current repository defines the trust paths statically. Live token exchange, exact IAM effectiveness, protected-environment enforcement and production apply behavior remain deployment-validation requirements.

## Runtime separation

The reusable Cloud Run module creates a `google_service_account.runtime` resource inside the workload project and assigns that account to the Cloud Run revision template. The module does not consume GitHub Terraform plan/apply service-account variables.

This prevents the deployment identity from becoming the application runtime identity by construction. Runtime permissions remain workload-specific and additive through the module's reviewed role inputs.

## CI enforcement

`scripts/validate-supply-chain-identities.mjs` is executed by the `Supply chain` workflow. It fails when:

- application, security, SBOM or static Terraform workflows gain `id-token: write`;
- those unprivileged workflows invoke Google Cloud authentication;
- the federation plan workflow does not have exactly one job-scoped OIDC grant;
- the plan workflow references the Terraform apply service account;
- the federation apply workflow does not have distinct OIDC-capable plan and apply jobs;
- the production environment binding is removed from the apply job;
- checkout credentials persist in federation workflows;
- the Cloud Run module stops creating and using its dedicated runtime service account; or
- the runtime module starts referencing GitHub Terraform deployment identities.

These checks are repository-structure controls. They do not replace live IAM tests or runtime authorization validation.
