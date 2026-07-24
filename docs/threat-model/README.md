# Threat Model

## Purpose

This threat model identifies and prioritises security risks affecting the AfyaBridge Cloud Security platform. It connects the project scenario, trust boundaries, security objectives, architecture decisions, and implementation evidence.

The model is intended to evolve with the system. Threats are reviewed when the architecture changes, new services are introduced, trust boundaries move, or new deployment environments are added.

## Scope

The threat model covers:

- the CHW web application and supporting APIs;
- offline synchronisation and queued submissions;
- workforce, workload, and application identities;
- Google Cloud projects, networks, data services, and shared security services;
- source control, CI/CD, build systems, artifact storage, and deployment controls;
- central logging, cloud-security posture management, monitoring, and incident response;
- country-level isolation for Kenya, Ghana, and South Africa;
- external notification, identity, referral, and security integrations.

The model is based on synthetic data and a controlled lab environment. It does not represent a certified production security assessment.

## Method

The project uses a hybrid threat-modelling approach:

1. **Asset identification** — identify data, identities, services, infrastructure, and business processes requiring protection.
2. **Trust-boundary analysis** — identify where data or control crosses between users, devices, services, networks, projects, countries, and external systems.
3. **STRIDE classification** — classify threats as spoofing, tampering, repudiation, information disclosure, denial of service, or elevation of privilege.
4. **Risk scoring** — assess likelihood and impact on a five-point scale.
5. **Control mapping** — map each threat to preventive, detective, and responsive controls.
6. **Validation planning** — define how each control will be tested and what evidence will be retained.

## Risk scoring

### Likelihood

| Score | Description |
|---:|---|
| 1 | Rare; requires highly unusual conditions |
| 2 | Unlikely; possible but requires significant access or effort |
| 3 | Possible; credible under normal threat conditions |
| 4 | Likely; commonly observed attack path or operational failure |
| 5 | Almost certain; expected without an explicit control |

### Impact

| Score | Description |
|---:|---|
| 1 | Negligible operational or security effect |
| 2 | Limited impact affecting a small number of users or non-sensitive data |
| 3 | Material impact requiring investigation and remediation |
| 4 | Major impact affecting sensitive data, country operations, or service availability |
| 5 | Critical impact involving broad compromise, severe data exposure, or prolonged outage |

### Risk rating

Risk score is calculated as:

```text
likelihood × impact
```

| Score | Rating |
|---:|---|
| 1–4 | Low |
| 5–9 | Medium |
| 10–14 | High |
| 15–25 | Critical |

The score guides prioritisation but does not replace engineering judgement. Threats involving restricted data, privileged identities, software-supply-chain integrity, or country isolation may be treated as higher priority even when the numerical score is lower.

## Threat status

Each threat uses one of the following states:

| Status | Meaning |
|---|---|
| Identified | Threat documented but controls not yet designed |
| Planned | Controls and validation approach defined |
| In progress | Controls are being implemented |
| Mitigated | Required controls implemented and validated |
| Accepted | Residual risk explicitly documented and accepted |
| Deferred | Work postponed with rationale and review date |

## Required threat record fields

Every threat record should include:

- unique threat ID;
- affected asset or process;
- threat description;
- STRIDE category;
- threat actor or failure source;
- likelihood and impact;
- initial risk rating;
- preventive controls;
- detective controls;
- response or recovery controls;
- residual risk;
- validation method;
- evidence location;
- implementation status.

## Threat actors and failure sources

The model considers:

- unauthenticated external attackers;
- compromised CHW or staff accounts;
- malicious or careless insiders;
- compromised developer or CI/CD identities;
- vulnerable or malicious third-party dependencies;
- misconfigured infrastructure;
- compromised workloads;
- external service failures;
- lost or stolen field devices;
- regional cloud-service disruption;
- accidental data handling or logging errors.

## Assets of interest

Key assets include:

- identifiable household records;
- maternal-care follow-up records;
- referral records and statuses;
- CHW assignments and geographic scopes;
- user sessions and authentication factors;
- service accounts and workload identities;
- source code and infrastructure code;
- container images, SBOMs, signatures, and provenance;
- encryption keys and secrets;
- cloud audit logs and security findings;
- country-specific configuration;
- health-education content;
- backup and recovery data;
- security policies and incident evidence.

## Review triggers

The threat model must be reviewed when:

- a new country or region is added;
- a new public endpoint is introduced;
- identity or authorisation logic changes;
- data classification changes;
- a new external integration is added;
- the runtime moves between Cloud Run and GKE;
- CI/CD or artifact-trust controls change;
- an incident reveals an unmodelled attack path;
- a material architecture decision changes a trust boundary.

## Related documents

- [`../project-scenario.md`](../project-scenario.md)
- [`../scope-and-boundaries.md`](../scope-and-boundaries.md)
- [`../security-objectives.md`](../security-objectives.md)
- [`../architecture/diagrams/system-context.md`](../architecture/diagrams/system-context.md)
- [`./trust-boundaries.md`](./trust-boundaries.md)
- [`./threat-register.md`](./threat-register.md)
