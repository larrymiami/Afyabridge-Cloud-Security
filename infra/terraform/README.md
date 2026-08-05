# Terraform foundation

This directory implements the infrastructure-as-code foundation for AfyaBridge Cloud Security.

## Scope

The v0.7A package establishes:

- pinned Terraform and Google provider versions;
- a dedicated bootstrap stack for remote state, encryption, and the Terraform execution identity;
- conventions for environments, modules, naming, labels, and state separation;
- credential-free formatting and validation in pull requests;
- an explicit boundary between bootstrap infrastructure and workload infrastructure.

It does not deploy application workloads, country networks, databases, or production projects. Those are implemented in later v0.7 packages after the bootstrap control plane has been reviewed.

## Directory layout

```text
infra/terraform/
├── bootstrap/             # One-time state and execution-identity foundation
├── environments/          # Environment roots added in later v0.7 packages
├── modules/               # Reusable reviewed modules
└── README.md
```

## Version policy

- Terraform CLI is pinned in `/.terraform-version`.
- Root configurations constrain Terraform to the same patch line.
- Google providers are constrained to a reviewed minor line.
- `.terraform.lock.hcl` files are committed per root configuration after `terraform init`.

## Authentication boundary

No long-lived Google Cloud service-account key is permitted in the repository or CI. Local bootstrap execution uses an authenticated operator identity. CI validation is credential-free. Deployment automation will use GitHub Actions workload identity federation in a later package.

## Bootstrap workflow

1. Create or select the dedicated bootstrap project and enable billing.
2. Authenticate with an approved bootstrap operator identity.
3. Copy `bootstrap/terraform.tfvars.example` to a local, ignored `terraform.tfvars`.
4. Run `terraform init`, `terraform plan`, and a reviewed `terraform apply` from `bootstrap/`.
5. Record the resulting state bucket, KMS key, and Terraform service account.
6. Migrate later root configurations to the protected GCS backend.

The bootstrap stack initially uses local state because the remote backend does not exist yet. After creation, its own state can be migrated to the protected bucket using a reviewed backend migration.

## Validation

From the repository root:

```bash
terraform fmt -check -recursive infra/terraform
terraform -chdir=infra/terraform/bootstrap init -backend=false
terraform -chdir=infra/terraform/bootstrap validate
```

No `plan` or `apply` runs automatically on pull requests.
