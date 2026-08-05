# Application Security Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Community health worker
    participant Browser as Web client
    participant Edge as Managed HTTPS edge
    participant App as Next.js application
    participant AuthN as Authentication boundary
    participant AuthZ as Authorization policy
    participant Repo as Scoped repository
    participant DB as Country database
    participant Audit as Audit sink

    User->>Browser: Submit household request
    Browser->>Edge: HTTPS request
    Edge->>App: Forward authenticated request
    App->>App: Assign request ID and validate shape
    App->>AuthN: Verify trusted actor assertion

    alt Missing or invalid assertion
        AuthN-->>App: Authentication denied
        App->>Audit: Record denial without payload
        App-->>Browser: Generic 401, no-store
    else Authenticated
        AuthN-->>App: Typed actor and server-derived scope
        App->>AuthZ: Evaluate role and resource scope

        alt Policy denied
            AuthZ-->>App: Deny with internal reason
            App->>Audit: Record policy denial
            App-->>Browser: Generic 403, no-store
        else Policy allowed
            AuthZ-->>App: Allow
            App->>Repo: Execute scoped operation
            Repo->>DB: Parameterized query with country, programme, facility, assignment predicates

            alt Missing, inaccessible, or conflicting record
                DB-->>Repo: No row or conflict
                Repo-->>App: Non-enumerating result
                App->>Audit: Record outcome
                App-->>Browser: Generic 404 or 409
            else Successful operation
                DB-->>Repo: Scoped result
                Repo-->>App: Minimal domain result
                App->>Audit: Record successful sensitive action
                App-->>Browser: Minimal response, no-store
            end
        end
    end
```

## Security properties

- The client does not select its authoritative country or authorization scope.
- Authentication produces a typed actor context before business logic runs.
- Authorization is evaluated before repository access.
- Repository queries repeat the country and assignment restrictions.
- Missing and inaccessible resources are intentionally difficult to distinguish.
- Audit events contain identifiers and outcomes, not Restricted payloads.
- Sensitive responses are not cached.
- Unexpected failures are translated to stable generic responses.

## Current limitation

The repository currently uses `x-afyabridge-actor` as a local integration seam. Production deployment must replace it with an integrity-protected assertion issued by a trusted authentication component and must strip client-supplied identity headers at the edge.
