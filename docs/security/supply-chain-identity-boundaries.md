# Supply-chain identity boundaries

## Purpose

AfyaBridge separates pull-request validation, artifact construction, artifact signing, Terraform planning, Terraform application, and workload execution so compromise of one identity does not automatically grant the capabilities of another.

This document describes the implemented repository boundary. It does not claim that Workload Identity Federation, Google Cloud IAM, Artifact Registry signing, or deployment-time provenance enforcement has been live-validated.

## Identity model

| Boundary | Execution context | Cloud or signing identity | Intended capability | Explicitly excluded |
|---|---|---|---|---|
| Application validation | GitHub-hosted runner | None | install locked dependencies, migrate local CI database, test, type-check, build | Google Cloud authentication, deployment, artifact signing |
| Security gates | GitHub-hosted runner | None | secret, dependency, CodeQL, IaC, package, container, API and policy checks | Google Cloud authentication, deployment, artifact signing |
| Supply-chain build/SBOM | GitHub-hosted runner | None | build local image, export exact image artifact, generate SBOMs, validate supply-chain invariants, record checksums | OIDC token issuance, attestation writes, Google Cloud authentication, deployment |
| Supply-chain signing/provenance | GitHub-hosted runner | short-lived GitHub OIDC identity | verify the prior build handoff, create keyless Sigstore signature, generate GitHub provenance/SBOM attestations, verify signer identity | rebuilding the artifact, registry publishing, Google Cloud authentication, deployment |
| Terraform static validation | GitHub-hosted runner | None | format/init/validate Terraform without backend | OIDC token issuance, Google Cloud mutation |
| Terraform plan | GitHub-hosted runner | dedicated plan service account through plan WIF provider | authenticate, refresh state/configuration required for reviewed plan generation | apply identity, production apply |
| Terraform apply | GitHub-hosted runner protected by the `production` environment | dedicated apply service account through apply WIF provider | apply the exact reviewed/saved plan | application runtime execution |
| Cloud Run runtime | Google Cloud Run | country/workload-specific runtime service account | application runtime access explicitly granted to that workload | GitHub federation, Terraform plan/apply privileges |

## GitHub token boundaries

Application, security, static Terraform, and the supply-chain build/SBOM job receive no `id-token: write` permission. They cannot request a GitHub OIDC token for keyless signing or cloud federation.

The `Supply chain` workflow keeps workflow-level permissions at `contents: read`. Only its dedicated `provenance` job opts into `id-token: write` and `attestations: write`. That job does not receive `packages: write`, `artifact-metadata: write`, or Google Cloud authentication, because v0.9C signs and attests the exported build artifact rather than publishing to a registry.

The federation plan workflow also keeps workflow-level permissions at `contents: read`; its plan job explicitly opts into `id-token: write`.

The manual federation apply workflow keeps workflow-level permissions at `contents: read`. Its plan and apply jobs each explicitly opt into `id-token: write`, because each authenticates through a different Workload Identity Federation provider and service account. The apply job remains bound to the GitHub `production` environment.

Repository checkout credentials are configured with `persist-credentials: false` in security-sensitive workflows so later shell steps do not inherit a reusable Git credential from checkout.

## Build-to-sign handoff

The unprivileged supply-chain build job performs the application image build and SBOM generation before any signing identity exists. It exports the exact local Docker image as `afyabridge-web-<GITHUB_SHA>.tar`, records source/run metadata, calculates SHA-256 digests for the image archive and generated evidence, and uploads that package as a workflow artifact.

The signing/provenance job depends on the build job and downloads that package. Before requesting a GitHub OIDC token for signing, it verifies the recorded checksums and asserts that the repository, execution SHA, ref, run ID, run attempt, and expected artifact name match the current workflow execution.

The signing job does not run `docker build`. This is deliberate: the privileged job signs the artifact it received rather than quietly constructing a different artifact after gaining signing authority.

GitHub's artifact transport also performs its own upload/download digest validation. The repository-level SHA-256 manifest is retained in addition to that platform integrity check so the handoff is explicit and independently inspectable.

## Keyless signature and provenance model

v0.9C uses two complementary mechanisms:

1. **Sigstore Cosign keyless blob signing.** The exported image archive is signed with `cosign sign-blob` using the short-lived GitHub OIDC identity. Verification requires the GitHub Actions OIDC issuer and the exact `supply-chain.yml` workflow identity for the execution ref.
2. **GitHub artifact attestations.** The workflow creates SLSA build provenance for the checksummed build outputs and an SPDX SBOM attestation for the exported image artifact. The workflow then verifies those attestations with `gh attestation verify`, constraining verification to this repository and signer workflow and rejecting self-hosted-runner provenance.

The Cosign bundle, GitHub attestation bundles, verification output, and their SHA-256 digests are retained as workflow evidence.

These controls change the claim from only "a CI job produced a file" to "these exact bytes have a verifiable signature/attestation tied to this GitHub repository and trusted workflow execution."

## What v0.9C does not claim

The current repository does **not** yet push the application image to Artifact Registry from the supply-chain workflow, sign a registry image digest with `cosign sign`, or enforce provenance/signature policy during a live Cloud Run deployment. Those controls require the live Google Cloud federation and deployment path that remains pending under v0.7 runtime validation.

Accordingly, the v0.9C artifact is an exported image archive treated as a signed file/blob. The archive preserves the exact built image output used for this CI evidence package, but it is not presented as proof that a particular live Artifact Registry digest was deployed.

Artifact provenance establishes build origin and integrity; it does not prove that the source code is vulnerability-free or that the workflow itself is incapable of malicious behavior. Workflow review, immutable action pinning, security gates, protected deployment controls, and later runtime policy remain separate layers.

## Plan/apply separation

The plan workflow references only `GCP_TERRAFORM_PLAN_SERVICE_ACCOUNT`; it must not reference the apply service account.

The apply workflow uses the plan identity while constructing the saved plan and the apply identity only in the protected apply job. The saved plan, checksum and provenance metadata cross the job boundary as a short-lived artifact. The apply job verifies those values before applying the plan.

The current repository defines the trust paths statically. Live token exchange, exact IAM effectiveness, protected-environment enforcement and production apply behavior remain deployment-validation requirements.

## Runtime separation

The reusable Cloud Run module creates a `google_service_account.runtime` resource inside the workload project and assigns that account to the Cloud Run revision template. The module does not consume GitHub Terraform plan/apply service-account variables.

This prevents the deployment identity from becoming the application runtime identity by construction. Runtime permissions remain workload-specific and additive through the module's reviewed role inputs.

## CI enforcement

`scripts/validate-supply-chain-identities.mjs` is executed by the `Supply chain` workflow. It fails when:

- application, security, or static Terraform workflows gain `id-token: write`;
- those unprivileged workflows invoke Google Cloud authentication;
- the supply-chain workflow gains OIDC or attestation permission outside the dedicated provenance job;
- the provenance job gains registry or artifact-metadata write permission;
- the build/SBOM job signs or attests its own outputs;
- the build job stops exporting and checksumming the exact image artifact;
- the provenance job stops depending on and verifying the prior build artifact;
- the provenance job rebuilds the artifact after gaining signing permission;
- keyless Cosign signing/verification or GitHub build/SBOM attestations are removed;
- the federation plan workflow does not have exactly one job-scoped OIDC grant;
- the plan workflow references the Terraform apply service account;
- the federation apply workflow does not have distinct OIDC-capable plan and apply jobs;
- the production environment binding is removed from the apply job;
- checkout credentials persist in federation workflows;
- the Cloud Run module stops creating and using its dedicated runtime service account; or
- the runtime module starts referencing GitHub Terraform deployment identities.

These checks are repository-structure controls. They do not replace live IAM tests, registry policy enforcement, deployment-time signature verification, or runtime authorization validation.
