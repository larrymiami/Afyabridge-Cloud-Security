# Building AfyaBridge: Designing a Production-Style Cloud Security Platform on Google Cloud

> **Status:** Draft  
> **Series:** AfyaBridge Engineering Notes  
> **Evidence state:** Architecture implemented and repository controls validated; live Google Cloud deployment validation pending  
> **Last reviewed:** 2026-08-07

A cloud security project can look impressive while proving surprisingly little.

A Terraform repository can show what someone intended to deploy. A green CI pipeline can show that a set of checks passed. A security diagram can show that the right boxes exist. None of those things, by themselves, prove that the deployed system actually behaves the way the architecture says it should.

I started **AfyaBridge** because I wanted a project that forced me to deal with that gap.

The goal is not to build a collection of disconnected Google Cloud demos. It is to design, implement, deploy, break, observe, and defend a production-style security architecture for a fictional multi-country health platform — and to retain enough evidence that every major security claim can be challenged.

This is the opening note for that engineering journey.

---

## The scenario

AfyaBridge is a fictional community-health platform used by organisations operating across multiple countries.

The application supports community health workers delivering services in countries such as Kenya, Ghana, and South Africa. That makes the security problem more interesting than deploying a single web application into a single project.

The platform has to reason about:

- country-level data and administrative boundaries;
- production and non-production separation;
- workforce and workload identity;
- application authorization;
- private and public network paths;
- secrets and encryption keys;
- CI/CD trust;
- software supply-chain integrity;
- centralized audit and security telemetry;
- infrastructure drift;
- security findings, remediation, exceptions, and closure;
- incident response and recovery.

The fictional scenario is deliberate. It gives the project realistic constraints without presenting any real organisation's infrastructure or data as part of the exercise.

---

## The architecture is a chain of trust boundaries

I think about the project as an end-to-end path rather than a list of cloud products:

```text
Application
    ↓
CI/CD
    ↓
Software supply chain
    ↓
Google Cloud resource hierarchy
    ↓
Identity and access
    ↓
Network and public edge
    ↓
Data protection
    ↓
Logging and detection
    ↓
Security posture and drift
    ↓
Finding lifecycle
    ↓
Incident response and recovery
```

Each layer makes assumptions about the layer before it.

For example, a secure Cloud Run configuration is less useful if the deployment workflow can be modified by an untrusted pull request and use a long-lived service-account key. A strong CI pipeline is not enough if a privileged operator can make an out-of-band cloud change that nobody detects. A posture scanner is not enough if findings can be downgraded, excepted indefinitely, or closed without evidence.

That is why AfyaBridge treats these controls as one system.

---

## A control should produce evidence

One of the rules I adopted early in the project is simple:

> A security control should eventually produce evidence that can be reviewed independently of the person who implemented it.

That evidence can take different forms depending on the control.

| Control state | Example evidence |
|---|---|
| Designed | architecture decision record, threat model, diagram |
| Implemented | Terraform, application code, policy-as-code |
| CI-enforced | failing negative test, required status check, scanner verdict |
| Live-validated | `gcloud`/API output, audit log, denied request, runtime observation |
| Operational | repeated monitoring, real finding lifecycle, recovery exercise |

These states are intentionally different.

A Terraform resource that says `ipv4_enabled = false` is useful evidence of desired state. It is not the same as querying the deployed Cloud SQL instance and proving that it has no public IPv4 path.

A synthetic Terraform plan that proves the drift evaluator classifies a destructive replacement as Critical is useful. It does not prove that the project has detected a real console change against remote state.

Keeping those distinctions explicit has become one of the most important design principles in the repository.

---

## What has been built so far

The repository has grown in layers.

### 1. Threat model and security architecture

The project starts with the scenario, assets, trust boundaries, threats, control matrix, and architecture decisions rather than with Terraform.

That gives later implementation work something to trace back to.

A control exists because a threat, governance requirement, or operational requirement exists — not simply because a cloud benchmark says the setting should be enabled.

### 2. Application security baseline

A small application provides something real for the cloud architecture to protect.

The application implements server-side authorization, country/programme/facility scope, durable persistence, structured audit events, optimistic concurrency, and an offline synchronization path with replay and idempotency controls.

The application is deliberately limited. The goal is not to turn AfyaBridge into a full healthcare product. The application exists to exercise security boundaries that would otherwise be abstract.

### 3. Google Cloud infrastructure as code

The Terraform design covers:

- organisation/folder/project hierarchy;
- country and environment separation;
- organization policies;
- Shared VPC networking;
- Cloud NAT and private Google access paths;
- Artifact Registry;
- Secret Manager;
- Cloud KMS;
- Cloud Run;
- private Cloud SQL;
- protected Cloud Storage;
- centralized logging and monitoring;
- security detections;
- DNS, managed certificates, load balancing, and Cloud Armor.

The infrastructure has been statically validated, but this is also where the project's largest remaining evidence boundary exists: **the full environment has not yet been applied and exercised in a live Google Cloud organization**.

I would rather state that explicitly than label configuration as operational simply because `terraform validate` passed.

### 4. Keyless deployment design

The deployment path is designed around GitHub Actions OIDC and Google Cloud Workload Identity Federation rather than long-lived service-account keys.

Plan and apply identities are separated so that observing infrastructure changes and authorizing infrastructure changes do not require the same privilege.

The important question is not only whether federation is configured, but whether the trust condition actually rejects the wrong repository/ref/workflow identity. That is one of the controls the live phase will exercise directly.

### 5. Shift-left security gates

The repository runs secret scanning, dependency and license review, CodeQL, IaC scanning, package and container vulnerability scanning, API contract validation, and OPA policy checks.

The required branch status is a fail-closed **Security gate verdict** rather than an evidence-generation job that could succeed after an upstream scanner failed.

This matters because the status check itself is part of the security architecture.

### 6. Software supply-chain security

The build path produces CycloneDX and SPDX SBOMs, pins workflow dependencies, validates dependency/provider integrity, separates build/sign/deploy/runtime identities, signs the exact main-branch image artifact with keyless Cosign, and creates source/ref-bound provenance and SBOM attestations.

The signing workflow only runs on the protected `main` trust anchor. Pull requests exercise the unprivileged build and evidence path but cannot use the trusted signing identity.

### 7. Cloud posture and finding governance

The posture layer is designed to avoid another common problem: a dashboard saying "green" without being able to explain what "green" means.

The repository currently has:

- a governed cloud-control catalogue;
- executable desired-state posture rules;
- anchored rule/control and assertion semantics;
- a normalized repository posture collector;
- synthetic Terraform drift classification;
- a governed security finding lifecycle;
- active and historical risk-acceptance records;
- independent closure evidence;
- reporting thresholds and SLA/overdue views;
- run-bound JSON and Markdown posture reports.

The current repository desired state passes its governed checks, but all live-cloud validations remain explicitly visible as debt.

That distinction is intentional.

---

## The project is designed to fail closed

A surprising amount of the work has not been adding features. It has been trying to make the security controls lie.

Reviewer passes have deliberately tested questions such as:

- Can a required posture rule simply be deleted?
- Can one assertion be removed while the rule still exists?
- Can a Critical control be downgraded to Medium so it stops blocking?
- Can a previously non-exceptionable control suddenly allow risk acceptance?
- Can fake historical metrics be committed to make the trend look better?
- Can a reporting job show PASS even when upstream governance failed?
- Can commented-out Terraform text trick a source-pattern collector?
- Can a safe default be overridden by a caller with an unsafe value?
- Can a failed remediation verification be erased when a finding is retried?
- Can an expired historical exception make a correctly closed finding invalid years later?

When one of those attacks works, the correct response is not to weaken the test. It is to treat the behavior as a design flaw and close the gap.

That process has been more educational than simply adding another scanner to CI.

---

## Why the next phase matters

Up to this point, AfyaBridge has built a strong repository-side security model.

The next phase is where the project becomes much more valuable: **live Google Cloud validation**.

The sequence will be roughly:

```text
Cloud account and organization
        ↓
Secure Terraform bootstrap
        ↓
Landing-zone hierarchy and policies
        ↓
GitHub OIDC / Workload Identity Federation
        ↓
Country networking
        ↓
Secure workloads
        ↓
Logging and detections
        ↓
Public edge and Cloud Armor
        ↓
Real infrastructure drift
        ↓
Real security finding lifecycle
        ↓
Shift-right attack validation
```

For each stage, the aim is to go beyond `terraform apply`.

The workflow will be:

```text
Understand the threat
      ↓
Predict the expected behavior
      ↓
Deploy
      ↓
Inspect effective state
      ↓
Attempt the unsafe behavior
      ↓
Observe the control
      ↓
Capture evidence
      ↓
Remediate any test drift
      ↓
Explain the result
```

The negative test is important.

If an Organization Policy is intended to prevent service-account key creation, I want evidence from an actual attempt to create the key. If country network isolation is a design requirement, I want a deliberate cross-boundary connection attempt. If Cloud Armor is promoted from preview to enforcement, I want the request and log evidence that demonstrate the change.

---

## What I am not claiming yet

At the time of writing, the project does **not** claim that:

- the complete Terraform hierarchy has been applied to a live Google Cloud organization;
- Workload Identity Federation token exchange and service-account impersonation have been live-validated;
- the country networks have been tested against real cross-country connectivity attempts;
- Cloud SQL backup/restore and storage recovery have been exercised;
- centralized logging and security detections have been triggered in the deployed environment;
- DNS, certificates, Cloud Armor, and origin-bypass controls have been proven against live traffic;
- Cloud Asset Inventory or Security Command Center are feeding operational posture findings;
- the project has accumulated genuine operational SLA/trend history.

Those are not missing footnotes. They are the next engineering tasks.

---

## Why I am writing the engineering notes publicly

The repository contains implementation detail. These notes will contain the reasoning behind it.

For each major stage I want to be able to explain:

- what the security problem was;
- which trust boundary mattered;
- why the chosen design was appropriate;
- what alternatives existed;
- where the control is actually enforced;
- how the control was tested;
- what happened when it was deliberately broken; and
- what evidence still remains missing.

If I cannot explain those things clearly, then I do not understand the control deeply enough yet.

That is the standard I want this series to enforce.

---

## What comes next

The next engineering note will start at the root of Google Cloud governance:

**Organization, billing account, folders, projects, IAM principals, and the difference between resource hierarchy and billing hierarchy.**

No workload deployment yet.

Before Terraform manages the environment, I want to understand exactly what Terraform is about to manage — and where the security boundaries actually begin.

That will be **Engineering Note 01: Understanding the Google Cloud Resource and Governance Hierarchy**.
