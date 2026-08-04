# ADR-011: Customer-Managed Encryption Keys

- **Status:** Accepted
- **Decision date:** 2026-08-04
- **Architecture state:** Designed
- **Owners:** Security Architecture, Cloud Platform, Data Protection

## Context

AfyaBridge processes Restricted health, household, referral, clinical, identity, and operational data across Kenya, Ghana, and South Africa. Google Cloud encrypts customer data at rest by default, but selected services support customer-managed encryption keys that give AfyaBridge additional control over key IAM, lifecycle, rotation, disablement, destruction, and auditability.

The architecture requires a balance between stronger control and the operational risks introduced by customer-managed keys. A disabled, destroyed, inaccessible, or incorrectly located key can make protected data or services unavailable. Applying CMEK indiscriminately can create cost, reliability, recovery, and administrative complexity without a proportional reduction in risk.

A formal decision is needed for where CMEK is required, how keys are separated, who administers them, and how availability and recovery are protected.

## Decision

AfyaBridge will use a **risk-based CMEK model**.

CMEK is required for supported production services that persist Restricted data or hold high-impact security material, subject to service compatibility and an approved operational design.

The initial target scope includes, where supported and validated:

- production databases containing Restricted records;
- production object-storage buckets containing Restricted documents, exports, or backups;
- selected analytics stores containing Restricted or high-risk derived data;
- key-wrapped application encryption material;
- selected security evidence or backup repositories where key control materially reduces risk.

Google-managed encryption remains acceptable for:

- Public and low-risk Internal data;
- transient resources with no persisted sensitive content;
- services that do not support CMEK;
- workloads where a documented risk assessment concludes that CMEK complexity exceeds the security benefit;
- early non-production environments using synthetic data, unless CMEK behavior itself is under test.

Every exception for Restricted production data requires a named owner, rationale, compensating controls, review date, and migration trigger.

## Key boundaries

Keys are separated by:

1. country;
2. environment;
3. data or service risk domain;
4. operational ownership where separation reduces blast radius.

Kenya, Ghana, and South Africa production do not share encryption keys. Production and non-production do not share key rings or key versions.

A recommended logical structure is:

```text
country production key project
  └── country and region scoped key ring
      ├── database key
      ├── object storage key
      ├── backup key
      └── application encryption key
```

The precise number of keys may be consolidated where service limits, cost, and recovery considerations justify it, but one organization-wide production key is prohibited.

## Key ownership and administration

Key projects are owned by the cloud security or platform-security function rather than by application service projects.

Responsibilities are separated:

- **Key administrators** manage key metadata, lifecycle, and policy.
- **Service agents and workload identities** use keys through narrowly scoped cryptographic permissions.
- **Data administrators** manage databases and storage but do not automatically administer keys.
- **Security reviewers** inspect policy and audit logs without routine decrypt rights.
- **Emergency operators** receive temporary, approved access under the privileged-access model.

No routine human user receives broad direct decrypt capability across country production environments.

## Key location

Key location must be compatible with the protected service and the country data-residency design.

Before selecting a key location, the implementation must confirm:

- supported service locations;
- regional or multi-regional behavior;
- backup and replica behavior;
- disaster-recovery requirements;
- cross-border processing implications;
- latency and availability impact.

A key may not be placed in a location merely for administrative convenience if doing so conflicts with residency or service requirements.

## Rotation

Automatic or scheduled rotation is configured according to service support and risk. The design target is annual rotation or shorter where policy, service, or threat conditions require it.

Rotation creates a new primary key version for future cryptographic operations. Rotation alone is not treated as proof that all existing service data has been re-encrypted under the new version.

For each protected service, the implementation records:

- whether historical data remains bound to old versions;
- whether explicit re-encryption is supported or required;
- how old versions are retained for reads, backups, and restores;
- how completion is validated.

## Disablement and destruction

Key disablement and destruction are high-risk operations.

They require:

1. a documented reason;
2. impact analysis identifying protected resources;
3. approval by separate authorized parties;
4. confirmation of backup and recovery implications;
5. a staged disablement test where practical;
6. monitoring during the change;
7. evidence of the result.

Destruction is not used as the routine mechanism for data deletion. Data-retention and deletion workflows must remove data and replicas according to policy before irreversible key destruction is considered.

Scheduled destruction delays and recovery windows are used where supported.

## Availability and recovery

CMEK introduces a dependency between the protected service and the key-management control plane.

The implementation must validate:

- service behavior when a key is disabled or unavailable;
- restoration of data encrypted with older versions;
- IAM recovery when key access is accidentally removed;
- continuity during rotation;
- disaster-recovery access to required key versions;
- monitoring for service-agent permission loss;
- recovery of key configuration through infrastructure as code and protected evidence.

Key material is not exported for routine backup. Recovery relies on the managed key service, retained key versions, protected configuration, and tested permissions.

## IAM model

Cryptographic permissions are granted only to service agents and workload identities that require them. Administrative roles do not automatically include encrypt/decrypt use.

Policy changes are managed as code where supported and require peer review. Organization-wide wildcard principals and broad project-level decrypt grants are prohibited.

Conditional access is used where it provides reliable restriction without creating unsupported recovery assumptions.

## Monitoring

Required monitoring includes:

- key creation, import, rotation, disablement, destruction scheduling, cancellation, and destruction;
- key IAM changes;
- denied cryptographic operations;
- service-agent permission removal;
- use from an unexpected project, country, environment, or identity;
- keys exceeding the rotation target;
- protected resources without the expected CMEK binding;
- keys with no identified owner or consumers;
- attempts to disable or destroy a key outside an approved change.

Key logs are retained as high-value security evidence and protected from modification by routine application operators.

## Alternatives considered

### Alternative 1: Use only Google-managed encryption

**Advantages**

- Lowest operational complexity.
- Reduced risk of self-inflicted data unavailability.
- No customer-managed key administration.

**Rejected as the universal model because**

- It does not provide AfyaBridge-controlled disablement, lifecycle, and key IAM for the highest-risk data.
- It provides less direct evidence for separation of key administration from data administration.
- It does not satisfy the desired control model for selected Restricted production stores.

Google-managed encryption remains an accepted option outside the defined CMEK scope.

### Alternative 2: Require CMEK for every supported resource

**Advantages**

- Uniform policy.
- Maximum customer control over supported encryption bindings.

**Rejected because**

- It creates significant operational and cost overhead.
- It increases outage and recovery risk.
- It may provide little additional value for low-risk or transient resources.
- It complicates experimentation and synthetic non-production environments.

### Alternative 3: One global production key

**Advantages**

- Simple administration.
- Fewer keys and policies.

**Rejected because**

- It expands blast radius.
- It weakens country and environment separation.
- It creates a global dependency for otherwise isolated production systems.
- It complicates residency and country-specific recovery decisions.

### Alternative 4: Application-managed encryption keys outside Cloud KMS

**Advantages**

- Maximum portability and custom cryptographic control.

**Rejected as the default because**

- It transfers key storage, availability, rotation, audit, and recovery complexity to the application team.
- It increases the chance of unsafe key handling.
- It may reduce integration with managed services.

Application-layer encryption remains available for fields whose threat model requires protection beyond service-level encryption.

## Consequences

### Positive

- AfyaBridge gains direct lifecycle and IAM control over keys protecting selected high-risk data.
- Country production key boundaries reinforce data and operational isolation.
- Key and data administration can be separated.
- Key events provide useful audit and incident evidence.
- Disablement can support containment in specific severe incidents.

### Negative

- Key outages or policy errors can affect service availability.
- More infrastructure, monitoring, testing, and operational knowledge are required.
- Service-specific CMEK behavior must be tracked.
- Rotation does not automatically re-encrypt all historical data.
- Disaster recovery depends on retained key versions and correct access.
- Costs increase with additional keys, versions, and operations.

## Security implications

This decision reduces risks related to unauthorized administrative control, cross-country key reuse, and unmonitored key lifecycle changes. It does not by itself prevent application compromise, authorized data misuse, plaintext exposure in application memory, unsafe exports, or overly broad database permissions.

CMEK complements identity, network, classification, retention, backup, and monitoring controls; it does not replace them.

## Validation requirements

Before this ADR is considered implemented, evidence must demonstrate:

1. selected production resources are bound to the intended country and environment keys;
2. production countries do not share keys;
3. key administrators and data administrators have separate permissions;
4. service identities can use only required keys;
5. unauthorized users cannot directly decrypt or change key policy;
6. a rotation completes without unexplained outage;
7. data protected with an older version remains recoverable as designed;
8. accidental permission removal and key disablement behavior are tested safely;
9. key events and drift alerts reach assigned owners;
10. exceptions are recorded and periodically reviewed.

## Related documents

- [`../architecture/data-protection/encryption-at-rest.md`](../architecture/data-protection/encryption-at-rest.md)
- [`../architecture/data-protection/key-management.md`](../architecture/data-protection/key-management.md)
- [`../architecture/data-protection/database-protection.md`](../architecture/data-protection/database-protection.md)
- [`../architecture/data-protection/object-storage-protection.md`](../architecture/data-protection/object-storage-protection.md)
- [`ADR-010-data-classification-and-handling.md`](./ADR-010-data-classification-and-handling.md)
- [`ADR-003-terraform-state-and-bootstrap.md`](./ADR-003-terraform-state-and-bootstrap.md)

## Status note

This ADR records an accepted architecture decision. It does not claim that keys, policies, bindings, rotations, recovery tests, or alerts have been implemented.
