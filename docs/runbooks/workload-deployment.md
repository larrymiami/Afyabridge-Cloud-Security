# Workload deployment runbook

## Purpose

Deploy and validate the v0.7D country-scoped workload foundation in a controlled Google Cloud environment.

This runbook assumes the organization, folders, projects, Shared VPC networks, private service access, restricted API routing, DNS, and Serverless VPC Access connectors from earlier milestones already exist and have been validated.

## Safety boundary

Do not run `terraform apply` directly from an unreviewed local branch. Use a reviewed plan, approved production values, short-lived credentials, and an auditable execution environment.

The example inventory contains synthetic project identifiers and image digests. Replace and review them before planning.

## Prerequisites

Confirm:

- Terraform `1.15.5` is installed;
- the Google provider lockfile has been generated and reviewed;
- the deployment identity has only the required country-scoped permissions;
- required Google Cloud APIs are enabled;
- country application projects exist;
- country Shared VPC service-project attachments are active;
- private service access is established for Cloud SQL;
- Serverless VPC Access connectors exist in the correct projects and regions;
- KMS key and dependent resource locations are compatible;
- managed-service agents can be identified before CMEK IAM is granted;
- Artifact Registry images exist and are referenced by immutable digest;
- secret payloads are available through a separate controlled process.

## Prepare the workload root

```bash
cd infra/terraform/environments/workloads
cp terraform.tfvars.example terraform.tfvars
```

Replace all synthetic values. Review at minimum:

- project IDs;
- countries and environments;
- regions and locations;
- KMS key ring and key names;
- IAM principals;
- Shared VPC network resource names;
- Serverless VPC Access connector resource names;
- Cloud Run image digests;
- Cloud SQL sizing, availability, backup, and maintenance settings;
- storage retention and lifecycle rules;
- Secret Manager replication and rotation metadata.

Never place secret payloads, database passwords, private keys, or access tokens in `terraform.tfvars`.

## Initialize and validate

```bash
terraform init
terraform fmt -check -recursive
terraform validate
```

Review the generated or updated `.terraform.lock.hcl`. Do not hand-author provider hashes.

## Produce the plan

```bash
terraform plan -out=v0.7d.tfplan
terraform show -no-color v0.7d.tfplan > v0.7d-plan.txt
```

Store plan output only in an approved evidence location. Treat it as potentially sensitive because resource names and IAM principals may reveal environment details.

## Plan review gates

Reject the plan if it contains:

- `allUsers` or `allAuthenticatedUsers`;
- service-account key creation;
- plaintext secret versions or database passwords;
- public Cloud SQL IPv4;
- Cloud Run ingress set to unrestricted public traffic;
- mutable container tags where a digest is required;
- cross-country IAM principals or shared resource identifiers without an approved exception;
- bucket `force_destroy = true`;
- disabled deletion protection on production resources;
- unexpected replacement or deletion of KMS keys, databases, buckets, repositories, or secrets;
- locations that conflict with CMEK or residency requirements;
- broad project roles not justified by the workload contract.

## Deployment sequence

### 1. APIs and service identities

Verify APIs and obtain the service-agent identities required by:

- Artifact Registry;
- Secret Manager;
- Cloud SQL;
- Cloud Storage;
- Cloud Run.

### 2. KMS

Apply or target the country KMS resources first when necessary.

```bash
terraform apply v0.7d.tfplan
```

For a staged deployment, create a fresh plan after every partial apply. Do not reuse a stale plan.

Grant each managed-service agent only the required encrypter/decrypter permission on its country key.

### 3. Data and artifact services

Deploy Artifact Registry, Secret Manager metadata, Cloud Storage, and Cloud SQL.

Confirm CMEK state where configured before proceeding.

### 4. External population steps

Through separate controlled workflows:

- publish digest-addressable container images;
- add Secret Manager versions;
- create database identities;
- apply database schema migrations.

Do not import secret payloads into Terraform.

### 5. Cloud Run

Deploy Cloud Run services only after their image digests, runtime service accounts, connectors, secret versions, and dependent services are ready.

## Post-apply verification

### Inventory

Record the country, project, region, resource ID, and encryption key for every deployed resource.

### Artifact Registry

Verify:

- public IAM is absent;
- tags are immutable where configured;
- cleanup policy is still dry-run unless deletion was explicitly approved;
- runtime identities can pull and build identities can push;
- unrelated country identities are denied.

### Secret Manager

Verify:

- no secret payload appears in Terraform state or plan output;
- replication locations match the approved country design;
- CMEK is active where required;
- delayed destruction and deletion protection are enabled;
- only approved identities can access versions;
- rotation notifications are delivered when configured.

### KMS

Verify:

- rotation and destruction windows;
- service-agent IAM;
- no public or cross-country principals;
- encrypt/decrypt operations work for approved services;
- key disable and recovery procedures are documented but not tested destructively in production.

### Cloud SQL

Verify:

- no public IP exists;
- the private IP is reachable only from approved country workloads;
- backup and point-in-time recovery settings are active;
- deletion protection is active;
- maintenance settings match the approved window;
- database access from other countries is denied;
- a restoration test is scheduled in a non-production environment.

### Cloud Storage

Verify:

- uniform bucket-level access;
- public-access prevention is enforced;
- versioning, soft delete, retention, and lifecycle behavior;
- CMEK where configured;
- approved read/write access;
- denied public and cross-country access.

### Cloud Run

Verify:

- the deployed revision uses the approved image digest;
- ingress is internal or internal-plus-load-balancer;
- public invocation is denied;
- approved invokers succeed;
- VPC egress follows the country connector;
- restricted API, database, storage, and secret access work;
- unapproved internet egress and cross-country access fail;
- runtime logs contain no secret values.

## Drift check

After deployment and verification:

```bash
terraform plan -detailed-exitcode
```

Expected result: exit code `0`. Exit code `2` indicates drift or unapplied changes and requires review.

## Rollback principles

Rollback is service specific. Do not treat `terraform destroy` as a rollback mechanism.

- **Cloud Run:** shift traffic to a known-good revision or deploy a prior digest.
- **Artifact Registry:** preserve immutable images; stop publishing rather than deleting evidence.
- **Secret Manager:** restore or enable a prior approved version through the secret-management workflow.
- **Cloud SQL:** use controlled failback or point-in-time recovery; never destroy the instance during incident response.
- **Cloud Storage:** recover a version or soft-deleted object; respect retention locks.
- **KMS:** do not disable or destroy keys casually because dependent data can become inaccessible.

Create a new reviewed Terraform plan after any manual emergency action.

## Evidence to retain

Retain redacted copies of:

- reviewed plan and approval;
- apply result;
- resource inventory;
- IAM verification;
- encryption verification;
- positive same-country tests;
- negative public and cross-country tests;
- Cloud Run ingress and egress tests;
- database backup and restoration evidence;
- storage recovery evidence;
- representative logs;
- final no-drift plan.

## Completion criterion

v0.7D may be described as operationally validated only after the resources are deployed and the positive, negative, recovery, and drift checks above have produced reviewable evidence.
