# Backup and Recovery Flow

## Status

**Designed**

```mermaid
flowchart LR
    subgraph KE[Kenya production boundary]
        KEAPP[Kenya workloads]
        KEDB[(Kenya system of record)]
        KEOBJ[(Kenya object storage)]
        KEBK[(Kenya backup repository)]
        KER[Isolated Kenya recovery environment]
        KEKEY[Kenya key hierarchy]

        KEAPP --> KEDB
        KEAPP --> KEOBJ
        KEDB -->|scheduled backup / PITR| KEBK
        KEOBJ -->|versioned or protected copy| KEBK
        KEKEY -. encrypts .-> KEDB
        KEKEY -. encrypts .-> KEOBJ
        KEKEY -. encrypts .-> KEBK
        KEBK -->|approved restore| KER
        KEKEY -. decrypts for restore .-> KER
    end

    subgraph GH[Ghana production boundary]
        GHAPP[Ghana workloads]
        GHDB[(Ghana system of record)]
        GHOBJ[(Ghana object storage)]
        GHBK[(Ghana backup repository)]
        GHR[Isolated Ghana recovery environment]
        GHKEY[Ghana key hierarchy]

        GHAPP --> GHDB
        GHAPP --> GHOBJ
        GHDB -->|scheduled backup / PITR| GHBK
        GHOBJ -->|versioned or protected copy| GHBK
        GHKEY -. encrypts .-> GHDB
        GHKEY -. encrypts .-> GHOBJ
        GHKEY -. encrypts .-> GHBK
        GHBK -->|approved restore| GHR
        GHKEY -. decrypts for restore .-> GHR
    end

    subgraph ZA[South Africa production boundary]
        ZAAPP[South Africa workloads]
        ZADB[(South Africa system of record)]
        ZAOBJ[(South Africa object storage)]
        ZABK[(South Africa backup repository)]
        ZAR[Isolated South Africa recovery environment]
        ZAKEY[South Africa key hierarchy]

        ZAAPP --> ZADB
        ZAAPP --> ZAOBJ
        ZADB -->|scheduled backup / PITR| ZABK
        ZAOBJ -->|versioned or protected copy| ZABK
        ZAKEY -. encrypts .-> ZADB
        ZAKEY -. encrypts .-> ZAOBJ
        ZAKEY -. encrypts .-> ZABK
        ZABK -->|approved restore| ZAR
        ZAKEY -. decrypts for restore .-> ZAR
    end

    ORCH[Central recovery orchestration metadata]
    EVID[Central security evidence and monitoring]
    APPROVAL[Named restore request and independent approval]

    APPROVAL --> ORCH
    ORCH -->|country-scoped job only| KEBK
    ORCH -->|country-scoped job only| GHBK
    ORCH -->|country-scoped job only| ZABK

    KEBK -. status and audit metadata .-> EVID
    GHBK -. status and audit metadata .-> EVID
    ZABK -. status and audit metadata .-> EVID
    KER -. validation evidence .-> EVID
    GHR -. validation evidence .-> EVID
    ZAR -. validation evidence .-> EVID

    KER -->|validated recovery or selective return| KEDB
    GHR -->|validated recovery or selective return| GHDB
    ZAR -->|validated recovery or selective return| ZADB

    X1[No Kenya backup restore into Ghana or South Africa]
    X2[No production restore into development or sandbox]
    X3[Temporary recovery environments destroyed after evidence capture]

    KEBK -. prohibited .-> GHR
    GHBK -. prohibited .-> ZAR
    ZABK -. prohibited .-> KER
```

## Flow notes

1. Primary data, object storage, backup repositories, recovery environments, and encryption keys remain country-scoped.
2. Central orchestration receives job metadata and invokes only approved country-specific identities; it does not receive unrestricted backup contents.
3. Restore execution requires a named request, independent approval, a defined target, and a validation plan.
4. Side-by-side recovery into an isolated temporary environment is preferred for investigation and integrity checks.
5. Restored data is returned to production only after technical and business validation.
6. Completed deletion jobs must be replayed or reconciled before an older backup returns to service.
7. Temporary recovery environments and elevated permissions are removed after evidence capture.
8. Cross-country and production-to-nonproduction restores are prohibited unless a separately approved exception exists.

## Required evidence

- backup coverage report;
- successful backup records;
- restore authorization record;
- recovery-environment configuration;
- key and secret dependency validation;
- integrity and application test results;
- measured RPO and RTO;
- deletion-replay confirmation;
- temporary-resource destruction evidence;
- unresolved recovery exceptions.
