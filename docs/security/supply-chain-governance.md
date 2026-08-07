# Supply-chain governance, revocation, and compromise testing

## Purpose

AfyaBridge treats software supply-chain trust as a lifecycle rather than a one-time signature. A build can be correctly signed and still become untrusted later because its source, dependency set, workflow identity, or artifact is discovered to be compromised.

This document defines the repository controls for dependency risk, evidence retention, revocation, and compromise testing implemented in v0.9D.

## Dependency risk policy

### Monitored dependency classes

`.github/dependabot.yml` schedules weekly version-update checks for:

- npm/pnpm application dependencies;
- GitHub Actions workflow dependencies;
- Docker base images; and
- Terraform providers across bootstrap and environment roots.

Non-major updates are grouped to reduce review noise while still keeping routine patch and minor updates visible. Major updates remain separate review events because they can change compatibility and security assumptions more substantially.

The Dependabot configuration is a version-update control. Dependabot alerts and automatic security-update behavior also depend on repository security settings and are not claimed as enabled merely because this file exists.

### Admission gates

Dependency updates still pass the existing pull-request security gates:

- Dependency Review blocks newly introduced dependencies with `high` or greater known vulnerability severity.
- The reviewed license deny list rejects selected AGPL/GPL-3.0 licenses.
- Trivy filesystem scanning blocks fixable `HIGH` and `CRITICAL` repository dependency findings.
- Trivy image scanning applies the same severity gate to the built container image.
- External GitHub Actions remain full-commit-SHA pinned by the supply-chain workflow.
- Docker base images remain digest pinned by the supply-chain identity/build validator.
- Terraform provider selections remain constrained by committed lockfiles where the Terraform roots use them.

A dependency update is therefore not trusted merely because Dependabot proposed it. It must still satisfy repository tests, security gates, supply-chain invariants, and normal review.

### Exceptions

Security exceptions continue to use `security/exceptions.json` and the existing exception validator. Exceptions are time bounded, require a separate owner and approver, include compensating controls, and link to a GitHub issue or pull request.

The exception registry does not silently suppress scanners. Where a scanner still blocks, any explicit scanner-specific suppression must be separately visible and reviewed. This prevents an exception record from becoming an implicit global bypass.

## Evidence retention policy

Different artifacts have different operational value and exposure:

| Evidence | Retention | Rationale |
|---|---:|---|
| Saved Terraform apply plan | 1 day | High-value deployment input that should exist only long enough for the protected apply transition. |
| Unsigned build/SBOM evidence | 30 days | Useful for pull-request troubleshooting and short-term reconstruction without retaining large image archives indefinitely. |
| Security-gate evidence | 30 days | Supports review and near-term audit of scanner/policy outcomes. |
| Signed provenance/verification evidence | 90 days | Higher-value trust evidence retained longer for investigation and portfolio/audit reconstruction. |

`validate-supply-chain-governance.mjs` fails if these reviewed retention contracts drift.

The 90-day provenance package includes the compact build context needed after the larger 30-day image archive expires: build metadata, the original build checksum manifest, the image SPDX SBOM, signing/attestation bundles, verification results, and revocation decisions.

Retention is not the same as trust. An artifact still inside its retention window can be revoked; an expired workflow artifact does not invalidate cryptographic transparency evidence that may exist elsewhere.

## Trusted-source signing policy

Pull-request code is allowed to exercise the unprivileged build/SBOM path, but it is not allowed to obtain the supply-chain signing identity.

The provenance job is gated to a `push` event on `refs/heads/main`. Its Cosign certificate identity is fixed to the `supply-chain.yml` workflow on `refs/heads/main`, and GitHub attestation verification additionally constrains the source ref and exact source commit digest.

This boundary was strengthened during the reviewer pass for PR #15. The earlier implementation successfully demonstrated keyless signing mechanics on a pull-request merge ref, but that also showed an important trust problem: a PR-controlled workflow could legitimately sign under a `refs/pull/.../merge` workflow identity. The current design removes that privileged PR path. PR CI now validates that the signer remains main-only, while the first trusted-main signing run is expected after the reviewed change reaches `main`.

Because `main` is the signing trust anchor, repository rules should require reviewed changes and prevent unreviewed direct pushes. Workflow code cannot itself prove those repository settings, so branch/ruleset configuration remains an operational prerequisite to verify separately.

## Revocation model

### Why a revocation layer exists

Sigstore keyless certificates and GitHub artifact attestations prove that an identity made a statement about artifact bytes. They do not answer the later question: **do we still trust that artifact, source, or workflow?**

AfyaBridge therefore maintains `security/supply-chain-revocations.json` as an explicit deny registry. The registry can revoke:

- an exact `sha256:` artifact digest;
- a full source commit SHA; or
- an exact GitHub Actions workflow certificate identity.

Every entry requires a unique `SC-REV-YYYY-NNN` identifier, substantive reason, revocation date, owner, and linked GitHub issue or pull request.

### Enforcement

The supply-chain build job validates the registry and snapshots it into the checksummed handoff evidence.

On a trusted-main signing run, the signing/provenance job then:

1. verifies the build handoff and confirms the checked-out registry matches the checksummed snapshot;
2. checks the exact `main` source commit, exported artifact digest, and fixed `main` workflow identity against the revocation registry **before** signing;
3. performs Cosign and GitHub attestation verification, including source-ref and source-digest constraints; and
4. checks the same trust subjects against the revocation registry again after cryptographic verification.

The revocation checker records explicit `ALLOW <kind> <value>` evidence for each evaluated subject, making the trust decision reconstructable rather than recording only a count.

This deliberately separates two questions:

- **cryptographic validity:** was the artifact signed/attested by the expected trusted-main workflow identity and exact source revision?
- **current trust:** has that artifact, source, or workflow identity subsequently been denied by policy?

Both must pass.

### Incident use

If a build or signing path is suspected compromised:

1. stop deployment/promotion of the affected artifact;
2. identify the narrowest trustworthy revocation subject: artifact digest, source commit, workflow identity, or more than one;
3. open a tracked incident/remediation issue;
4. add the revocation entry through review;
5. remove or disable compromised workflow/deployment privileges as appropriate;
6. rebuild from reviewed source after remediation rather than re-signing the old bytes;
7. verify the replacement artifact and update deployment references; and
8. preserve affected bundles, SBOMs, logs, and incident evidence for investigation.

Revocation entries are deny records. Removing one is a security-sensitive policy change and must itself receive review; the normal response to a compromised artifact is to produce a new artifact, not to erase evidence of the old one.

## Compromise tests

`scripts/test-supply-chain-compromise-controls.mjs` creates temporary repository fixtures and proves the controls fail closed under deliberate mutations.

The current negative scenarios include:

- granting GitHub OIDC permission to the unprivileged build/SBOM job;
- expanding the provenance job beyond trusted pushes to `refs/heads/main`;
- granting registry write permission to the signing/provenance job;
- rebuilding the artifact inside the privileged signing job;
- removing the build-to-sign SHA-256 handoff verification;
- weakening GitHub attestation source-ref verification;
- replacing the fixed `main` signer identity with a dynamic execution ref;
- allowing empty Cosign verification evidence;
- replacing the dedicated Cloud Run runtime service-account binding;
- shortening signed provenance evidence retention below the reviewed policy;
- removing GitHub Actions from dependency monitoring; and
- attempting to trust a synthetically revoked source commit.

A clean control fixture and a non-revoked synthetic source must continue to pass. The test suite therefore demonstrates both deny and allow behavior instead of only checking for expected failures.

## Evidence produced by v0.9D

The unsigned build evidence package contains:

- identity-boundary validation output;
- dependency/retention governance validation output;
- revocation-registry validation output;
- compromise-test output;
- a snapshot of the revocation policy;
- repository and image CycloneDX/SPDX SBOMs;
- build metadata; and
- SHA-256 checksums for the evidence and exported image archive.

On trusted-main runs, the signed provenance package additionally contains:

- pre-sign and post-verification revocation decisions with exact evaluated subjects;
- the Cosign Sigstore bundle;
- non-empty Cosign workflow-identity verification output;
- GitHub build-provenance and SPDX SBOM attestation bundles;
- GitHub attestation verification output constrained to source ref and digest;
- a copy of build metadata, the build checksum manifest, and image SPDX SBOM; and
- SHA-256 checksums for the signing evidence.

## Current boundary

v0.9D implements repository-level dependency monitoring policy, evidence-retention contracts, trusted-main signing policy, revocation decisions, and negative compromise tests. It does not yet provide a live Artifact Registry quarantine mechanism, Binary Authorization/deployment admission policy, live Cloud Run digest denial, organization-wide artifact inventory/revocation service, or independent verification of GitHub branch/ruleset settings.

Those controls depend on repository operations and the live Google Cloud deployment path and remain part of later deployment/runtime validation. The current revocation registry is therefore a repository trust-policy layer that complements — but does not replace — future registry and runtime enforcement.
