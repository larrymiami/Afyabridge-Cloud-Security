# Network deployment runbook

## Purpose

This runbook governs reviewed deployment and verification of the v0.7C country-isolated Shared VPC and network-control stack.

It assumes the v0.7A bootstrap and v0.7B foundation have already been applied successfully in the target Google Cloud organization.

## Preconditions

Before planning or applying:

- PR #9 or its successor has passed the Terraform infrastructure workflow;
- the network provider lockfile is committed;
- the protected remote-state bucket and Terraform execution identity are available;
- Shared VPC host and service projects exist in the intended folders;
- required networking, DNS, Service Networking, and VPC Access APIs are enabled;
- the operator is authenticated through an approved short-lived identity flow;
- synthetic project IDs, CIDRs, regions, tags, and service-project lists have been replaced with reviewed values;
- the complete address plan has been checked for overlap with existing VPCs, VPNs, partner networks, managed-service ranges, and future expansion space;
- a change window, rollback owner, and evidence location are recorded;
- no credentials, secrets, patient data, or production identifiers are present in the working tree.

## Prepare configuration

From the repository root:

```bash
cd infra/terraform/environments/network
cp terraform.tfvars.example terraform.tfvars
```

Replace synthetic values locally. Never commit `terraform.tfvars`.

Configure the protected GCS backend using reviewed backend arguments or an ignored backend configuration file.

## Initialize and validate

```bash
terraform init -reconfigure
terraform providers
terraform validate
terraform fmt -check -recursive ../..
```

Confirm that provider selections match the committed lockfile and that the network root initializes without module or provider drift.

## Create a reviewed plan

```bash
terraform plan \
  -input=false \
  -out=network.tfplan

terraform show -no-color network.tfplan > network-plan.txt
```

Store the binary and rendered plans only in the approved evidence location. They may contain sensitive project and network metadata and must not be committed publicly.

## Plan review checklist

Verify that the plan contains only the expected country-scoped resources.

### Network structure

- one custom-mode Shared VPC per country;
- no automatic subnets;
- no unintended default routes;
- only approved service projects attached to each country host project;
- correct regional application subnets;
- Private Google Access enabled where required;
- VPC Flow Logs enabled;
- no cross-country peering or shared network resource.

### Routing and egress

- one expected Cloud Router and Cloud NAT configuration per country;
- NAT logging enabled;
- restricted Google API route present;
- no unintended general egress allow rule;
- explicit logged fallback egress deny rule present.

### Ingress

- same-country internal traffic uses only declared ranges;
- health checks target only approved workload tags and ports;
- IAP administrative access targets only approved tags and ports;
- no direct public SSH or RDP allow rule;
- explicit logged fallback ingress deny rule present.

### Private services and DNS

- private service access range belongs to the correct country;
- no overlap with application or connector ranges;
- Service Networking connection targets the correct VPC;
- private Google API DNS zones attach only to the intended country VPC;
- records point to the approved restricted API endpoint.

### Serverless connectors

- one connector per intended country;
- each connector uses a unique reviewed `/28`;
- connector project, region, and VPC are correct;
- instance and throughput settings are within approved cost and capacity bounds;
- connectors do not provide cross-country transit.

## Apply

Apply only the reviewed saved plan:

```bash
terraform apply -input=false network.tfplan
```

Do not run an unreviewed direct `terraform apply`.

## Post-apply verification

### Inventory

Capture the Terraform outputs and confirm:

- VPC IDs and names;
- subnet IDs and CIDRs;
- attached service projects;
- routers and NAT gateways;
- firewall rules;
- private-service ranges and connections;
- private DNS zones;
- Serverless VPC Access connectors.

### Connectivity tests

Use synthetic test workloads with no patient or production data.

For each country, verify:

1. same-country permitted traffic succeeds;
2. cross-country private traffic fails;
3. direct inbound SSH and RDP from the internet fail;
4. IAP administrative access succeeds only for approved targets and identities;
5. health-check probes reach only tagged backends and approved ports;
6. DNS resolution for configured Google API names returns the restricted endpoint path;
7. HTTPS access to restricted Google APIs succeeds;
8. unapproved internet egress fails;
9. approved private managed-service connectivity succeeds when a test service exists;
10. serverless connector traffic reaches only intended country resources;
11. denied flows appear in firewall logs;
12. subnet flow logs and NAT logs are produced.

### Drift check

After verification:

```bash
terraform plan -detailed-exitcode -input=false
```

Expected exit code is `0`. Any non-zero result must be investigated and recorded.

## Failure handling

If planning fails, make no cloud changes. Correct the narrowest configuration, permission, API, or address-plan problem and regenerate the plan.

If apply partially fails:

1. preserve state and logs;
2. confirm that no Terraform operation remains active;
3. do not manually delete state objects;
4. inspect the cloud-side state of the failed resource;
5. run a new plan to identify the remaining delta;
6. correct the narrowest safe cause;
7. obtain review before resuming.

If connectivity testing reveals unexpected access:

1. stop the test;
2. preserve relevant logs and rule evaluations;
3. apply an emergency reviewed deny control where necessary;
4. document the exposure window and affected synthetic resources;
5. correct the Terraform declaration;
6. repeat the complete isolation test set.

## Rollback

Rollback means applying a reviewed configuration that restores the previous approved network state.

Do not perform ad hoc console deletion of Shared VPC attachments, routes, firewall rules, DNS zones, peering ranges, or connectors.

Network rollback can interrupt workloads. Before applying a rollback plan:

- identify dependent services;
- confirm an approved maintenance window;
- preserve logs and the previous plan;
- review route, DNS, NAT, firewall, and connector changes together;
- validate that rollback does not reintroduce public or cross-country access.

## Required evidence

Capture:

- source commit and PR;
- workflow run and static-validation result;
- Terraform and provider versions;
- reviewed plan summary;
- apply result;
- network and address inventory;
- firewall and route inventory;
- DNS and private-service checks;
- serverless connector checks;
- positive and negative connectivity-test results;
- representative redacted logs;
- post-apply no-drift result;
- exceptions, failures, and remediation.

Public evidence must not contain secrets, tokens, service-account keys, patient data, unrestricted project identifiers, or unredacted sensitive infrastructure metadata.
