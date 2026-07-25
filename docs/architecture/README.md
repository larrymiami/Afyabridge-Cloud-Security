# Architecture Documentation

## Purpose

This directory contains the architecture views, decisions, constraints, and supporting diagrams for AfyaBridge Cloud Security.

The documentation is organised so that business requirements, trust boundaries, threats, security objectives, controls, and implementation evidence can be traced to one another.

## Current architecture artifacts

| Artifact | Purpose | Status |
|---|---|---|
| [`../project-scenario.md`](../project-scenario.md) | Defines the organisation, users, countries, workloads, data, and operating assumptions | Complete for v0.1 |
| [`../scope-and-boundaries.md`](../scope-and-boundaries.md) | Defines implementation scope, exclusions, safety limits, and completion criteria | Complete for v0.1 |
| [`../security-objectives.md`](../security-objectives.md) | Defines measurable security outcomes and required evidence | Complete for v0.1 |
| [`diagrams/system-context.md`](./diagrams/system-context.md) | Shows system actors, external dependencies, and highest-level trust boundaries | Complete for v0.1 |
| [`../threat-model/README.md`](../threat-model/README.md) | Defines threat-modelling method and risk scoring | Complete for v0.1 |
| [`../threat-model/trust-boundaries.md`](../threat-model/trust-boundaries.md) | Defines where identity, data, or control crosses security boundaries | Complete for v0.1 |
| [`../threat-model/threat-register.md`](../threat-model/threat-register.md) | Records initial threats, controls, validation, and residual risk | Complete for v0.1 |
| [`../security-control-matrix.md`](../security-control-matrix.md) | Maps threats and objectives to controls, validation, evidence, and status | Complete for v0.1 |

## Architecture views

The project will maintain several complementary views rather than one oversized diagram.

### 1. System context

Shows:

- platform users;
- the AfyaBridge system boundary;
- external identity and notification services;
- partner referral systems;
- source control and delivery systems;
- security and incident-management integrations.

### 2. Container and service view

Will show:

- CHW web application;
- household service;
- referral service;
- health-content service;
- offline synchronisation worker;
- data and analytics components;
- service-to-service communication.

### 3. Google Cloud foundation view

Will show:

- resource hierarchy;
- shared and country projects;
- environment separation;
- central networking, logging, security, and CI/CD services;
- policy inheritance.

### 4. Network and trust-zone view

Will show:

- public edge;
- application zone;
- data zone;
- management zone;
- analytics zone;
- security zone;
- approved ingress and egress paths.

### 5. Identity view

Will show:

- workforce identities;
- application identities;
- workload identities;
- CI/CD federation;
- privileged and break-glass access;
- country and programme attributes.

### 6. Software supply-chain view

Will show:

- source review;
- testing and security gates;
- container build;
- SBOM and provenance generation;
- artifact signing;
- registry promotion;
- deployment admission controls.

### 7. Monitoring and incident-response view

Will show:

- audit and application log sources;
- central log routing;
- posture findings;
- alerts and detection rules;
- investigation evidence;
- containment and recovery actions.

### 8. Resilience and recovery view

Will show:

- regional workloads;
- queues and retry paths;
- backup and restore paths;
- failover behaviour;
- recovery dependencies.

## Architecture Decision Records

Architecture decisions will be stored under:

```text
docs/architecture/decisions/
```

The naming format is:

```text
NNNN-short-decision-title.md
```

Each ADR should contain:

1. **Status** — proposed, accepted, superseded, or deprecated.
2. **Context** — the problem, constraints, and relevant risks.
3. **Decision** — the selected approach.
4. **Consequences** — positive, negative, and operational effects.
5. **Alternatives considered** — credible options and reasons for rejection.
6. **Security implications** — affected threats, objectives, and controls.
7. **Validation** — how the decision will be tested.

Initial ADRs are expected to cover:

- project and country separation;
- Cloud Run before GKE Autopilot;
- Workload Identity Federation for CI/CD;
- country-scoped application authorisation;
- private-by-default data services;
- central security logging;
- Terraform as the production infrastructure authority;
- artifact signing and trusted deployment.

## Diagram conventions

- Mermaid is used for version-controlled diagrams during early design.
- Diagram titles and labels must describe architecture, not implementation aspirations.
- Trust boundaries must be explicitly identified where relevant.
- Data flows should state the type or sensitivity of data when useful.
- Public, private, shared, country, and external zones must be visually distinguishable.
- A diagram must not imply that a service or control is deployed unless its implementation status is stated.
- Detailed diagrams should link to the related ADRs, threats, objectives, and controls.

## Implementation status

Architecture elements should use the status labels defined in [`../scope-and-boundaries.md`](../scope-and-boundaries.md):

| Status | Meaning |
|---|---|
| Implemented | Deployed or executed with evidence |
| Simulated | Tested through a controlled exercise |
| Code complete | Validated configuration exists but was not applied |
| Designed | Architecture and controls are documented but not built |
| Enterprise extension | Relevant production capability outside the available lab scope |

The v0.1 architecture is currently **Designed**. Implementation status will change only when code, validation, and evidence exist.

## Traceability

Architecture changes must be reviewed against:

- the project scenario and operating assumptions;
- scope and boundaries;
- security objectives;
- trust boundaries;
- threat register;
- security control matrix;
- cost and operational constraints.

A material architecture change should result in one or more of the following:

- a new or updated ADR;
- a threat-model review;
- a changed security objective;
- an updated control mapping;
- new validation requirements.
