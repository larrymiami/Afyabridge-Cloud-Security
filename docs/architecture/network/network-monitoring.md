# Network Monitoring

## Purpose

This document defines the network telemetry, detection, alerting, review, and evidence requirements for AfyaBridge network and perimeter controls.

Network monitoring must support both security investigations and operational diagnosis without relying on unrestricted packet capture or excessive collection of sensitive payload data.

## Design objectives

Network monitoring must:

1. Provide visibility across public ingress, private east-west traffic, administrative access, managed-service connectivity, DNS, and egress.
2. Preserve country and environment context.
3. Detect policy violations and unexpected topology changes.
4. Support investigation without exposing unnecessary patient or application content.
5. Centralize security-relevant metadata while preserving access boundaries.
6. Retain evidence according to risk and legal requirements.
7. Distinguish control design from deployed and tested monitoring.

## Telemetry sources

The monitoring design includes, where applicable:

| Source | Security use |
|---|---|
| VPC Flow Logs | source, destination, port, direction, volume, denied or unexpected communication |
| Firewall Rules Logging | allowed and denied rule evaluation, shadowed or unused rules |
| Load balancer logs | public request metadata, status, latency, route, backend selection |
| WAF and edge security logs | rule matches, rate limits, bot or abuse indicators |
| Cloud NAT logs | attributed outbound connections and destination analysis |
| DNS logs | query patterns, unexpected domains, resolution failures |
| VPN or private connectivity logs | tunnel status, peer changes, route changes |
| Service invocation logs | authenticated service-to-service calls and denied invocation |
| Administrative audit logs | network, DNS, certificate, route, firewall, and load-balancer changes |
| Asset inventory | topology, public exposure, subnet, route, forwarding, and firewall drift |
| Certificate monitoring | issuance, expiry, renewal, and hostname coverage |

Exact product configuration is deferred to implementation.

## Context requirements

Security-relevant network events should include or be enrichable with:

- timestamp;
- environment;
- country;
- project and VPC;
- source and destination resource;
- workload or principal identity where available;
- protocol and port;
- rule, route, or policy decision;
- request or correlation identifier;
- partner or integration identifier where relevant;
- deployment version or change reference;
- outcome;
- data classification or service criticality where available.

IP address alone is not sufficient identity evidence.

## Collection boundaries

Telemetry must minimize sensitive content.

The default design collects metadata rather than request or packet payloads. Full payload capture is not a standing control.

Any exceptional packet capture requires:

- incident or diagnostic purpose;
- defined target and duration;
- approval;
- secure storage;
- restricted access;
- deletion deadline;
- review for patient or credential exposure.

Secrets, authentication tokens, health-record contents, and complete webhook payloads must not be written to network security logs.

## Detection catalogue

### Public ingress detections

Detect or alert on:

- direct-origin access attempts;
- WAF blocks and repeated rule matches;
- abnormal request volume or geographic distribution;
- unexpected host headers or paths;
- TLS and certificate failures;
- public requests to administration routes;
- repeated authentication failures correlated with edge activity;
- traffic reaching a backend outside its intended country or environment.

### East-west detections

Detect or alert on:

- communication not present in the service dependency register;
- anonymous internal invocation;
- one workload contacting another country's production service;
- data-subnet access from an unapproved source;
- unusual port use;
- sudden fan-out or scanning behaviour;
- denied service invocation or firewall events;
- new communication following deployment or IAM changes.

### Egress detections

Detect or alert on:

- outbound traffic to unapproved destinations;
- new domains or autonomous systems;
- unexpected countries or regions;
- large or unusual data transfer;
- direct internet access that bypasses the approved NAT or proxy path;
- use of non-production partner endpoints by production workloads;
- repeated connection failures or beacon-like patterns;
- traffic outside the workload's approved schedule or profile.

### Administrative detections

Detect or alert on:

- creation of public IP addresses;
- SSH, RDP, database, or cache exposure;
- new or broadened firewall rules;
- default route changes;
- route advertisements or imports outside approved prefixes;
- Shared VPC attachment changes;
- DNS delegation changes;
- certificate issuance for unexpected names;
- administrative access outside an approved elevation window;
- network changes made outside Terraform or approved automation.

### Third-party detections

Detect or alert on:

- partner source-address changes;
- webhook signature or replay failures;
- unexpected tunnel routes;
- partner access to unrelated subnets or services;
- use of expired credentials or certificates;
- traffic after contract or access expiry;
- abnormal transfer volume.

## Dashboards

At minimum, dashboards should provide:

- public ingress availability, errors, WAF activity, and backend health;
- denied and allowed firewall activity by country and environment;
- outbound destinations and volume by workload;
- cross-boundary communication attempts;
- DNS and certificate health;
- private-service connectivity failures;
- VPN or partner tunnel health;
- network configuration changes;
- assets with public addresses or overly broad firewall exposure;
- logging coverage and telemetry gaps.

Security dashboards must not become an alternate path to sensitive application data.

## Alert severity

| Severity | Example |
|---|---|
| Critical | unexpected public database exposure, cross-country production route, active exfiltration indicator |
| High | direct-origin bypass, unauthorized firewall change, unapproved large egress transfer |
| Medium | repeated denied internal calls, new unapproved destination, partner source change |
| Low | stale rule, missing ownership metadata, expected certificate approaching renewal window |

Severity may increase based on production scope, data classification, persistence, or evidence of exploitation.

## Response integration

Network alerts must link to runbooks and incident procedures.

Response actions may include:

- preserve relevant logs;
- identify the responsible workload and principal;
- block a destination or source through an approved emergency procedure;
- revoke workload or partner credentials;
- disable an exposed endpoint;
- isolate a subnet or service;
- revert unauthorized network configuration;
- verify country and data boundary impact;
- perform post-incident rule and architecture review.

Emergency blocking must be reconciled back into configuration as code.

## Retention and access

Retention is risk-based and aligned with the centralized logging design.

Access follows least privilege:

- security responders receive broad security-metadata visibility where justified;
- country operations receive country-scoped operational views;
- application teams receive service-specific diagnostic access;
- auditors receive time-bound read-only evidence;
- raw logs containing sensitive metadata receive more restricted access.

Network logs must be protected from modification by workload project administrators where practical.

## Health and coverage monitoring

The monitoring system must detect its own failures.

Coverage checks include:

- subnets without expected flow logging;
- firewall rules without required logging;
- missing NAT, load-balancer, DNS, or VPN telemetry;
- log-sink failures;
- unexpected retention changes;
- silent alerting pipelines;
- unowned detections;
- dashboards with stale data;
- assets absent from inventory exports.

## Validation

Validation must demonstrate that:

- a denied firewall event is centrally searchable;
- an unapproved outbound connection generates evidence;
- a direct-origin attempt is detected;
- an unauthorized route or firewall change is surfaced;
- a cross-country communication attempt is denied and logged;
- a partner webhook replay is visible;
- removal of logging from a subnet or rule is detected;
- country operators cannot view another country's restricted network telemetry.

## Status

**Designed.** Monitoring is not represented as implemented until telemetry sources, detections, dashboards, tests, and retained evidence exist.
