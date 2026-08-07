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

The repository already contains an implemented application-security baseline, Terraform infrastructure for the Google Cloud foundation and country workloads, shift-left security gates, and software supply-chain controls. Infrastructure has been statically validated in CI, but the Google Cloud stacks have not yet been applied and validated in a live organization. Workload Identity Federation, live deployment IAM, Artifact Registry signing/promotion, deployment-time provenance enforcement, and runtime control effectiveness therefore remain explicit validation work rather than assumed outcomes.

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
- negative compromise tests that prove reviewed trust boundaries fail closed when weakened.

Pull requests intentionally exercise the unprivileged build and security-validation path only. The privileged signing/provenance job is restricted to pushes to `refs/heads/main`, so reviewed repository governance for `main` is part of the signing trust boundary.

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

## Repository status

The project is in active implementation and validation. The application-security baseline is implemented and validated; the Google Cloud infrastructure is implemented and statically validated with live deployment still pending; the shift-left CI/CD and software supply-chain milestones are in review.

## Data and safety

- Only synthetic data is used.
- No real patient or employee records are included.
- No production credentials are stored in the repository.
- Intentionally vulnerable components will only run in isolated lab environments.
- Cloud resources will include documented cleanup procedures and cost controls before live deployment.

## License

Copyright 2026 Larry Miami.

This project is licensed under the
[Apache License 2.0](./LICENSE).

The AfyaBridge name and associated branding are not granted for reuse under
this license.

## Author

Built and documented by Larry Miami as an exploration of secure cloud delivery and resilient healthtech engineering.
