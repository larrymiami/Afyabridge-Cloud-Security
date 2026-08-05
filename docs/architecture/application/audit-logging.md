# Application Audit Logging

## Status

Implemented in the application baseline, but not yet operationally validated.

## Purpose

Audit events provide attributable evidence for security-relevant application actions without recording Restricted payloads.

## Required event fields

Each event must include:

- event identifier and timestamp;
- request or correlation identifier;
- actor identifier and actor type;
- country and programme scope;
- action and resource type;
- resource identifier where safe;
- decision: allowed, denied, failed, or completed;
- policy reason for denied actions;
- source service and environment;
- non-sensitive outcome metadata.

## Events in scope

The baseline records or prepares events for:

- session inspection;
- household creation and retrieval;
- authorization denial;
- validation failure;
- authentication failure;
- security-sensitive configuration failure;
- future patient, referral, export, sync, and administrative actions.

## Prohibited content

Audit events must not contain:

- clinical notes or symptoms;
- names, phone numbers, addresses, or free-text household descriptions;
- tokens, cookies, passwords, secrets, or authorization headers;
- complete request or response bodies;
- database connection strings;
- encryption key material.

## Integrity and access

Application workloads append events but do not modify historical events. Audit readers are separate from routine application operators. Production retention, routing, immutability, alerting, and country residency will be implemented in later infrastructure and operations milestones.

## Failure behavior

An audit delivery failure must be observable. Security-critical state-changing actions should fail closed when the required audit record cannot be durably accepted, unless an approved availability exception exists.

## Validation evidence

Operational validation requires:

- tests showing required fields are emitted;
- tests proving Restricted payloads are excluded;
- denial and failure event tests;
- deployed sink and access-policy evidence;
- retention and integrity configuration;
- alert evidence for delivery failures and suspicious access patterns.
