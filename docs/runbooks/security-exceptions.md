# Security exception runbook

## Objective

Security exceptions are temporary, reviewed risk decisions. They are not an alternate path around CI and they do not automatically suppress scanner findings.

## Required record

Every active entry in `security/exceptions.json` must contain:

- an ID in `SEC-EX-YYYY-NNN` format;
- the affected security gate;
- precise technical scope;
- a substantive risk rationale;
- one or more compensating controls;
- a named owner;
- an independent approver;
- a GitHub issue or pull-request tracking URL;
- creation date; and
- expiry date.

The maximum exception lifetime is 90 days. Expired entries fail CI.

## Process

1. Open a GitHub issue describing the finding, affected asset/change, business or engineering constraint, exploitability, proposed compensating controls, remediation owner, and target remediation date.
2. Obtain approval from someone other than the exception owner.
3. Add the exception record to `security/exceptions.json` in a reviewed pull request.
4. Where a scanner requires a product-specific ignore or suppression, make that configuration change explicitly in the same or a separately reviewed pull request and reference the exception ID. The registry by itself never changes scanner behavior.
5. Confirm the exception validation gate passes and that unrelated security gates remain enforced.
6. Remediate before expiry, remove any scanner-specific suppression, and delete the registry entry.
7. If an extension is required, reassess the risk and create a new reviewed approval. Do not silently extend an expired record.

## Emergency handling

An urgent production-security response may require a temporary mitigation before the normal review cycle completes. The technical mitigation should minimize scope and duration, and the exception record and review must be completed as soon as the repository workflow permits. Emergency handling does not convert a temporary suppression into permanent policy.

## Review criteria

Approvers should reject exceptions that have vague scope, no compensating control, no credible remediation path, an owner who is also the approver, or an expiry longer than 90 days. High-impact exceptions involving authentication, country isolation, public access, deployment identity, secret exposure, or encryption require explicit security review before any suppression is introduced.

## Evidence

The exception registry is version-controlled and CI-validated. Security gate evidence captures whether exception validation passed for each workflow run, while Git history and the linked issue or PR provide the approval and remediation trail.
