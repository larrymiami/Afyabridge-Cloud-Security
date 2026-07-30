# Administrative Access

## Purpose

This document defines how engineers, security responders, operators, and emergency administrators reach AfyaBridge infrastructure and managed services without exposing administrative interfaces to the public internet or relying on broad network trust.

Administrative access combines identity, temporary privilege, device and session controls, approved network paths, service-specific authorization, and complete auditability.

## Design objectives

Administrative access must:

1. Use named workforce identities.
2. Require strong authentication and approved privileged elevation.
3. Avoid public SSH, RDP, database, cache, and management endpoints.
4. Separate production from non-production administration.
5. Preserve country-specific production boundaries.
6. Prefer managed control-plane access over direct host access.
7. Use short-lived credentials and impersonation.
8. Record the requester, approver, target, purpose, commands or actions where available, and expiry.
9. Support emergency access without creating permanent backdoors.
10. Deny access when identity, scope, device, route, or approval cannot be validated.

## Administrative access classes

| Class | Examples | Default method |
|---|---|---|
| Cloud control plane | IAM, projects, networks, managed services | Google Cloud console or API with group-based IAM and temporary elevation |
| Runtime operations | Cloud Run revisions, jobs, logs, metrics | managed control plane; no shell by default |
| VM access | exceptional utility or appliance hosts | identity-aware proxy or approved bastion pattern |
| Database administration | schema review, migration, incident analysis | private connection through controlled proxy or approved administrative path |
| Network administration | firewall, route, DNS, load balancer changes | infrastructure-as-code pipeline; emergency manual path is exceptional |
| Security investigation | logs, asset inventory, alerts, evidence | central security tools with read-only or scoped elevated roles |
| Break-glass | severe control-plane or identity failure | isolated emergency identity with post-use review |

## Default access model

Routine administration follows this sequence:

1. The operator authenticates with a unique workforce identity and MFA.
2. Baseline group membership establishes eligibility but not unrestricted administrator access.
3. The operator requests temporary elevation for a named environment, country, role, and task.
4. An independent approver validates the request.
5. Time-bound group membership or impersonation is activated.
6. The operator uses an approved control-plane or identity-aware path.
7. The target service separately validates the operator or impersonated identity.
8. Activity is logged and correlated to the request.
9. Access expires automatically.
10. Revocation and evidence completeness are verified.

## Public administrative exposure

The following are prohibited by default:

- SSH or RDP open to `0.0.0.0/0`;
- public database administration endpoints;
- public cache or message-broker administration;
- unauthenticated internal dashboards;
- permanent VPN access that implicitly grants production reachability;
- shared bastion credentials;
- direct access from personal unmanaged devices;
- long-lived service-account keys for administration.

## Managed control-plane preference

Operators should use managed APIs, consoles, and service-specific administration features before requesting host-level access.

Examples include:

- viewing logs instead of opening a shell;
- executing a controlled migration job instead of connecting manually to a database;
- deploying through CI/CD instead of editing a runtime directly;
- using an approved query interface with read-only credentials instead of broad database administration;
- changing firewall and DNS configuration through reviewed Terraform.

Host-level or direct data-plane access requires a stronger justification and narrower duration.

## VM and bastion access

The architecture does not require a permanent internet-facing bastion.

Where VM access is unavoidable:

- the VM has no public administrative port;
- access uses an identity-aware proxy, managed session service, or tightly controlled private bastion;
- OS Login or equivalent named identity mapping is required;
- local shared accounts are prohibited;
- privilege escalation is separately controlled;
- session and command telemetry is enabled where supported;
- file transfer is restricted and logged;
- the host is hardened, patched, monitored, and disposable where practical;
- the access path is country- and environment-specific.

A shared bastion must not become a route between production countries or between non-production and production.

## Database administration

Production database access is exceptional and task-specific.

Requirements include:

- temporary approved elevation;
- private network path;
- named or impersonated database identity;
- TLS with server verification;
- read-only access unless a change is explicitly approved;
- country-specific target and scope;
- query and connection logging consistent with privacy requirements;
- no export of raw health data to unmanaged endpoints;
- use of controlled migration jobs for repeatable schema changes;
- immediate revocation after the task.

Break-fix access does not bypass application or data-governance obligations.

## Network administration

Normal network changes occur through reviewed infrastructure code.

Manual production changes require:

- an active incident or emergency change record;
- temporary network-admin elevation;
- an independent approver where circumstances permit;
- precise target scope;
- before-and-after configuration capture;
- validation that country and environment isolation remain intact;
- follow-up reconciliation into code;
- drift removal and post-change review.

## Device and session expectations

Privileged sessions should require:

- organization-managed or explicitly approved device;
- supported operating system and security updates;
- screen lock and disk encryption;
- endpoint protection appropriate to the risk;
- recent MFA or step-up authentication;
- limited session lifetime;
- prohibition of credential persistence;
- no copying sensitive data into personal storage or consumer applications.

Where device posture cannot be enforced technically, it remains a documented control requirement and implementation gap.

## Country and environment scope

Administrative access is not global by default.

- Kenya production operators receive Kenya-scoped roles.
- Ghana production operators receive Ghana-scoped roles.
- South Africa production operators receive South Africa-scoped roles.
- Staging and development access do not imply production access.
- Shared security personnel receive only the cross-country visibility required for monitoring and response.
- Cross-country operational access requires explicit approval and a documented business or incident need.

## Service-account impersonation

Human operators may impersonate a task-specific service account when this provides narrower and more attributable access than granting a human role directly.

Controls include:

- no service-account keys;
- a dedicated service account for the task class;
- separate permission to impersonate and permission held by the service account;
- short-lived tokens;
- country and environment scope;
- audit logging of both the human principal and impersonated identity;
- automatic expiry of the human’s impersonation eligibility.

## Emergency access

Break-glass access follows the privileged-access architecture and must not depend on the same failed control it is intended to recover.

Emergency accounts must:

- be individually attributable;
- use strong independent authentication;
- remain disabled or tightly restricted when not in use;
- trigger immediate alerts;
- have narrowly defined recovery permissions;
- avoid persistent network tunnels or shared credentials;
- be reviewed and rotated after use;
- be tested periodically without accessing real sensitive data unnecessarily.

## Third-party administration

Vendor or partner support access is denied by default.

When required, it must be:

- sponsored by an AfyaBridge owner;
- tied to a named individual;
- limited to a specific service, environment, country, and time window;
- protected by MFA;
- routed through an approved identity-aware method;
- monitored during the session where risk warrants;
- revoked and verified after completion;
- prohibited from creating additional accounts, keys, tunnels, or persistence.

## Logging and monitoring

Required evidence includes:

- authentication and MFA outcome;
- elevation request, approval, role, scope, start, and expiry;
- console, API, proxy, bastion, and database connection records;
- service-account impersonation events;
- privileged commands or configuration changes where available;
- downloads, exports, and file transfers involving sensitive data;
- break-glass use;
- failed attempts to reach public or unauthorized administrative endpoints;
- reconciliation of emergency changes into infrastructure code.

Alerts should cover:

- administrative access without an active elevation record;
- access from an unexpected country, environment, device, or network path;
- public administrative port creation;
- repeated denied proxy or database connections;
- use of a dormant emergency identity;
- creation of service-account keys;
- privileged session continuing after expiry;
- vendor access outside the approved window.

## Validation

Required tests include:

1. Public SSH, RDP, and database administration endpoints are denied.
2. A baseline engineer cannot administer production without elevation.
3. Temporary elevation grants only the requested country, environment, and role.
4. Access expires automatically and an active session can no longer perform privileged actions.
5. A non-production operator cannot use the administrative path to reach production.
6. A Kenya administrator cannot reach Ghana or South Africa production targets without separate approval.
7. Service-account impersonation logs both human and machine identity.
8. Vendor access fails outside its approved time window.
9. Emergency use triggers alerts and produces post-use evidence.
10. Manual emergency changes are detected as drift until reconciled into code.

## Status

**Designed.** Identity-aware access, device controls, proxy configuration, administrative roles, session logging, tests, and evidence are not yet implemented.