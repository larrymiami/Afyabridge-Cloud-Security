# AfyaBridge Cloud Security

A secure, governed, multi-region community health platform built as a hands-on reference implementation for cloud engineering, cloud security, and DevSecOps practices on Google Cloud.

> [!IMPORTANT]
> This is an independent fictional portfolio project built using synthetic data.
> It does not represent the infrastructure, architecture, source code, credentials,
> systems, or data of any real healthcare organization.

## Project scenario

A fictional international NGO operates community health programmes across multiple countries.

Community Health Workers use a mobile-friendly web application to:

- register households;
- deliver health education;
- support maternal-care follow-ups;
- create referrals to health facilities;
- synchronize field activity from low-connectivity environments.

The organization requires a secure Google Cloud foundation that supports multiple countries, environments, teams, workloads, and regulatory boundaries.

## Project goals

This project demonstrates practical understanding of:

- Google Cloud architecture and deployment;
- cloud security posture management;
- identity and access management;
- large-scale workforce, workload, and application identity;
- secure network zoning;
- key and secrets management;
- infrastructure as code;
- DevSecOps pipelines;
- software supply-chain security;
- SBOM generation and artifact signing;
- dependency risk management;
- governance and policy as code;
- monitoring, detection, and incident response;
- multi-region reliability and resilience;
- shift-left and shift-right security.

## Target architecture and implementation state

The target platform includes:

- a multi-environment Google Cloud landing zone;
- shared networking, logging, and security services;
- country-specific production projects;
- Cloud Run as the initial application runtime;
- GKE Autopilot as an advanced implementation;
- Artifact Registry and future deployment-time artifact trust enforcement;
- Secret Manager and Cloud KMS;
- Cloud Armor and private data services;
- Security Command Center and Cloud Asset Inventory;
- GitHub Actions using Workload Identity Federation;
- signed artifacts, SBOMs, and build attestations.

The repository already contains an implemented application-security baseline, Terraform infrastructure for the Google Cloud foundation and country workloads, shift-left security gates, software supply-chain controls, cloud-posture governance, and a keyless GitHub Actions to Google Cloud deployment-control plane.

Infrastructure is statically validated in CI. The protected Terraform bootstrap control plane and the GitHub Workload Identity Federation deployment path have also been live-validated in a dedicated Google Cloud project. That live validation includes separate plan/apply service accounts, protected remote state, production-environment approval, immutable saved-plan provenance, least-privilege permission discovery, a controlled Google provider mutation, and negative trust-boundary tests. The remaining foundation, network, workload, observability, edge, live-posture, and runtime controls remain explicit live-validation work rather than assumed outcomes.

## Current validation state

| Area | Current state | What is actually proven |
|---|---|---|
| Threat model and cloud architecture | Designed | Reviewed scenario, trust boundaries, country isolation, IAM, network, data, and control architecture |
| Application security baseline | Validated | Authentication seam, deny-by-default authorization, scoped persistence, audit, offline sync, replay/idempotency controls, and automated tests |
| Terraform infrastructure | Implemented + static validation | Repository Terraform roots initialize and validate with committed provider lockfiles |
| Terraform bootstrap | Live validated | CMEK-backed remote state, impersonation, measured steady-state IAM, controlled mutation, and temporary-privilege cleanup |
| GitHub → GCP federation | Live validated | OIDC/WIF token exchange, separate plan/apply identities, protected production approval, saved-plan integrity/provenance, state locking, real provider mutation, and negative trust tests |
| Shift-left security pipeline | Validated in CI | Secret, dependency, license, CodeQL, IaC, package, container, API-contract, policy, exception, and fail-closed verdict controls |
| Software supply chain | Validated in CI | SBOMs, protected-main signing identity, keyless Cosign signing, attestations, provenance verification, and revocation checks |
| Cloud posture and governance | Repository-stage validation | Desired-state posture, drift decision logic, finding lifecycle, evidence reporting, and fail-closed governance; live cloud posture remains pending |
| Foundation / network / workloads / observability / edge | Pending live validation | Implemented and statically validated, but not yet claimed as live-enforced |

See [ROADMAP.md](./ROADMAP.md) for the detailed phase state and [docs/evidence/README.md](./docs/evidence/README.md) for the validation-evidence index.

## Keyless Terraform deployment path

The live-validated deployment-control path is intentionally split by responsibility:

```text
GitHub pull request / reviewed main commit
              |
              v
      Terraform plan workflow
              |
        GitHub OIDC token
              v
        plan WIF provider
              |
              v
     terraform-plan service account
              |
              +--> protected remote-state read
              |
              `--> reviewed saved plan + checksum + provenance
                           |
                           v
                  production approval
                           |
                           v
                   Terraform apply job
                           |
                     GitHub OIDC token
                           v
                    apply WIF provider
                           |
                           v
                  terraform-apply service account
                           |
                           +--> protected state locking/persistence
                           |
                           `--> exact saved-plan application
```

No downloaded Google Cloud service-account JSON key is used by this path.

The plan identity is not given apply-state mutation permissions. The apply identity is not given project IAM policy mutation capability merely to manage its own grants. Provider permissions used during live validation were measured from denied operations and installed through separately owned Stage-0 administrative handoff controls.

## Current security pipeline

The repository CI currently demonstrates:

- locked application dependency installation and pinned build tooling;
- full-commit-SHA-pinned GitHub Actions;
- digest-pinned container base images and CI service images;
- committed, read-only Terraform provider lockfiles for validated Terraform roots;
- secret, dependency, license, CodeQL, IaC, package, container, API-contract, policy-as-code, and exception checks;
- CycloneDX and SPDX SBOM generation for the repository and built web image;
- an unprivileged build/SBOM job separated from the signing identity;
- keyless Sigstore/Cosign signing and GitHub artifact attestations on trusted pushes to `main`;
- provenance verification constrained to the expected repository, workflow, source ref, and source commit;
- explicit artifact/source/workflow revocation policy;
- separate keyless Terraform plan and apply identities using GitHub OIDC and Google Workload Identity Federation;
- a protected `production` environment before apply authentication;
- immutable saved-plan checksum and provenance verification before apply;
- negative compromise tests that prove reviewed repository, signing, and deployment trust boundaries fail closed when weakened.

Pull requests intentionally exercise the unprivileged build and security-validation path only. Privileged signing is restricted to trusted pushes to `refs/heads/main`, while infrastructure apply is separately restricted by the reviewed main-branch workflow, the production environment, Workload Identity Federation conditions, and the dedicated apply identity.

## Delivery phases

1. Project scenario and threat model
2. Google Cloud landing-zone design
3. Identity and access architecture
4. Secure network zoning
5. Community-health application baseline
6. DevSecOps security pipeline
7. Software supply-chain controls
8. Secure Google Cloud deployment and live validation
9. Cloud security posture management
10. Key management and data protection
11. Shift-right monitoring and validation
12. Incident-response simulations
13. Multi-region resilience testing

See [ROADMAP.md](./ROADMAP.md) for the detailed implementation plan and the distinction between designed, implemented, and live-validated controls.

## Validation evidence

Evidence is intentionally separated from architecture claims. Static validation, live cloud behavior, controlled mutations, and negative trust tests are recorded independently so that the repository does not present a designed control as a proven one.

Start with the [validation-evidence index](./docs/evidence/README.md). The current live-deployment-control sequence is:

- [v0.7H — Terraform bootstrap live validation](./docs/evidence/v0.7h-bootstrap-live-validation.md)
- [v0.7I — GitHub WIF plan identity live validation](./docs/evidence/v0.7i-github-wif-live-validation.md)
- [v0.7J — protected apply and state-access validation](./docs/evidence/v0.7j-github-wif-apply-validation.md)
- [v0.7K — controlled Google provider mutation](./docs/evidence/v0.7k-github-wif-provider-mutation-validation.md)
- [v0.7L — negative WIF and environment trust validation](./docs/evidence/v0.7l-github-wif-negative-trust-validation.md)

## Repository status

The project is in active implementation and live validation. The application-security baseline, shift-left CI/CD controls, and software-supply-chain controls are validated in repository CI. The Google Cloud infrastructure is implemented and statically validated. The Terraform bootstrap and GitHub-to-GCP federation/deployment-control plane are additionally live-validated; the broader foundation, network, workload, observability, edge, live posture, and runtime stages remain pending their own deployment and effectiveness evidence.

## Data and safety

- Only synthetic data is used.
- No real patient or employee records are included.
- No production credentials are stored in the repository.
- No service-account JSON key is required for the validated GitHub-to-GCP deployment path.
- Intentionally vulnerable components will only run in isolated lab environments.
- Cloud resources include or will include documented cleanup procedures and cost controls before each live deployment stage.

## License

Copyright 2026 Larry Miami.

This project is licensed under the
[Apache License 2.0](./LICENSE).

The AfyaBridge name and associated branding are not granted for reuse under
this license.

## Author

Built and documented by Larry Miami as an exploration of secure cloud delivery and resilient healthtech engineering.
