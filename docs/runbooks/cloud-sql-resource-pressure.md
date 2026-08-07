# Cloud SQL resource pressure

## Trigger

Sustained Cloud SQL resource utilization above the reviewed operating threshold.

## Triage

Identify the affected instance, country, region, database, and alert window. Review active connections, slow queries, recent deployments, maintenance events, storage growth, replication state, and application error rates.

## Containment

Reduce abusive or runaway workload demand before changing capacity. Scaling or database configuration changes require review because they can affect cost, availability, and recovery behavior.

## Recovery

Confirm utilization returns to baseline, application latency and error rates recover, connections remain healthy, and backup or replication posture has not degraded. Record the root cause and any threshold tuning.
