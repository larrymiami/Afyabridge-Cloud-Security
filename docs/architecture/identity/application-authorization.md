# Application Authorization

## Purpose

This document defines how AfyaBridge authorizes application users after authentication. Google Cloud IAM controls access to cloud resources; application authorization controls access to health records, programmes, operational functions, and country data within the platform.

## Authorization model

AfyaBridge uses a combined role- and attribute-based model:

```text
Decision = authenticated identity
         + active account
         + assigned application role
         + country scope
         + programme scope
         + organization or facility assignment
         + record relationship
         + action context
```

No single role claim is sufficient for access to sensitive records.

## Authoritative attributes

| Attribute | Purpose |
|---|---|
| `subject_id` | Stable internal user identifier |
| `role` | Permitted function set |
| `country` | Country data boundary |
| `programme_ids` | Assigned programmes |
| `organization_ids` | Partner or operating organization scope |
| `facility_ids` | Facility or service location scope |
| `assignment_ids` | Active caseload or operational assignments |
| `employment_status` | Active, suspended, or terminated |
| `assurance_level` | Authentication strength where applicable |

Authorization data is resolved from a trusted server-side source. Client-supplied country, programme, organization, facility, or role values are not trusted.

## Baseline roles

| Role | Typical permissions |
|---|---|
| CHW | Create and update assigned household and screening records |
| Clinician | Review and update assigned clinical records |
| Supervisor | Review activity and manage assignments within an approved scope |
| Country operator | Operational administration within one country |
| Country security reviewer | Read country security and audit information |
| Programme manager | View approved programme-level reports and assignments |
| Support analyst | Limited support functions with sensitive fields masked |
| Auditor | Time-bound read-only access to approved evidence |
| Platform administrator | Platform configuration without automatic access to health records |

Detailed permissions are maintained in [`role-model.md`](./role-model.md).

## Country isolation

Every request involving country-controlled data must derive the effective country from trusted server-side context and verify that the user has an active assignment to that country.

Production authorization must deny:

- a Kenya-scoped user requesting Ghana or South Africa records;
- a global platform administrator accessing health records without a separate approved data role;
- a shared support identity accessing unmasked clinical data by default;
- a request whose record country cannot be determined.

## Programme and assignment checks

Country membership does not imply access to all programmes or records in that country. The application must enforce programme, facility, organization, and record-assignment constraints where relevant.

Examples:

- a CHW may access households currently assigned to that CHW;
- a supervisor may access records for teams under that supervisor;
- a programme manager may access aggregated programme reporting but not unrestricted clinical notes;
- a clinician may access records associated with an active consultation or approved facility relationship.

## API enforcement

Authorization is enforced at the server or policy layer for every protected operation. User-interface hiding is not an authorization control.

Each protected API operation must:

1. validate the authenticated subject;
2. resolve current authorization attributes;
3. determine the target resource scope;
4. evaluate the requested action;
5. deny by default when attributes or ownership are missing;
6. emit a structured authorization decision log for sensitive actions.

## Token handling

Tokens may carry stable identity and coarse session claims, but rapidly changing authorization state must be resolved server-side or use short-lived claims with revocation controls.

Tokens must not contain unnecessary health information. The application validates issuer, audience, signature, expiry, and required assurance claims.

## Sensitive operations

The following require enhanced authorization and audit treatment:

- exporting identifiable data;
- changing country or programme assignments;
- modifying clinical content after finalization;
- bulk record access;
- changing another user's role;
- overriding record ownership;
- accessing break-glass functionality;
- deleting or restoring records.

Enhanced controls may include step-up authentication, dual approval, a business justification, limited duration, and additional alerting.

## Deny-by-default rules

Access is denied when:

- the user is inactive, suspended, or terminated;
- the requested role is not assigned;
- country, programme, organization, facility, or assignment scope does not match;
- the target record has no trustworthy scope metadata;
- the policy service is unavailable and the operation is sensitive;
- the request attempts to use a stale or revoked session;
- an elevated grant has expired.

## Offline operation

Offline-capable clients may retain only the minimum records required for current assignments. Authorization is revalidated during synchronization.

The server must reject synchronized changes when:

- the user's assignment was revoked before synchronization;
- the record belongs to another country or programme;
- the operation is outside the role's permissions;
- the request is replayed or has invalid integrity metadata.

## Logging

Authorization logs should capture:

- subject identifier;
- action;
- target resource type and identifier;
- effective country and programme;
- decision;
- policy or reason code;
- elevated-access reference where applicable;
- request correlation identifier.

Sensitive record content must not be copied into authorization logs.

## Testing

Required negative tests include:

- cross-country record access;
- cross-programme access;
- access after assignment removal;
- privilege escalation through modified client claims;
- direct API use bypassing the interface;
- expired elevation;
- bulk export by an unauthorized role;
- offline synchronization after revocation.

## Traceability

Primary objectives: `IAM-01`, `IAM-06`, `APP-01`, `APP-02`, `APP-03`, `APP-04`, `APP-05`.

Primary threats: `TH-001`, `TH-002`, `TH-003`, `TH-010`, `TH-012`, `TH-015`, `TH-020`.

## Status

**Designed**
