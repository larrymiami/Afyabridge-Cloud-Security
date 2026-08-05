# Authorization Flow

```mermaid
sequenceDiagram
    autonumber
    participant C as Client
    participant E as Trusted edge or identity proxy
    participant W as Next.js route
    participant A as Authentication package
    participant V as Request validation
    participant P as Authorization policy
    participant D as Country-scoped data boundary
    participant L as Audit sink

    C->>E: HTTPS request and session credential
    E->>E: Authenticate caller
    E->>W: Request with protected actor assertion
    W->>A: Parse and validate actor context

    alt Missing, malformed, or cross-country actor scope
        A-->>W: AuthenticationError
        W-->>C: 401 generic response
    else Actor authenticated
        A-->>W: AuthenticatedActor
        W->>V: Validate body, path, and query input

        alt Invalid request
            V-->>W: Validation failure
            W->>L: Record failed operation without payload
            W-->>C: 400 generic validation response
        else Valid request
            V-->>W: Normalized resource attributes
            W->>P: Evaluate action, role, country, programme, facility, assignment

            alt Denied
                P-->>W: Deny with internal reason
                W->>L: Record denied decision and request ID
                W-->>C: 403 generic response
            else Allowed
                P-->>W: Allow
                W->>D: Execute country- and programme-scoped operation
                D-->>W: Result
                W->>L: Record successful sensitive action
                W-->>C: Minimal no-store response
            end
        end
    end
```

## Security properties

- The client cannot establish its own trusted actor context.
- Authentication precedes authorization.
- Validation precedes the protected operation.
- Role permissions and resource attributes are evaluated together.
- Country and programme checks occur before data access.
- Audit events correlate the actor, request, action, outcome, and resource without recording Restricted payloads.
- Failure responses do not disclose internal policy reasons.
