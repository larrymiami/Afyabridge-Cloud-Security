# Secrets Management

## Purpose

This document defines how AfyaBridge creates, stores, distributes, rotates, revokes, and monitors secrets used by applications, infrastructure automation, operators, and third-party integrations.

Secrets include passwords, API keys, webhook signing material, private keys, database credentials, client secrets, recovery tokens, and any value that can authenticate a principal or decrypt protected data.

## Design principles

- Secrets are never stored in source code, container images, Terraform variables committed to version control, documentation, tickets, chat, or local configuration files.
- Workload identity is preferred over static credentials.
- Secret access is granted to workload identities, not broad project roles.
- Production and non-production secrets are separate.
- Country production environments do not share application secrets.
- Secret values are retrievable only by principals with a documented operational need.
- Rotation is planned before the first secret is issued.
- Revocation must be possible without rebuilding the entire platform.
- Secret access and administrative changes are logged and reviewed.

## Secret classes

| Class | Examples | Default handling |
|---|---|---|
| Runtime secret | database password, partner API token | Stored in an approved managed secret service and fetched by a workload identity |
| Signing material | webhook secret, token-signing key | Stored in an approved managed secret or key-management service with restricted use |
| Human recovery secret | break-glass recovery code | Escrowed under two-person control and tested periodically |
| Deployment secret | exceptional third-party deployment credential | Restricted to the deployment identity and removed when federation is possible |
| Device bootstrap secret | one-time enrollment token | Short-lived, single-use, and invalid after successful enrollment |

## Preferred authentication order

1. Native workload identity with short-lived credentials.
2. Federated identity with audience and subject restrictions.
3. Service-account impersonation with short-lived tokens.
4. Managed secret containing a renewable credential.
5. Static credential only when the external system provides no safer option.

The use of a static secret requires a named owner, expiry or review date, rotation runbook, revocation test, and documented replacement plan.

## Storage model

Production secrets are stored in country- and environment-scoped secret stores. Secret names identify the owning system and purpose but do not disclose the secret value or sensitive business context.

Recommended naming structure:

```text
afyabridge-{country}-{environment}-{workload}-{purpose}
```

Examples:

```text
afyabridge-ke-prod-referral-partner-token
afyabridge-gh-prod-api-database-password
afyabridge-za-prod-webhook-signing-secret
```

Secret replication locations must comply with the data-residency design. A globally replicated secret is not used when its value or associated metadata creates an unacceptable cross-border dependency.

## Access model

- Each workload receives access only to the specific secret versions it needs.
- Deployment identities may configure secret references but do not routinely read production values.
- Human read access is exceptional, temporary, approved, and logged.
- Secret administration and secret consumption are separated where practical.
- Security investigators may review metadata and access logs without retrieving values.
- Support operators do not receive production secret access by default.
- Third parties never receive broad access to the AfyaBridge secret store.

## Runtime delivery

Applications receive secrets through managed runtime integration or a controlled API call using their workload identity. Secret values are held in memory only as long as needed.

Applications must not:

- write secret values to logs;
- expose secrets through health endpoints, error pages, traces, or metrics;
- pass secrets through command-line arguments when a safer mechanism exists;
- persist secrets to local disk without explicit design approval;
- return secret values to client applications;
- include secrets in generated support bundles.

## Versioning and rotation

Every secret has an owner, consumer list, rotation method, maximum age, and emergency revocation procedure.

Rotation follows this pattern:

1. Create a new secret version or replacement credential.
2. Validate that the provider and AfyaBridge can support overlap.
3. Update consumers to accept or use the new value.
4. Confirm successful authentication and application health.
5. Disable or revoke the old credential.
6. Verify that no workload still depends on it.
7. Record the evidence and next rotation date.

For secrets that cannot overlap, rotation requires a maintenance or controlled cutover plan.

## Suggested rotation targets

| Secret type | Design target |
|---|---|
| Database password used by an application | 90 days or shorter where operationally supported |
| Third-party API credential | Provider maximum or 90 days, whichever is shorter |
| Webhook signing secret | 180 days with dual-secret validation during transition |
| Human recovery secret | After every use and at least annually |
| One-time enrollment token | Minutes to hours; invalid after use |
| Long-lived exceptional deployment credential | 30 days and active migration to federation |

These are architecture targets, not claims of implemented schedules.

## Emergency revocation

A suspected secret exposure triggers:

1. identification of the affected secret and consumers;
2. immediate disablement or revocation where safe;
3. issuance of a replacement value;
4. consumer update and health validation;
5. review of access logs, repository history, CI logs, and runtime telemetry;
6. assessment of actions performed with the exposed credential;
7. incident documentation and control improvement.

Revocation procedures are tested with synthetic or non-production credentials before relying on them in production.

## CI/CD controls

- GitHub Actions uses Workload Identity Federation rather than stored cloud service-account keys.
- Repository secrets are avoided for cloud authentication.
- Third-party pipeline secrets are environment-scoped and restricted to protected workflows.
- Pull requests from untrusted forks cannot access production secrets.
- Secret values are masked, but masking is not treated as prevention.
- Workflow permissions are minimal and pinned actions are preferred.
- Secret-scanning failures block promotion until investigated.

## Local development

Developers use synthetic data and non-production credentials. Production secret values must not be copied to developer laptops.

Local tooling uses:

- developer-specific non-production identities;
- short-lived access;
- local environment files excluded from version control only when no managed development integration exists;
- automatic secret scanning before commit and in CI.

## Third-party secrets

Partner credentials require:

- a named internal owner;
- a named external contact;
- documented allowed operations;
- country and environment scope;
- provider-side restrictions where available;
- expiry and rotation dates;
- a revocation contact and test procedure;
- monitoring for abnormal use.

## Monitoring and evidence

Required telemetry includes:

- secret creation, deletion, disablement, and version changes;
- IAM changes affecting secret access;
- human reads of production secret values;
- denied secret access;
- unusual access by a workload or from a new execution context;
- access to secrets outside the owning country or environment;
- secrets exceeding their rotation target;
- disabled consumers still attempting to use old values.

Evidence for implementation includes configuration, IAM policy, access logs, rotation results, revocation tests, and secret-scanning results.

## Prohibited patterns

- Service-account private keys stored as secrets for routine cloud access.
- Shared production credentials across countries.
- One secret granting access to unrelated systems.
- Permanent human read access to all production secrets.
- Secrets embedded in mobile or browser applications.
- Credentials copied from production into non-production.
- Logging secret values for troubleshooting.
- Treating base64 encoding as encryption.

## Validation requirements

Before this design is marked implemented, validation must demonstrate:

1. workloads can retrieve only their approved secrets;
2. human production reads require temporary approved access;
3. old versions can be revoked without unexplained outages;
4. CI does not use long-lived cloud keys;
5. repository and image scanning detects seeded test secrets;
6. secret values are absent from application logs and traces;
7. country and environment boundaries are enforced;
8. secret-access alerts reach the assigned owner.

## Status

**Designed.** No secret store, access policy, rotation schedule, scanning control, or alert is considered implemented until configuration, tests, and evidence exist.
