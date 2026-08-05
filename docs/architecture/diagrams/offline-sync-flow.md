# Offline Synchronization Security Flow

```mermaid
sequenceDiagram
    autonumber
    actor CHW as Community Health Worker
    participant Device as Registered Offline Device
    participant Edge as Authenticated Sync Endpoint
    participant Policy as Sync Validation and Authorization
    participant DB as Country Database
    participant Worker as Sync Worker
    participant Audit as Audit Sink

    CHW->>Device: Create or update synthetic household record
    Device->>Device: Queue operation with operationId, sequence, baseVersion
    Device->>Edge: Send encrypted sync envelope
    Edge->>Edge: Verify authenticated actor assertion
    Edge->>Policy: Validate envelope and actor/device scope

    alt Invalid actor, revoked device, or cross-scope operation
        Policy-->>Edge: Deny with generic result
        Edge->>Audit: Record denial metadata
        Edge-->>Device: Rejected
    else Scope valid
        Policy->>DB: Lock registered device row
        DB->>DB: Check operationId and device sequence

        alt Duplicate operation
            DB-->>Policy: Existing operation status
            Policy-->>Edge: Stable duplicate result
            Edge-->>Device: Prior result
        else Sequence replay
            DB-->>Policy: Replay denied
            Policy->>Audit: Record replay metadata
            Policy-->>Edge: Rejected
            Edge-->>Device: Rejected
        else New operation
            DB->>DB: Record accepted operation and advance sequence
            DB-->>Worker: Claimed operation
            Worker->>DB: Conditional entity update using baseVersion

            alt Version matches
                DB->>DB: Apply mutation and increment version
                Worker->>DB: Mark operation applied
                Worker->>Audit: Record application metadata
                Worker-->>Edge: Applied with new version
                Edge-->>Device: Applied
            else Version conflict
                DB-->>Worker: No matching version
                Worker->>DB: Mark operation conflict
                Worker->>Audit: Record conflict metadata
                Worker-->>Edge: Conflict
                Edge-->>Device: Reconciliation required
            end
        end
    end
```

## Trust boundaries

1. Offline device storage is outside the cloud trust boundary and requires local encryption and user/device binding.
2. The sync endpoint accepts identity only from the trusted authentication component.
3. Envelope scope is untrusted until matched against the actor and registered device.
4. Database uniqueness and row locking provide the authoritative replay boundary.
5. Entity mutation must repeat country and programme predicates and use optimistic concurrency.
6. Audit events contain operation metadata, never Restricted payload content.

## Current implementation boundary

Operation validation, device binding, replay storage, idempotency keys, and controlled conflict handling are implemented. Entity-specific mutation is intentionally fail-closed and remains pending; the worker records a conflict instead of applying an unsafe write.
