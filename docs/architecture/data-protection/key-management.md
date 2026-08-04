# Key Management

## Purpose

This document defines the ownership, hierarchy, access model, rotation, recovery, monitoring, and destruction requirements for cryptographic keys used by AfyaBridge.

The design focuses on Cloud KMS customer-managed encryption keys used by supported Google Cloud services and on key-encryption keys used for selected application-level envelope encryption.

## Design principles

- Keys are separated by country, environment, and purpose.
- Production keys are not shared with development, staging, or sandbox.
- Key administration is separated from data administration.
- Workloads receive only the minimum cryptographic permissions required for an approved resource.
- Human users do not receive routine decrypt capability.
- Long-lived exported key material is prohibited.
- Rotation, disablement, recovery, and destruction are tested before operational reliance.
- Key changes and cryptographic operations must be attributable and monitored.
- Key destruction requires verified data-retention authority and two-person control.

## Key hierarchy

The logical hierarchy is:

```text
AfyaBridge organization
  ├── Kenya production key project
  │   ├── database key ring
  │   ├── object-storage key ring
  │   ├── backup key ring
  │   └── application-envelope key ring
  ├── Ghana production key project
  │   ├── database key ring
  │   ├── object-storage key ring
  │   ├── backup key ring
  │   └── application-envelope key ring
  ├── South Africa production key project
  │   ├── database key ring
  │   ├── object-storage key ring
  │   ├── backup key ring
  │   └── application-envelope key ring
  ├── Staging key project
  └── Development key project
```

The exact project structure may be adjusted during implementation, but country production keys must remain independently governed and must not introduce cross-country operational dependency.

## Key location

Key location must be compatible with:

- the protected service;
- the selected Google Cloud region or multi-region;
- country residency requirements;
- disaster-recovery design;
- backup and restore locations;
- service availability expectations.

A key must not be created in a location that forces protected data or recovery operations outside the approved country architecture.

## Key types

| Key type | Use |
|---|---|
| Symmetric CMEK | Encryption of supported databases, buckets, backups, disks, logs, and other managed resources |
| Symmetric envelope key | Wrapping application-generated data-encryption keys |
| Asymmetric signing key | Approved signing workflows where verifier separation is required |
| Asymmetric encryption key | Exceptional use cases requiring separate public encryption and private decryption |

Symmetric keys are the default for service-integrated encryption. Asymmetric keys require a specific design because rotation and consumer rollout are not equivalent to symmetric-key rotation.

## Ownership model

| Responsibility | Owner |
|---|---|
| Cryptographic policy | Security architecture |
| Key project and IAM design | Cloud platform and security engineering |
| Business purpose and retention authority | Country data owner |
| Key use by managed service | Approved service agent |
| Key use by application workload | Workload-specific service account |
| Rotation execution and validation | Key management operator |
| Disablement approval | Security plus service owner |
| Destruction approval | Data owner, security, and designated second approver |
| Monitoring and incident response | Security operations |

## IAM separation

Key roles must distinguish:

- key metadata viewing;
- cryptographic use;
- key creation;
- rotation scheduling;
- IAM administration;
- disablement;
- destruction.

Broad project roles are not acceptable substitutes for key-specific least privilege.

Managed-service agents receive cryptographic use only for the keys required by their resources. Application workloads receive use access only when application-level cryptographic operations are explicitly part of the design.

## Service-agent access

When a Google Cloud service uses CMEK, its service agent may require cryptographic permissions on the key. These grants must be:

- scoped to the exact key where practical;
- documented against the protected resource;
- created through infrastructure as code;
- monitored for unexpected principals;
- removed when the protected resource is decommissioned.

A service agent from one country or environment must not use another country's production key.

## Rotation policy

Each symmetric key must have a documented rotation schedule based on risk, service compatibility, and operational requirements.

Rotation planning must distinguish:

1. creation of a new primary key version;
2. use of that version for new encryption operations;
3. continued availability of old versions for existing ciphertext;
4. optional or required re-encryption of historical data;
5. eventual disablement or destruction of old versions.

Rotation does not by itself prove that existing data is encrypted under the newest version.

## Rotation process

1. Confirm service support and current key health.
2. Create or activate the new key version.
3. Validate new writes and service operations.
4. Confirm monitoring and audit events.
5. Determine whether historical data requires rewrite or migration.
6. Test read, restore, and rollback using required older versions.
7. Observe for the defined stabilization period.
8. Disable an old version only after all dependencies are known.
9. Destroy only after retention and recovery requirements have expired.

## Application envelope encryption

Where application-level encryption is approved:

- the application generates or receives a data-encryption key;
- data is encrypted locally with the data-encryption key;
- the data-encryption key is wrapped by a Cloud KMS key-encryption key;
- ciphertext stores the wrapped data key, algorithm metadata, and key reference;
- plaintext data keys exist only in memory for the minimum required period;
- logs and traces never contain plaintext keys.

Envelope-encryption formats must be versioned to support algorithm changes and re-encryption.

## Key disablement

Disablement is used for incident containment, dependency testing, or controlled retirement. It must not be performed casually because protected services can become unavailable.

Before planned disablement, operators must identify:

- active resources using the version;
- backups or historical objects requiring it;
- disaster-recovery dependencies;
- expected service failure behaviour;
- rollback steps;
- monitoring coverage.

Emergency disablement follows the privileged-access and incident-response processes and requires immediate impact assessment.

## Key destruction

Destroying a key version may make data permanently unrecoverable. Destruction requires:

- verified legal and retention authority;
- confirmed resource and backup inventory;
- evidence that no active data depends on the version;
- two-person approval;
- documented waiting period;
- recovery-window awareness;
- final audit record.

Key destruction must never be used to conceal an incomplete deletion process or bypass preservation requirements.

## Recovery and continuity

Recovery plans must cover:

- accidental IAM removal;
- disabled key versions;
- deleted or suspended projects;
- region or service disruption;
- compromised administrator credentials;
- failed automatic rotation;
- loss of application encryption metadata;
- restore of backups encrypted under older versions.

Recovery access remains least-privileged and country-scoped. Emergency key access must be tested and reviewed like other break-glass mechanisms.

## Monitoring

Monitoring must identify:

- key creation and deletion;
- key-version creation, disablement, enablement, and destruction;
- rotation schedule changes;
- key IAM changes;
- cryptographic use by unexpected principals;
- repeated denied cryptographic operations;
- cross-country or cross-environment use attempts;
- service outages caused by missing key access;
- keys without owners, rotation schedules, or protected-resource mappings;
- protected resources using an unapproved key.

## Inventory

The key register must record:

- key resource name;
- country and environment;
- location;
- purpose and classification;
- protected resources;
- service agents and workload identities;
- administrators and approvers;
- rotation schedule;
- current primary version;
- recovery dependencies;
- retention and destruction authority;
- monitoring owner;
- lifecycle state.

## Validation requirements

Before key-management controls are marked implemented, evidence must show:

1. country- and environment-separated key resources;
2. location compatibility;
3. least-privilege IAM;
4. successful managed-service or workload use;
5. denied unauthorized and cross-country use;
6. rotation and rollback testing;
7. disablement impact testing;
8. backup restore using required historical versions;
9. alerts for lifecycle and IAM changes;
10. reconciled key and protected-resource inventories.

## Status

This architecture is **Designed**. No key hierarchy, IAM grant, rotation schedule, envelope-encryption workflow, recovery process, or monitoring control is considered implemented until configuration, testing, and evidence exist.
