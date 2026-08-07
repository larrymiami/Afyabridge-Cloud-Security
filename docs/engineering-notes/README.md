# AfyaBridge Engineering Notes

This directory contains technical engineering notes produced while designing, implementing, validating, and operating the AfyaBridge Cloud Security project.

These notes are not intended to be step-by-step cloud tutorials. Their purpose is to document engineering reasoning: the problem being solved, the threat or failure mode behind a control, the design choice, rejected alternatives, implementation details, validation evidence, and lessons from deliberately testing or breaking the control.

## Publishing standard

A note is ready to publish when it can answer the following questions clearly:

1. **Problem** — What engineering or security problem are we solving?
2. **Threat** — What can go wrong if the problem is ignored?
3. **Design** — What architecture or control did AfyaBridge choose?
4. **Trade-off** — What alternatives were considered, and why were they not selected?
5. **Implementation** — How is the design expressed in code, Terraform, Google Cloud, or CI/CD?
6. **Validation** — How was the intended behavior proven?
7. **Failure mode** — What happened when the control was deliberately misconfigured, bypassed, or stressed?
8. **Evidence** — What repeatable artifact supports the claim?
9. **Boundary** — What has *not* yet been proven?
10. **Interview test** — Could the author explain and defend the decision without reading the repository?

## Evidence-first rule

Claims should be proportional to the evidence available.

Examples:

- Terraform configuration can prove **repository desired state**.
- A successful CI policy test can prove a **repository enforcement path**.
- A live Google Cloud denial can prove a **runtime/effective control behavior** for the tested condition.
- A synthetic finding lifecycle test does **not** prove that Security Command Center is operating in a live environment.

The notes should preserve these distinctions instead of collapsing designed, implemented, CI-enforced, and live-validated states into one claim.

## Note lifecycle

```text
Learn
  ↓
Build
  ↓
Predict
  ↓
Validate
  ↓
Break
  ↓
Observe
  ↓
Remediate
  ↓
Capture evidence
  ↓
Explain
  ↓
Publish
```

Raw lab observations may be messy. Published engineering notes should not be.

## Series

| # | Engineering note | Status |
|---|---|---|
| 00 | Building AfyaBridge: Designing a Production-Style Cloud Security Platform on Google Cloud | Draft |
| 01 | Understanding the Google Cloud Resource and Governance Hierarchy | Planned |
| 02 | Bootstrapping Terraform Securely on Google Cloud | Planned |
| 03 | Designing a Multi-Country Google Cloud Landing Zone | Planned |
| 04 | Keyless GitHub Actions Authentication with Workload Identity Federation | Planned |
| 05 | Country Isolation with Shared VPC | Planned |
| 06 | Securing Cloud Run, Cloud SQL, Secret Manager, KMS, and Storage | Planned |
| 07 | Building Security Detections from Google Cloud Audit Logs | Planned |
| 08 | Cloud Armor: Preview-First WAF Deployment and Origin Protection | Planned |
| 09 | Detecting and Remediating Terraform Drift | Planned |
| 10 | Governing a Real Cloud Security Finding from Detection to Closure | Planned |
| 11 | Building and Attacking a Production-Style Multi-Country GCP Platform | Planned |

## Files

- [`TEMPLATE.md`](./TEMPLATE.md) — reusable structure for future engineering notes.
- [`00-building-afyabridge-cloud-security.md`](./00-building-afyabridge-cloud-security.md) — the opening article for the series.
