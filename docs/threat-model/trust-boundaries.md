# Trust Boundaries

## Purpose

This document defines the initial trust boundaries for the AfyaBridge Cloud Security platform. A trust boundary exists wherever data, identity, or control passes between components with different security assumptions, ownership, privilege levels, or enforcement mechanisms.

These boundaries guide threat identification, network design, IAM policy, logging, validation, and incident-response planning.

## Boundary summary

| ID | Boundary | Primary concern |
|---|---|---|
| TB-01 | Field device to public edge | Untrusted device and network traffic entering the platform |
| TB-02 | Public edge to application services | Internet-facing traffic crossing into managed workloads |
| TB-03 | Application service to application service | Service impersonation, over-broad trust, and lateral movement |
| TB-04 | Application services to data services | Unauthorised data access and excessive workload privileges |
| TB-05 | Offline client storage to synchronisation API | Tampered, replayed, duplicated, or stale submissions |
| TB-06 | Country environment to shared services | Country isolation and shared-service privilege boundaries |
| TB-07 | One country environment to another | Cross-country data access and administrative overreach |
| TB-08 | Operational systems to analytics | Leakage of identifiable or restricted data into analytics |
| TB-09 | GitHub and CI/CD to Google Cloud | Build-system compromise and deployment identity abuse |
| TB-10 | Artifact Registry to runtime | Artifact tampering, unsigned images, and provenance failure |
| TB-11 | Human administrator to privileged cloud resources | Privilege escalation, unauthorised changes, and weak accountability |
| TB-12 | Workload to Secret Manager and Cloud KMS | Secret theft, key misuse, and excessive cryptographic permissions |
| TB-13 | Cloud workloads to external integrations | Third-party trust, data disclosure, and dependency failure |
| TB-14 | Production systems to monitoring and incident tooling | Sensitive telemetry exposure and alerting blind spots |
| TB-15 | Backup and recovery systems to production data | Backup compromise, restore abuse, and retention failures |

## TB-01 — Field device to public edge

### Components

- CHW mobile browser or PWA
- Supervisor and facility-user browsers
- Mobile networks, public Wi-Fi, and internet transit
- Public DNS, HTTPS load balancer, and edge protection

### Security assumptions

- User devices and networks are not trusted.
- Devices may be lost, shared, rooted, outdated, or infected.
- Requests may be replayed, automated, malformed, or intercepted.

### Required controls

- TLS for all external traffic
- strong authentication and short-lived sessions
- device-appropriate session revocation
- request validation and rate limiting
- Cloud Armor protections where applicable
- secure cookies and browser security headers
- minimal local storage of restricted data
- audit logging for authentication and access events

## TB-02 — Public edge to application services

### Components

- Global or regional HTTPS load balancer
- Cloud Armor
- API gateway or ingress layer
- Cloud Run or GKE services

### Security assumptions

- Only intended public services should be reachable.
- Internal services must not inherit public exposure by default.
- Edge controls reduce risk but do not replace application security.

### Required controls

- authenticated and authorised API requests
- explicit ingress configuration
- service-specific exposure rules
- schema and payload validation
- WAF and rate-limit rules
- denial-of-service monitoring
- no direct public access to data services

## TB-03 — Application service to application service

### Components

- Household service
- Referral service
- Education-content service
- Synchronisation worker
- Analytics export worker

### Security assumptions

- A compromised service must not automatically gain access to all other services.
- Network location alone is not sufficient proof of identity.

### Required controls

- separate service accounts
- authenticated service-to-service calls
- least-privilege IAM
- scoped API permissions
- restricted network paths
- workload identity rather than embedded credentials
- traceable service-level audit events

## TB-04 — Application services to data services

### Components

- Cloud SQL, Firestore, or equivalent operational stores
- Cloud Storage
- Pub/Sub or asynchronous queues
- Memorystore where used

### Security assumptions

- Data services contain confidential or restricted synthetic records.
- Application compromise should have a limited blast radius.

### Required controls

- private or restricted connectivity
- database authentication tied to workload identity where practical
- separate database roles per service
- encryption at rest and in transit
- query and access auditing
- backup controls
- no direct analyst or developer access to production data stores

## TB-05 — Offline client storage to synchronisation API

### Components

- Local offline queue
- Synchronisation endpoint
- Retry and conflict-resolution logic
- Server-side validation and deduplication

### Security assumptions

- Queued data can be altered while offline.
- Requests can arrive late, out of order, or more than once.
- A valid user may attempt to submit data outside their assignment scope.

### Required controls

- authenticated synchronisation
- payload integrity checks
- server-side authorisation for every record
- idempotency keys
- replay protection
- conflict and version handling
- queue expiration rules
- minimal local retention
- security logging for rejected sync events

## TB-06 — Country environment to shared services

### Components

- Kenya, Ghana, and South Africa projects
- Shared logging, networking, CI/CD, security, and artifact services

### Security assumptions

- Shared services need cross-environment visibility without becoming unrestricted data-access paths.
- A country compromise must not compromise shared control planes or other countries.

### Required controls

- project and folder separation
- scoped service accounts
- central logging with restricted readers
- approved shared-service interfaces
- separate encryption and deployment identities
- no broad project-to-project trust
- country-specific audit trails

## TB-07 — One country environment to another

### Components

- Country-specific applications, projects, databases, keys, and administrators

### Security assumptions

- Country environments are separate security and governance domains.
- Global aggregation does not justify unrestricted access to country-level records.

### Required controls

- country-scoped IAM groups and roles
- separate projects and service identities
- country claims enforced in application authorisation
- separate data stores or strict logical isolation
- country-aware encryption boundaries
- deny-by-default cross-country service access
- automated cross-country authorisation tests

## TB-08 — Operational systems to analytics

### Components

- Operational application data
- Transformation or de-identification pipeline
- BigQuery datasets and dashboards

### Security assumptions

- Operational records may contain identifiers and restricted attributes.
- Analysts should not require direct access to operational databases.

### Required controls

- approved extraction pipelines
- de-identification or aggregation before analytics use
- separate datasets and service identities
- column- and dataset-level permissions
- export auditing
- data retention and deletion rules
- tests preventing restricted fields from entering analytics

## TB-09 — GitHub and CI/CD to Google Cloud

### Components

- GitHub repository and Actions
- Workload Identity Federation
- Build, test, and deployment workflows
- Google Cloud deployment service accounts

### Security assumptions

- Source control and pipeline identities are high-value targets.
- Pull requests, workflow dependencies, and runners may be abused.

### Required controls

- Workload Identity Federation instead of service-account keys
- least-privilege deployment roles
- protected branches and required reviews
- pinned action references
- secret scanning
- isolated environments and approval gates
- restricted workflow permissions
- deployment audit logs

## TB-10 — Artifact Registry to runtime

### Components

- Container build
- SBOM and provenance generation
- Artifact Registry
- Cloud Run or GKE deployment

### Security assumptions

- A stored image is not automatically trusted.
- Artifacts may be replaced, built from unreviewed source, or contain critical vulnerabilities.

### Required controls

- immutable digests
- image signing
- build provenance and attestations
- vulnerability scanning
- trusted registry enforcement
- Binary Authorization or equivalent deployment policy
- runtime deployment by digest rather than mutable tag

## TB-11 — Human administrator to privileged cloud resources

### Components

- Platform, security, network, and incident-response administrators
- Google Cloud console, CLI, and infrastructure pipelines

### Security assumptions

- Administrative access can bypass normal application controls.
- Persistent broad privileges increase insider and account-compromise risk.

### Required controls

- group-based access
- least privilege and separation of duties
- temporary elevation where practical
- MFA and strong workforce identity
- break-glass procedures
- administrative audit logging
- periodic access reviews
- production changes through version-controlled workflows

## TB-12 — Workload to Secret Manager and Cloud KMS

### Components

- Application service accounts
- Secret Manager
- Cloud KMS keys and key rings

### Security assumptions

- Secret and key access must be limited to the exact workload and environment.
- Key administration and key use are separate responsibilities.

### Required controls

- per-service secret access
- environment- and country-specific secrets
- scoped KMS encrypt/decrypt roles
- rotation and version management
- key-use audit logs
- alerts for abnormal access
- no secrets in source code, images, or CI logs

## TB-13 — Cloud workloads to external integrations

### Components

- Notification providers
- External identity providers
- Referral partners
- Ticketing and alert-delivery systems

### Security assumptions

- Third-party availability and security are outside direct control.
- Data sent externally must be minimised and auditable.

### Required controls

- explicit egress paths
- minimal data disclosure
- authenticated APIs
- timeout, retry, and circuit-breaker behaviour
- secret rotation
- provider failure handling
- integration-specific audit events

## TB-14 — Production systems to monitoring and incident tooling

### Components

- Cloud Logging and Monitoring
- Security Command Center
- Alerting and incident-management systems
- Security dashboards

### Security assumptions

- Logs can contain sensitive information.
- Attackers may attempt to disable, alter, or evade monitoring.

### Required controls

- centralised logging
- restricted log-reader roles
- log redaction and structured logging
- alerting on logging disablement
- retention and integrity controls
- tested alerts and runbooks
- no secrets or restricted payloads in logs

## TB-15 — Backup and recovery systems to production data

### Components

- Database backups
- Storage backups
- Recovery identities and procedures
- Restored environments

### Security assumptions

- Backups may contain the same restricted data as production.
- Restore permissions can be abused to create uncontrolled copies.

### Required controls

- encrypted backups
- restricted restore permissions
- retention and deletion policies
- restore audit logging
- isolated restore testing
- documented recovery procedures
- verification that restored data remains access-controlled

## Validation expectations

Each boundary will eventually have at least one validation method, such as:

- an automated authorisation test;
- a denied IAM action;
- a network-connectivity test;
- a failed deployment-policy test;
- a security alert simulation;
- a data-leakage test;
- a backup restoration exercise.

Validation evidence will be linked from the threat register and security control matrix as implementation progresses.
