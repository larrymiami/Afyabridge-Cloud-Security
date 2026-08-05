# Abuse Protection

## Status

Designed and partially implemented through bounded schemas, country-scoped authorization, device binding, idempotency, and replay windows. Rate controls and deployed telemetry remain unvalidated.

## Threats addressed

The baseline protects against:

- credential stuffing and repeated invalid session attempts;
- high-rate record enumeration;
- cross-country identifier probing;
- oversized or deeply nested request bodies;
- repeated household creation;
- offline-operation replay;
- sequence skipping or reuse;
- revoked-device submissions;
- stale or far-future operations;
- conflict storms caused by obsolete clients;
- expensive database queries triggered by unbounded filters;
- partner retries that lack stable idempotency keys.

## Control layers

### Edge

The deployed edge should enforce request-size limits, connection controls, managed threat rules, IP and identity-aware rate policies, and origin protection. Edge limits are coarse protections and do not replace actor-aware application limits.

### Application

Application limits are keyed using the strongest available identity combination:

1. authenticated actor;
2. registered device;
3. country and programme;
4. action or route;
5. source network as a secondary signal.

Sensitive write operations require lower thresholds than read-only health checks. Limits must avoid allowing one country or programme to exhaust capacity for another.

### Data access

List endpoints use bounded page sizes, deterministic cursors, explicit sort keys, indexed predicates, and maximum filter counts. Direct identifiers cannot be used for unrestricted wildcard searches.

### Offline synchronization

Each device has a monotonically increasing sequence, unique operation IDs, bounded timestamps, country and assignment binding, and per-operation authorization. Duplicate operation IDs return stable prior outcomes rather than applying the mutation again.

## Recommended baseline limits

These are initial architecture defaults and require load testing before production use.

| Operation | Initial policy |
|---|---|
| Health check | high anonymous threshold, edge-cached where safe |
| Session read | moderate per actor and source |
| Household read | moderate per actor and programme |
| Household create or update | low per actor, device, and programme |
| Offline sync batch | bounded item count and encoded payload size |
| Failed authentication assertion | strict source and subject thresholds |
| Repeated authorization denial | detection threshold plus progressive throttling |

## Batch controls

Offline batches must define:

- maximum operations per batch;
- maximum serialized size;
- maximum payload depth and field count;
- per-item validation and authorization;
- bounded transaction duration;
- partial-result semantics;
- a maximum number of conflicts returned in one response.

A batch is never trusted because another item from the same device was valid.

## Response behavior

Rate-limited responses use `429` and a bounded retry hint. Responses do not disclose whether limits are keyed by actor, device, programme, or source. Repeated abusive requests may be silently delayed, blocked at the edge, or require reauthentication depending on risk.

## Detection

Security monitoring should detect:

- sustained `401`, `403`, `404`, `409`, or `429` patterns;
- one actor probing multiple countries or programmes;
- one device presenting multiple actors;
- rapid sequence reuse or operation-ID duplication;
- unusual sync volumes after long offline periods;
- repeated optimistic-concurrency conflicts;
- request-size and schema-limit violations;
- sudden increases in database duration or row scans.

## Availability and fairness

Controls must preserve access for legitimate field workers on unstable mobile networks. Temporary connectivity loss, delayed sync, and safe retries are expected. Throttling should therefore rely on identity, device history, idempotency, and behavior—not IP address alone.

## Validation evidence

Required evidence includes:

- load tests for each sensitive route;
- tests for request and batch size limits;
- replay and duplicate-operation tests;
- per-country capacity-isolation tests;
- rate-limit bypass tests using changed headers and source addresses;
- monitoring evidence for denial, conflict, and throttling events;
- documented exception and tuning records.
