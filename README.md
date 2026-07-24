# AfyaBridge Cloud Security

A secure, governed, multi-region community health platform designed to demonstrate cloud engineering, cloud security, and DevSecOps practices on Google Cloud.

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

## Planned architecture

The platform will include:

- a multi-environment Google Cloud landing zone;
- shared networking, logging, and security services;
- country-specific production projects;
- Cloud Run as the initial application runtime;
- GKE Autopilot as an advanced implementation;
- Artifact Registry and Binary Authorization;
- Secret Manager and Cloud KMS;
- Cloud Armor and private data services;
- Security Command Center and Cloud Asset Inventory;
- GitHub Actions using Workload Identity Federation;
- signed container images, SBOMs, and build attestations.

## Delivery phases

1. Project scenario and threat model
2. Google Cloud landing-zone design
3. Identity and access architecture
4. Secure network zoning
5. Community-health application baseline
6. DevSecOps security pipeline
7. Software supply-chain controls
8. Secure Google Cloud deployment
9. Cloud security posture management
10. Key management and data protection
11. Shift-right monitoring and validation
12. Incident-response simulations
13. Multi-region resilience testing

See [ROADMAP.md](./ROADMAP.md) for the detailed implementation plan.

## Repository status

The project is currently in the architecture and planning phase.

## Data and safety

- Only synthetic data will be used.
- No real patient or employee records will be included.
- No production credentials will be stored.
- Intentionally vulnerable components will only run in isolated lab environments.
- All cloud resources will include documented cleanup procedures and cost controls.

## Author

Built and documented by Larry Miami as an exploration of secure cloud delivery and resilient healthtech engineering.