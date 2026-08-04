# DNS and Certificate Management

## Purpose

This document defines DNS ownership, naming boundaries, certificate issuance, renewal, validation, and failure handling for AfyaBridge public and private services.

DNS and certificates are security controls. A valid route or certificate must not be created outside the approved country, environment, and service ownership model.

## Design objectives

DNS and certificate management must:

1. Preserve environment and country separation.
2. Prevent unauthorized domain and certificate issuance.
3. Use automated certificate renewal where supported.
4. Keep private service names out of public DNS unless explicitly approved.
5. Provide auditable change control and ownership.
6. Detect dangling records, expired certificates, and unexpected issuers.
7. Support safe failover without bypassing edge or authorization controls.

## DNS hierarchy

The design uses delegated zones aligned to environment and service purpose.

Example logical structure:

| Scope | Example |
|---|---|
| Public production | `example.org` |
| Kenya production | `ke.example.org` |
| Ghana production | `gh.example.org` |
| South Africa production | `za.example.org` |
| Staging | `stg.example.org` |
| Development | `dev.example.org` |
| Internal private services | private zones scoped to the relevant VPC |

The actual registered domain is an implementation input. This document defines the control model rather than claiming a domain is already configured.

## Public DNS rules

Public DNS records may point only to approved public entry points such as managed HTTPS load balancers or other reviewed edge services.

Prohibited patterns include:

- public records pointing directly to private workload addresses;
- public records exposing database, cache, administration, or connector endpoints;
- production records pointing to non-production origins;
- wildcard records without documented need and ownership;
- long-lived test records under production zones;
- records that bypass the managed security edge.

DNS changes are managed through code or an approved change process. Manual changes are treated as drift.

## Private DNS

Private DNS zones are scoped to the country or environment VPC that requires them.

Requirements:

- private names do not resolve from unrelated country or environment networks;
- zone associations are explicit;
- forwarding rules do not create transitive resolution paths;
- split-horizon DNS is documented and tested;
- private names do not disclose unnecessary patient, facility, or business identifiers;
- internal records have clear owners and lifecycle controls.

A shared-services project must not automatically gain resolution of all country-private zones.

## DNS naming standard

DNS names should identify environment, country, and service where this improves operational clarity.

Examples:

```text
api.ke.example.org
webhook.ke.example.org
api.gh.example.org
admin.stg.example.org
```

Names must not embed sensitive data such as patient identifiers, internal ticket numbers, credentials, or secret values.

## Certificate issuance

Managed certificates are preferred for public HTTPS services where supported.

Certificate issuance must be restricted to approved domains and managed by designated infrastructure identities.

Requirements:

- no routine developer issuance of production certificates;
- separate certificate resources by environment;
- certificate private keys are non-exportable where platform support permits;
- wildcard certificates are avoided unless operationally justified;
- imported certificates require documented custody and rotation;
- certificate issuance and replacement events are logged;
- certificate authority and domain validation methods are approved.

## Certificate scope

A certificate must cover only the required hostnames.

Country-specific production hostnames should not share a broad certificate where separate certificates improve isolation and revocation.

A compromised or misissued certificate for one country must be removable without disrupting unrelated country services where practical.

## Renewal and expiry

Automated renewal is the default.

Monitoring must alert before expiry at defined thresholds, for example:

- 45 days: ownership and renewal-path verification;
- 30 days: warning;
- 14 days: urgent action;
- 7 days: incident-level escalation.

Imported or partner-managed certificates require an explicit renewal owner and tested replacement procedure.

## DNS security controls

Controls include:

- least-privilege DNS administration;
- group-based and temporary privileged access;
- registrar account MFA and recovery controls;
- domain-locking features where available;
- approved nameserver configuration;
- monitoring for nameserver and delegation changes;
- review of TXT records used for validation;
- removal of stale verification records;
- DNSSEC evaluation for public zones where operationally supported.

DNSSEC is recorded as a design consideration until implementation and validation evidence exist.

## Dangling record prevention

A DNS record must not remain after its target service is removed.

Decommissioning requires:

1. remove or disable application traffic;
2. verify no required clients depend on the record;
3. remove DNS records;
4. remove certificate resources;
5. verify the former target cannot be claimed by another party;
6. record teardown evidence.

Automated checks should identify records pointing to missing, deleted, or unowned targets.

## Failover and recovery

DNS failover must not bypass required controls.

A recovery target must:

- use an approved region and environment;
- terminate through equivalent edge protection;
- present an approved certificate;
- enforce the same authentication and authorization model;
- preserve country and data boundaries;
- be tested before production reliance.

Lowering TTLs or changing records during an incident does not authorize an unreviewed destination.

## Monitoring

Monitor for:

- unauthorized record changes;
- nameserver and delegation changes;
- newly created public records;
- records pointing outside approved services or regions;
- certificate issuance for unexpected names;
- certificate expiry and renewal failures;
- TLS downgrade or invalid-chain events;
- dangling records;
- wildcard expansion;
- production names resolving to non-production targets.

## Validation

Validation must demonstrate that:

- country-private names do not resolve from other country networks;
- production DNS cannot point to a non-production origin without policy failure;
- only approved identities can modify production zones;
- certificate renewal succeeds without manual key export;
- an expired or invalid certificate is detected before service impact;
- decommissioning removes records and certificate resources;
- direct-origin hostnames are not publicly exposed.

## Status

**Designed.** DNS zones, records, certificates, and registrar controls are not represented as implemented until configuration and evidence are present.
