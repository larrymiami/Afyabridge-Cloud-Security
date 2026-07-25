# Naming and Labeling Standard

## 1. Purpose

This document defines naming, project-ID, label, and metadata standards for the AfyaBridge Cloud Security landing zone.

The standard supports:

- environment and country separation;
- ownership and accountability;
- cost attribution;
- asset inventory and posture analysis;
- automation and policy enforcement;
- incident investigation;
- safe cleanup of temporary resources.

Names are operational identifiers, not substitutes for IAM, network, data, or encryption boundaries.

## 2. Design principles

1. Names must be predictable but must not expose sensitive data.
2. Project IDs must remain globally unique and immutable after creation.
3. Resource display names should be human-readable.
4. Labels must carry attributes that are unsuitable for names.
5. Country, environment, workload, owner, and management method must be discoverable.
6. Temporary resources must include an expiry indicator.
7. Naming logic must be implemented in shared Terraform modules rather than copied manually.
8. Abbreviations must come from controlled vocabularies.

## 3. Standard components

The preferred naming sequence is:

```text
<organisation>-<environment>-<country-or-scope>-<workload>-<resource-purpose>[-<sequence>]
```

Not every Google Cloud resource supports the same length or character set. Terraform modules may shorten the sequence while retaining the same semantic order.

### Controlled values

| Attribute | Values or format |
|---|---|
| Organisation | `afyabridge` or shortened `afb` where required |
| Environment | `prd`, `stg`, `dev`, `sbx`, `common`, `bootstrap` |
| Country | ISO 3166-1 alpha-2 lowercase: `ke`, `gh`, `za`; use `global` or `shared` only for genuinely shared scope |
| Workload | Controlled lowercase identifier such as `chw`, `referral`, `analytics`, `security`, `logging`, `network`, `cicd` |
| Purpose | Resource-specific function such as `app`, `data`, `ops`, `api`, `sync`, `state`, `logs`, `artifacts` |
| Sequence | Two-digit suffix such as `01` when multiple equivalent resources are required |

## 4. Project IDs and project names

### 4.1 Project ID format

```text
afyabridge-<environment>-<scope>-<purpose>
```

Examples:

```text
afyabridge-prd-ke-app
afyabridge-prd-ke-data
afyabridge-prd-ke-ops
afyabridge-prd-gh-app
afyabridge-prd-za-data
afyabridge-stg-shared-app
afyabridge-dev-shared-app
afyabridge-common-security
afyabridge-common-logging
afyabridge-common-network
afyabridge-common-cicd
afyabridge-common-artifacts
afyabridge-bootstrap-core
```

If a project ID is unavailable globally, a short non-sensitive suffix may be appended:

```text
afyabridge-prd-ke-app-a1
```

Random suffixes must be generated and recorded by the project factory. They must not encode account numbers, personal names, or secrets.

### 4.2 Project display-name format

```text
AfyaBridge <Environment> <Country or Scope> <Purpose>
```

Example:

```text
AfyaBridge Production Kenya Application
```

## 5. Folder names

Folder display names use title case and must remain stable:

```text
Bootstrap
Common Services
Production
Non-Production
Sandbox
Kenya
Ghana
South Africa
Development
Staging
```

Folder names are not used as the only enforcement mechanism. Folder IDs must be consumed by Terraform and policy modules.

## 6. Resource naming examples

| Resource | Pattern | Example |
|---|---|---|
| Service account | `<env>-<scope>-<workload>-<purpose>` | `prd-ke-referral-runtime` |
| Cloud Run service | `<env>-<scope>-<workload>` | `prd-ke-referral` |
| GKE cluster | `<env>-<scope>-<purpose>-<nn>` | `prd-ke-app-01` |
| VPC network | `<env>-<scope>-vpc` | `prd-ke-vpc` |
| Subnet | `<env>-<scope>-<region-code>-<purpose>` | `prd-ke-afs1-app` |
| Firewall policy/rule | `<env>-<scope>-<action>-<source>-to-<target>` | `prd-ke-allow-lb-to-app` |
| Cloud SQL instance | `<env>-<scope>-<workload>-db` | `prd-ke-core-db` |
| Storage bucket | `<org>-<env>-<scope>-<purpose>-<unique>` | `afyabridge-prd-ke-backup-a1` |
| KMS key ring | `<env>-<scope>-<purpose>` | `prd-ke-data` |
| KMS key | `<workload>-<data-class>` | `core-restricted` |
| Secret | `<env>-<scope>-<workload>-<purpose>` | `prd-ke-referral-db-password` |
| Artifact repository | `<env-or-scope>-<format>-<purpose>` | `prod-docker-apps` |
| Log bucket | `<env>-<scope>-<purpose>` | `prd-ke-audit` |
| Pub/Sub topic | `<env>-<scope>-<event>` | `prd-ke-referral-created` |
| Terraform state prefix | `<environment>/<scope>/<stack>` | `production/ke/application` |

## 7. Region codes

Where resource length constraints make full region names impractical, use controlled short codes:

| Region | Code |
|---|---|
| `africa-south1` | `afs1` |
| `europe-west1` | `euw1` |
| `me-central1` | `mec1` |

The authoritative region remains a separate Terraform variable and label. Short codes must not be parsed as the source of truth.

## 8. Required labels

Every label-capable resource must include the following where applicable:

| Label | Example | Purpose |
|---|---|---|
| `environment` | `prd` | Environment boundary |
| `country` | `ke` | Country ownership; `shared` for approved shared services |
| `workload` | `referral` | Application or platform workload |
| `owner` | `platform-engineering` | Accountable team |
| `managed_by` | `terraform` | Management authority |
| `data_classification` | `restricted` | Data-handling requirement |
| `cost_center` | `country-ke` | Cost attribution |
| `criticality` | `high` | Operational priority |
| `repository` | `afyabridge-cloud-security` | Source repository |
| `stack` | `production-ke-application` | Terraform state or deployment stack |

### Conditional labels

| Label | When required | Example |
|---|---|---|
| `expiry_date` | Temporary or sandbox resource | `2026-08-31` |
| `exception_id` | Resource covered by a policy exception | `exc-004` |
| `backup_policy` | Stateful or protected data resource | `daily-30d` |
| `recovery_tier` | Resource has a recovery objective | `tier-1` |
| `contains_pii` | Resource stores or processes identifiable records | `true` |
| `internet_exposure` | Resource has an approved public entry point | `edge-only` |

## 9. Label value rules

- lowercase only;
- letters, numbers, underscores, and hyphens where supported;
- no spaces;
- no email addresses;
- no personal names unless they are approved team identifiers;
- no patient, household, facility, or credential data;
- no mutable operational status such as `healthy` or `incident-open`;
- use controlled values rather than free-form descriptions.

## 10. Data-classification values

Allowed values:

```text
public
internal
confidential
restricted
```

When a resource handles multiple classes, assign the highest classification.

A `restricted` label does not by itself enforce encryption, access, network, retention, or logging requirements. It is an input into those controls.

## 11. Ownership values

Initial approved owner values:

```text
platform-engineering
security-engineering
application-engineering
data-engineering
country-operations
```

The owner label identifies an accountable team, not an individual. Escalation contacts belong in an external ownership registry or service catalogue.

## 12. Cost-centre values

Initial values:

```text
shared-platform
shared-security
shared-network
country-ke
country-gh
country-za
engineering-lab
```

A project may contain only cost centres consistent with its folder and purpose unless an approved exception exists.

## 13. Temporary-resource controls

Temporary resources must include:

- `environment=sbx` or an approved temporary environment;
- `expiry_date`;
- `owner`;
- `cost_center`;
- `managed_by`;
- cleanup instructions or automation.

Resources past their expiry date should be reported automatically and deleted after an owner review or according to an approved sandbox policy.

Production resources must not use an expiry date as an automated deletion trigger.

## 14. Name and label validation

Validation should occur in:

1. Terraform variable validation;
2. reusable naming modules;
3. pull-request policy checks;
4. project-factory validation;
5. asset inventory and posture queries;
6. periodic cleanup reports.

A resource missing mandatory metadata must be blocked where technically feasible or reported before deployment approval.

## 15. Exceptions

Naming or labeling exceptions require:

- an exception ID;
- affected resources;
- technical reason;
- owner;
- compensating discovery mechanism;
- expiry or review date.

Provider-generated resource names do not require an exception when the parent managed resource contains the required labels and ownership metadata.

## 16. Security considerations

Names and labels must not contain:

- credentials or key material;
- personal or household identifiers;
- health conditions;
- internal incident details;
- vulnerability details that expose an active weakness;
- confidential partner names where unnecessary;
- exact administrative access paths.

Predictable names can help attackers understand architecture. Security therefore depends on strong access controls, private networking, and monitoring rather than obscurity.

## 17. Planned evidence

- Terraform naming module tests;
- failed validation for missing labels;
- project inventory grouped by country and environment;
- cost report grouped by `cost_center`;
- expired sandbox-resource report;
- policy exception example;
- asset query identifying resources not managed by Terraform.

## 18. Related objectives and threats

### Security objectives

- CSPM-06 — maintain asset visibility;
- CSPM-07 — track remediation;
- GOV-01 — enforce resource metadata;
- GOV-05 — control cloud cost;
- GOV-06 — support country onboarding;
- RES-05 — remove lab infrastructure safely.

### Threats

- TH-009 — insecure infrastructure-as-code change;
- TH-016 — cloud posture drift creates an unmonitored exposure;
- TH-021 — backup exposure or uncontrolled restoration.

## 19. Review triggers

Review this standard when:

- a new country or environment is added;
- a Google Cloud resource imposes incompatible naming constraints;
- the ownership model changes;
- cost allocation requirements change;
- policy checks expose ambiguity;
- incident investigation requires additional metadata;
- project-factory inputs change.
