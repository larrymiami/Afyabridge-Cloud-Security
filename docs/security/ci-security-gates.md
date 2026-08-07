# CI security gates

## Purpose

The `Security gates` workflow provides shift-left controls for pull requests and `main`. It is designed to fail changes that violate explicit repository security thresholds while preserving evidence for review.

## Gate matrix

| Gate | Control | Enforcement in workflow |
|---|---|---|
| Secret scanning | Gitleaks scans repository history | Scanner finding fails the job |
| Dependency review | New dependency vulnerabilities | High and critical additions fail the job |
| License review | New dependency licenses | AGPL-3.0 and GPL-3.0 additions listed in the workflow fail the job |
| CodeQL | JavaScript/TypeScript and Actions static analysis | Analysis and SARIF publication; repository code-scanning/merge rules determine alert-based merge blocking |
| IaC scan | Trivy Terraform misconfiguration scan | High and critical findings fail the job |
| Package scan | Trivy repository dependency scan | Fixed high and critical vulnerabilities fail the job |
| Container scan | Build and Trivy scan of the web runtime image | Fixed high and critical vulnerabilities fail the job |
| API contract | OpenAPI 3.1 and implementation drift | Contract or route drift fails the job |
| Policy as code | OPA/Rego repository invariants | Any `deny` result fails the job |
| Exceptions | Time-bounded exception registry | Invalid, duplicate, overlong, or expired entries fail the job |

`ignore-unfixed: true` is deliberate for Trivy vulnerability gates: a change is blocked where a fixed version exists, while unfixable upstream findings remain visible through scanner output and must be tracked rather than creating an impossible remediation gate.

## Policy-as-code invariants

The OPA policy pack currently rejects:

- `pull_request_target` workflow triggers;
- unpinned third-party actions in the security workflow;
- root final container users;
- package-manager/build tooling in the final runtime stage;
- `latest` container base tags;
- Terraform primitive IAM roles;
- Terraform public principals; and
- authoritative Terraform IAM policy resources.

The repository fact builder converts workflows, Dockerfiles, and Terraform source into structured JSON before OPA evaluates it. Rego unit tests cover both compliant and denied examples.

## API contract gate

`contracts/openapi/afyabridge-api.openapi.json` is the contract for the implemented Next.js API surface. CI compares exported route methods with OpenAPI operations in both directions. Protected routes must declare the `ActorContext` security scheme and documented authentication/server-error responses.

This is a static contract gate. It does not prove that a deployed API behaves exactly as documented; dynamic contract and authenticated API testing belongs to shift-right validation.

## Evidence

The final evidence job runs with `if: always()` after the security jobs. It writes:

- `security-gates.json` for machine processing; and
- `security-gates.md` for human review and the GitHub job summary.

The artifact records repository, workflow, run, attempt, event, ref, commit, generation time, individual gate results, and an overall pass/fail result. Artifacts are retained for 30 days.

## Boundaries

A green workflow means the reviewed revision passed the configured static gates. It does not establish live Google Cloud deployment security, runtime exploit resistance, complete vulnerability coverage, or the absence of unknown vulnerabilities. Scanner configuration, repository protection settings, and exception handling remain reviewable security controls themselves.
