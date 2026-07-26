# Identity Flow

## Purpose

This diagram shows the primary authentication and authorization flows for workforce users, application users, workloads, CI/CD pipelines, external integrations, and emergency operators.

```mermaid
flowchart LR
    subgraph HUMAN[Human identities]
        WF[Workforce user]
        APPUSER[Application user]
        EXTUSER[Approved external user]
        BREAK[Emergency operator]
    end

    subgraph AUTHORITIES[Identity authorities]
        DIR[Cloud Identity or Google Workspace]
        APPIDP[Application identity provider]
        EXTDIR[Approved external identity source]
        BREAKREG[Emergency identity register]
    end

    subgraph ACCESS[Authorization and session controls]
        GROUPS[Managed workforce groups]
        GCPIAM[Google Cloud IAM]
        APPSESSION[Application session service]
        APPAUTHZ[Application authorization layer]
        PAM[Temporary privileged-access process]
    end

    subgraph DELIVERY[Software delivery identity]
        GHUSER[GitHub workforce identity]
        GHA[GitHub Actions workflow]
        OIDC[GitHub OIDC token]
        WIF[Workload Identity Federation]
        DEPLOYSA[Environment-specific deployment service account]
    end

    subgraph RUNTIME[Runtime identities]
        RUNTIMESA[Dedicated workload service account]
        GCPAPI[Google Cloud services]
        INTERNALAPI[Internal AfyaBridge APIs]
        DATA[Country-scoped data services]
    end

    subgraph AUDIT[Audit and monitoring]
        IDLOGS[Authentication and identity logs]
        IAMLOGS[IAM and impersonation audit logs]
        APPLOGS[Application authorization events]
        ALERTS[Security detections and alerts]
    end

    WF -->|authenticate with MFA| DIR
    DIR --> GROUPS
    GROUPS -->|group membership| GCPIAM
    GCPIAM -->|allow or deny| GCPAPI

    WF --> GHUSER
    GHUSER -->|reviewed workflow change| GHA
    GHA --> OIDC
    OIDC -->|restricted claims| WIF
    WIF -->|short-lived impersonation| DEPLOYSA
    DEPLOYSA -->|approved deployment actions| GCPAPI

    APPUSER -->|authenticate| APPIDP
    APPIDP -->|signed token or session| APPSESSION
    APPSESSION --> APPAUTHZ
    APPAUTHZ -->|role + country + programme + assignment checks| INTERNALAPI
    INTERNALAPI --> DATA

    EXTUSER --> EXTDIR
    EXTDIR -->|federated or sponsored access| GCPIAM

    BREAK --> BREAKREG
    BREAKREG -->|strong authentication and declared incident| PAM
    PAM -->|time-bound elevation| GCPIAM

    RUNTIMESA -->|least-privilege API calls| GCPAPI
    RUNTIMESA --> INTERNALAPI
    GCPAPI --> DATA

    DIR --> IDLOGS
    APPIDP --> IDLOGS
    WIF --> IAMLOGS
    GCPIAM --> IAMLOGS
    DEPLOYSA --> IAMLOGS
    APPAUTHZ --> APPLOGS
    PAM --> IAMLOGS

    IDLOGS --> ALERTS
    IAMLOGS --> ALERTS
    APPLOGS --> ALERTS
```

## Control interpretation

### Workforce flow

1. A workforce user authenticates through the organizational directory using MFA.
2. Managed group membership determines eligible cloud roles.
3. Google Cloud IAM evaluates inherited and resource-level policy.
4. Authentication, group changes, and IAM decisions produce audit data.

### CI/CD flow

1. A reviewed GitHub Actions workflow receives an OIDC token.
2. Workload Identity Federation validates repository, branch, workflow, and environment claims.
3. The workflow impersonates a dedicated, environment-specific deployment service account.
4. Credentials are short-lived and no service-account key is stored in GitHub.

### Application-user flow

1. A CHW, supervisor, facility worker, or programme administrator authenticates through the application identity provider.
2. The backend validates the token and session state.
3. The authorization layer evaluates role, country, programme, geographic assignment, and requested action.
4. Data services receive requests only after server-side authorization succeeds.

### Workload flow

Each deployable service runs as a dedicated service account. Its cloud and internal API access is limited to the exact services, projects, countries, and operations required by the workload.

### Emergency flow

Emergency identities remain isolated from routine administration. Use requires a declared incident or approved recovery activity, strong authentication, temporary elevation, immediate alerting, and post-use review.

## Deny conditions

Access must be denied when:

- the identity is disabled or expired;
- required MFA or authentication assurance is absent;
- the user lacks the required managed-group membership;
- the requested environment or country is outside the approved scope;
- an application token has invalid issuer, audience, signature, expiry, or session state;
- application role or assignment checks fail;
- OIDC claims do not match the approved repository, workflow, branch, or environment;
- a workload attempts an operation outside its service-account permissions;
- emergency elevation lacks the required incident or approval record.

## Related documents

- [`../identity/README.md`](../identity/README.md)
- [`../identity/identity-domains.md`](../identity/identity-domains.md)
- [`../identity/workforce-access.md`](../identity/workforce-access.md)
- [`../landing-zone/bootstrap-and-state.md`](../landing-zone/bootstrap-and-state.md)
- [`../../threat-model/trust-boundaries.md`](../../threat-model/trust-boundaries.md)