# ADR-005: Workload Identity Model

- Status: Accepted
- Date: 2026-07-25
- Decision owners: Platform Engineering and Security
- Related objectives: `IAM-02`, `IAM-03`, `IAM-04`, `IAM-05`, `CICD-01`, `CICD-02`, `CICD-03`
- Related threats: `TH-004`, `TH-006`, `TH-013`, `TH-014`

## Context

AfyaBridge workloads include Cloud Run services, scheduled jobs, database migrations, security automation, logging integrations, and GitHub Actions deployment workflows. These components need access to Google Cloud resources while preserving country isolation, environment separation, and traceability.

Long-lived service-account keys create material risk because they can be copied, committed to repositories, retained after role changes, and used outside the expected runtime. Reusing a small number of broad service accounts would also increase lateral-movement impact and make audit records ambiguous.

## Decision

AfyaBridge uses dedicated, keyless workload identities.

Each deployable runtime, job, migration process, shared service, and deployment boundary receives a dedicated service account appropriate to its environment, country, and purpose.

Google-managed runtimes use attached service accounts and short-lived credentials. GitHub Actions authenticates through Workload Identity Federation and impersonates an environment- and country-specific deployment service account.

Service-account key creation and upload are prohibited. Service-to-service authentication uses signed short-lived identity tokens with explicit audience validation where supported.

Production and non-production do not share runtime or deployment service accounts. Kenya, Ghana, and South Africa production workloads use separate identities.

## Rationale

This model provides:

- short-lived credentials;
- attributable workload activity;
- limited compromise blast radius;
- explicit country and environment boundaries;
- simpler revocation and rotation;
- stronger CI/CD trust conditions;
- reduced secret-storage requirements;
- clearer least-privilege analysis.

## Alternatives considered

### Downloadable service-account keys

Rejected because keys are long-lived bearer credentials, are difficult to constrain to a runtime, and increase leakage and rotation risk.

### One service account per environment

Rejected because it combines unrelated permissions, obscures actor identity, and increases lateral-movement impact.

### One service account for all production countries

Rejected because it undermines country isolation and creates unnecessary cross-country privilege.

### Human credentials in deployment workflows

Rejected because automation must not depend on personal accounts, interactive sessions, or credentials whose lifecycle is tied to an individual employee.

### GitHub secrets containing cloud credentials

Rejected in favor of federation because stored credentials remain susceptible to theft, accidental disclosure, and delayed rotation.

## Consequences

### Positive

- No static cloud credential is required for normal runtime or deployment operations.
- Audit logs identify the workload or deployment identity involved.
- Permissions can be reviewed and removed per workload.
- Compromise of one workload does not automatically grant access to other workloads or countries.
- Repository, branch, workflow, and environment claims can constrain CI/CD authentication.

### Negative

- The number of service accounts and IAM bindings increases.
- Identity ownership and lifecycle metadata must be maintained.
- Cross-project access requires explicit impersonation and role bindings.
- Incorrect federation conditions can block deployments or admit unintended workflows.
- Local debugging requires controlled impersonation rather than copied keys.

## Constraints

- Runtime and deployment identities are separate.
- Database migration identities are separate from standard runtime identities.
- A service account must not manage its own IAM policy.
- Basic `Owner` and `Editor` roles are prohibited for workload identities.
- Human users do not routinely use workload service accounts.
- Production deployers are separated by country.
- External workload federation requires explicit issuer, audience, repository, branch, workflow, and environment restrictions as applicable.
- Token-creation permissions are narrowly scoped and monitored.

## Validation

The decision is validated when:

- no active service-account keys exist for managed workloads;
- non-production identities cannot modify production;
- one country's workloads cannot access another country's production data;
- unapproved repositories, branches, or workflows cannot impersonate deployment identities;
- runtime identities cannot perform deployment administration;
- service-to-service requests reject incorrect audiences;
- disabled or retired identities can no longer obtain effective access.

## Review triggers

Review this decision when:

- the runtime platform changes materially;
- a new external CI/CD provider is adopted;
- cross-cloud or on-premises workloads require federation;
- a service requires a credential type that cannot use federation;
- an identity-related incident reveals an unacceptable impersonation or lateral-movement path.
