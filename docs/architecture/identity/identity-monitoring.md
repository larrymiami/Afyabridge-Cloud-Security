# Identity Monitoring

## Purpose

This document defines the monitoring, detection, and evidence requirements for workforce, workload, application, CI/CD, external, and emergency identities in AfyaBridge Cloud Security.

The objective is to make identity use observable enough to detect misuse, investigate incidents, verify control operation, and support periodic access reviews without centralising unrestricted access to country health data.

## Scope

Identity monitoring covers:

- workforce sign-in and session activity;
- Google Cloud IAM policy changes;
- Google Group membership changes;
- service-account use and impersonation;
- Workload Identity Federation exchanges;
- application authentication and authorisation decisions;
- privileged elevation and break-glass use;
- external identity access;
- access review outcomes and overdue remediation;
- identity-related configuration drift.

## Monitoring principles

1. Identity events must be attributable to a named human, workload, or external principal.
2. High-risk identity changes must generate security-relevant events.
3. Monitoring data must not contain secrets, tokens, passwords, or unnecessary health information.
4. Country scope and environment must be present where relevant.
5. Detection logic must cover both successful and denied activity.
6. Privileged activity must receive stronger monitoring than ordinary access.
7. Log access must be separated from the ability to modify the monitored systems.
8. Retention must support investigation, certification, and audit requirements.

## Required event sources

| Source | Required events |
|---|---|
| Cloud Audit Logs | IAM changes, service-account impersonation, organisation-policy changes, secret and key access, administrative actions |
| Identity provider | sign-in, MFA challenge, account disablement, suspicious session, recovery changes |
| Google Groups | membership addition, removal, owner change, nested group change |
| GitHub Actions | workflow identity, repository, ref, environment, actor, approval, federation result |
| Workload Identity Federation | subject, audience, provider, target service account, token exchange outcome |
| Application audit logging | authentication result, role evaluation, country/programme scope, denied authorisation, privileged action |
| Access workflow | request, approval, activation, expiry, revocation, exception, review outcome |
| Break-glass process | credential access, sign-in, elevation, action summary, deactivation, post-event review |

## Identity event schema

Security-relevant identity events should include, where applicable:

- timestamp;
- event type;
- actor principal;
- actor type;
- target principal or resource;
- environment;
- country;
- programme or organisation scope;
- source system;
- authentication method;
- session or request correlation identifier;
- action;
- result;
- reason for denial;
- approval or ticket reference;
- privilege level;
- source repository and ref for CI/CD;
- source IP or network context where available;
- device or client context where appropriate;
- expiry time for temporary access.

Tokens, credentials, authentication secrets, clinical data, and full request payloads must not be logged.

## Detection catalogue

### Workforce detections

| Detection | Priority | Response expectation |
|---|---:|---|
| Successful sign-in without required MFA | Critical | disable or contain session immediately |
| Sign-in by disabled or departed identity | Critical | revoke access and investigate provisioning failure |
| Production access from non-production-only group | High | revoke access and inspect group inheritance |
| Direct user IAM grant outside approved exception | High | remove or validate exception |
| Privileged group membership without active approval | High | remove membership and investigate |
| Unusual country or location for privileged session | High | validate user and session |
| Repeated authentication failures followed by success | Medium | inspect for credential attack |
| Dormant account becomes active | Medium | verify employment and business need |

### Workload and CI/CD detections

| Detection | Priority | Response expectation |
|---|---:|---|
| Service-account key creation or upload | Critical | disable key and investigate policy bypass |
| Federation from an unapproved repository, branch, tag, or environment | Critical | deny and investigate trust configuration |
| Unexpected service-account impersonation | High | revoke binding and inspect workload activity |
| Production deployment outside approved workflow | High | halt deployment and investigate |
| Workload identity used from an unexpected project or runtime | High | contain workload and review IAM |
| High-volume token exchange failures | Medium | inspect trust conditions and possible abuse |
| Runtime service account receives deployment permissions | High | remove permission and review role drift |

### Application authorisation detections

| Detection | Priority | Response expectation |
|---|---:|---|
| Cross-country access denial burst | High | inspect account, token claims, and application logic |
| Attempt to modify country or programme claims client-side | High | invalidate session and investigate |
| Privileged action without active elevated session | Critical | block action and initiate incident review |
| Access after assignment expiry | High | revoke session and repair lifecycle control |
| Bulk record access inconsistent with role | High | contain account and investigate data exposure |
| Repeated denied access to sensitive records | Medium | assess misuse or compromised account |

### Break-glass detections

Any break-glass sign-in is a high-priority event. Monitoring must verify:

- the account was activated for a declared incident;
- strong authentication was used;
- actions remained within the approved emergency scope;
- standing access was not created;
- credentials or recovery material were rotated after use;
- the account returned to its inactive state;
- a post-event review was completed.

## Alert routing

Identity alerts should route according to severity:

| Severity | Initial destination | Required escalation |
|---|---|---|
| Critical | security on-call and platform owner | incident process immediately |
| High | security operations queue | same business day, immediately when production is affected |
| Medium | identity governance or platform queue | triage within two business days |
| Low | periodic control review | address through planned remediation |

Country operational teams may receive country-specific alerts, but access to central identity evidence must remain role-restricted.

## Dashboards and reporting

Identity dashboards should provide:

- active privileged memberships;
- expiring temporary grants;
- direct IAM bindings;
- service-account impersonation volume;
- Workload Identity Federation exchanges by repository and environment;
- failed and denied authorisation trends;
- inactive identities with access;
- external identities and sponsorship expiry;
- break-glass readiness and use;
- overdue access reviews and remediation;
- unresolved identity-policy drift.

Dashboards are operational aids and do not replace source logs or retained evidence.

## Drift monitoring

Automated checks should identify:

- basic Owner or Editor roles;
- direct user IAM bindings;
- service-account keys;
- unapproved workload identity principals;
- cross-environment access paths;
- missing expiry conditions;
- production groups with unexpected members;
- inactive users retaining application or cloud access;
- identities assigned to conflicting roles;
- group nesting that expands country access;
- emergency accounts missing readiness checks.

Detected drift must create a traceable remediation item.

## Evidence and retention

Identity evidence should include:

- raw audit events in the approved logging destination;
- alert records and investigation outcomes;
- access request and approval records;
- activation and expiry records;
- review certification results;
- break-glass test and use records;
- detection test results;
- exception records.

Retention periods must be documented in the logging architecture and applied consistently. Exported evidence must minimise personal and health information.

## Validation requirements

The identity-monitoring design is validated when tests demonstrate that:

1. a direct production user grant is detected;
2. service-account key creation is denied or alerted;
3. an unapproved GitHub ref cannot federate;
4. privileged activation and expiry are visible;
5. cross-country authorisation denial is logged without exposing health data;
6. break-glass use creates a high-priority alert;
7. departed-user activity is detected;
8. access-review exceptions and overdue remediation appear in reporting.

## Threat and objective traceability

This document primarily supports:

- TH-001 compromised CHW account;
- TH-002 cross-country or programme access;
- TH-003 excessive country administrator privilege;
- TH-004 stolen or leaked CI/CD credential;
- TH-013 compromised service account and lateral movement;
- TH-014 unauthorised KMS or secret access;
- TH-017 logging disabled or bypassed;
- TH-020 lost or stolen CHW device.

Relevant security objectives include IAM-01 through IAM-07, APP-01 through APP-06, CICD-01 through CICD-04, MON-01 through MON-06, and IR-01 through IR-05.

## Status

**Designed**. Detection rules, dashboards, alert routes, tests, and evidence are added in later implementation phases.
