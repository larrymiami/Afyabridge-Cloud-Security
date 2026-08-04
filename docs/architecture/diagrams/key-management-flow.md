# Key Management Flow

## Purpose

This diagram shows how country-scoped Cloud KMS keys protect managed resources and selected application-level encrypted data without granting routine human decrypt access.

```mermaid
flowchart LR
    subgraph GOV[Governance and approval]
        OWNER[Country data owner]
        SEC[Security architecture]
        OPS[Key management operator]
        APPROVER[Independent approver]
    end

    subgraph KMS[Country production key project]
        DBKEY[Database CMEK]
        OBJKEY[Object-storage CMEK]
        BAKKEY[Backup CMEK]
        APPKEY[Application envelope key]
        AUDIT[Key audit logs]
    end

    subgraph SERVICES[Country production services]
        DB[(Managed database)]
        OBJ[(Object storage)]
        BAK[(Backup and recovery copies)]
        APP[Application workload]
    end

    subgraph ENVELOPE[Application-level envelope encryption]
        DEK[Ephemeral data-encryption key]
        CT[Encrypted field or payload]
        WDEK[Wrapped data key and metadata]
    end

    OWNER -->|defines purpose, residency and retention| SEC
    SEC -->|approves key scope and policy| OPS
    APPROVER -->|approves high-risk lifecycle actions| OPS

    OPS -->|creates and rotates| DBKEY
    OPS -->|creates and rotates| OBJKEY
    OPS -->|creates and rotates| BAKKEY
    OPS -->|creates and rotates| APPKEY

    DB -->|service-agent cryptographic use| DBKEY
    OBJ -->|service-agent cryptographic use| OBJKEY
    BAK -->|service-agent cryptographic use| BAKKEY

    APP -->|generates in memory| DEK
    DEK -->|encrypts| CT
    APP -->|wrap request| APPKEY
    APPKEY -->|wrapped key| WDEK
    WDEK --> CT

    DBKEY --> AUDIT
    OBJKEY --> AUDIT
    BAKKEY --> AUDIT
    APPKEY --> AUDIT

    AUDIT -->|alerts and evidence| SEC
```

## Managed-service flow

1. A country production resource is created with an approved country- and purpose-scoped CMEK.
2. The managed service agent receives cryptographic use on the exact key required by the resource.
3. Application users and ordinary administrators do not receive key-administration or direct decrypt permissions.
4. Cloud KMS records key lifecycle and cryptographic activity.
5. Security monitoring reconciles key users, protected resources, and expected country scope.

## Envelope-encryption flow

1. The application creates a data-encryption key in memory.
2. The data-encryption key encrypts the selected field or payload.
3. Cloud KMS wraps the data-encryption key with the application key-encryption key.
4. The application stores ciphertext, wrapped key material, algorithm metadata, and key reference.
5. Plaintext data keys are discarded after the operation.
6. Decryption requires both access to the ciphertext and authorized use of the wrapping key.

## Rotation flow

```mermaid
sequenceDiagram
    participant Operator as Key management operator
    participant KMS as Cloud KMS
    participant Service as Protected service
    participant Monitor as Security monitoring
    participant Approver as Independent approver

    Operator->>KMS: Create or activate new key version
    KMS-->>Monitor: Key-version lifecycle event
    Service->>KMS: Use current primary version for new operation
    KMS-->>Service: Cryptographic result
    Operator->>Service: Validate reads, writes and recovery behaviour
    Service-->>Operator: Validation evidence
    Operator->>Monitor: Confirm expected use and no anomalies
    Operator->>Approver: Request old-version disablement when eligible
    Approver-->>Operator: Approve or reject
    Operator->>KMS: Disable old version
    KMS-->>Monitor: Disablement event and alert
```

Rotation creates a new primary version but does not, by itself, prove that historical data has been re-encrypted. Service-specific verification remains required.

## Failure paths

```mermaid
flowchart TD
    CHANGE[Key IAM, state or version change] --> CHECK{Expected and approved?}
    CHECK -->|Yes| VALIDATE[Run service and recovery validation]
    CHECK -->|No| ALERT[Raise security alert]
    VALIDATE --> HEALTHY{Service healthy?}
    HEALTHY -->|Yes| RECORD[Record evidence and close change]
    HEALTHY -->|No| ROLLBACK[Restore prior key access or state]
    ALERT --> CONTAIN[Contain unauthorized principal or change]
    CONTAIN --> IMPACT[Assess affected data and services]
    IMPACT --> IR[Enter incident-response process]
```

## Trust boundaries

- country data owner to central security governance;
- key operator to Cloud KMS control plane;
- managed-service agent to country key;
- application runtime to application key-encryption key;
- ciphertext storage to key project;
- production country key project to other countries and non-production;
- key audit logs to central monitoring.

## Required tests

- approved country service can use its key;
- another country service cannot use the key;
- non-production identities cannot use production keys;
- routine human users cannot decrypt or administer keys;
- new writes use the current primary version;
- older ciphertext remains readable while required versions are enabled;
- planned disablement produces expected failure and rollback behaviour;
- backup restore succeeds with required historical key versions;
- unexpected IAM or lifecycle changes generate alerts;
- envelope-encryption metadata supports successful decrypt and future format versioning.

## Status

This diagram represents the **Designed** key-management flow. It does not assert that Cloud KMS resources, IAM bindings, rotation schedules, envelope encryption, alerts, or recovery tests have been implemented.
