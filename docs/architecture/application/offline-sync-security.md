# Offline Synchronization Security

## Status

**Implemented, not yet validated.**

The current package establishes the sync security boundary, operation format, device binding, replay controls, persistence model, and fail-closed worker behavior. End-to-end entity mutation and CI evidence are still pending.

## Security objectives

Offline synchronization must preserve the same country, programme, facility, assignment, and record boundaries enforced online while accounting for disconnected devices, delayed delivery, retries, and conflicts.

The design must prevent:

- replay of previously accepted operations;
- use of an operation from a different device or actor;
- cross-country or cross-programme writes;
- unauthorized assignment changes;
- silent overwrites of newer server state;
- duplicate application after retry;
- indefinite acceptance of stale offline operations;
- continued use of a revoked device;
- logging of Restricted payloads.

## Sync operation envelope

Each operation contains:

- globally unique `operationId`;
- registered `deviceId`;
- monotonically increasing per-device `sequence`;
- actor-derived country and programme scope;
- optional facility and assignment scope;
- entity type, identifier, and action;
- `baseVersion` for optimistic concurrency;
- client occurrence timestamp;
- validated mutation payload.

The server does not trust country or scope values merely because they are present in the envelope. They must match the authenticated actor and registered device binding.

## Device binding

A sync device is bound to:

- one actor;
- one country;
- one programme;
- an optional facility;
- approved assignments;
- a revocation state;
- a last accepted sequence.

Changing ownership or scope requires an explicit re-enrolment or managed update. A revoked device is denied before mutation processing.

## Replay and idempotency controls

The database enforces uniqueness for:

- `operation_id`;
- `(device_id, sequence)`.

The device row is locked while an operation is claimed. An operation is rejected when its sequence is not greater than the device's last accepted sequence.

A retry using the same operation identifier or sequence returns the prior status rather than applying the mutation again.

## Optimistic concurrency

Every update operation carries the version observed by the device. Entity mutation must use a conditional update equivalent to:

```sql
UPDATE resource
SET ..., version = version + 1
WHERE id = :id
  AND country = :country
  AND programme_id = :programme
  AND version = :base_version;
```

No affected row means a conflict, not an unconditional retry. The client receives a conflict result and must reconcile with authorized server state.

The current worker deliberately records a controlled conflict until entity-specific conditional mutation is implemented. It does not apply an unsafe placeholder write.

## Time handling

Operations more than five minutes in the future are rejected. Operations older than 30 days are rejected by the initial baseline. These are security defaults, not permanent policy values, and must be reviewed against programme operating conditions.

Server receipt time remains authoritative for audit and ordering. Client occurrence time is retained as contextual evidence only.

## Batch processing

Future batch endpoints must:

- cap operation count and total body size;
- parse each item independently;
- authorize every item independently;
- avoid all-or-nothing authorization assumptions;
- return per-item results;
- prevent one malformed item from exposing another item's data;
- apply bounded processing time and backpressure.

## Local device requirements

The server-side package assumes the device application will:

- encrypt offline data using platform-protected keys;
- bind cached data to the signed-in user and registered device;
- avoid plaintext exports and debug logs;
- expire cached Restricted data;
- clear local data after successful sync, logout, revocation, or remote wipe;
- use certificate-validating HTTPS only;
- protect the local queue from application-level tampering where platform support exists.

These controls are designed but not implemented in the current repository.

## Audit requirements

Record metadata for:

- device enrolment, scope change, and revocation;
- operation acceptance, duplicate, replay, conflict, rejection, and application;
- actor, device, request, operation, country, programme, entity type, and result;
- server and client timestamps;
- prior and resulting version where applicable.

Do not log mutation payloads, patient details, household names, credentials, or local encryption material.

## Failure behavior

- Authentication failure: reject the envelope.
- Invalid device binding: reject the envelope.
- Cross-scope identifiers: reject the operation.
- Duplicate operation: return prior status.
- Sequence replay: reject the operation.
- Version mismatch: record and return conflict.
- Database or worker failure: do not acknowledge application.
- Unknown mutation implementation: record controlled conflict rather than writing.

## Validation evidence required

The control state can move to validated after evidence demonstrates:

1. tests execute successfully;
2. duplicate identifiers and sequences cannot apply twice;
3. revoked and differently bound devices are denied;
4. cross-country, programme, facility, and assignment operations are denied;
5. stale base versions produce conflicts;
6. concurrent operations do not silently overwrite newer state;
7. audit records contain metadata without Restricted payloads;
8. retry behavior returns stable operation results;
9. database transactions preserve claim and mutation consistency.
