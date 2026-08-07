import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { collectRepositoryPosture } from "./collect-repository-cloud-posture.mjs";

const root = resolve(process.cwd());

function fail(message) {
  throw new Error(`Repository posture collector test failed: ${message}`);
}

async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), "afyabridge-posture-collector-"));
  await mkdir(join(directory, "infra"), { recursive: true });
  await cp(join(root, "infra/terraform"), join(directory, "infra/terraform"), { recursive: true });
  return directory;
}

async function mutateFile(directory, path, mutate) {
  const target = join(directory, path);
  const source = await readFile(target, "utf8");
  const changed = mutate(source);
  if (changed === source) fail(`${path} mutation did not change the fixture`);
  await writeFile(target, changed, "utf8");
}

async function runCase(label, mutate, assertUnsafe) {
  const directory = await fixture();
  try {
    await mutate(directory);
    const snapshot = await collectRepositoryPosture(directory);
    if (!assertUnsafe(snapshot)) fail(`${label} was not detected by the collector`);
    console.log(`PASS detect: ${label}`);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

const baseline = await collectRepositoryPosture(root);
if (
  baseline.facts.identity.service_account_key_resources.length !== 0 ||
  baseline.facts.identity.primitive_role_assignments.length !== 0 ||
  baseline.facts.identity.public_principal_assignments.length !== 0 ||
  baseline.facts.secrets.plaintext_secret_version_resources.length !== 0
) {
  fail("reviewed repository unexpectedly contains unsafe Terraform facts");
}
console.log("PASS allow: reviewed Terraform collector baseline");

await runCase(
  "service-account key creation policy disabled in Terraform",
  (directory) => mutateFile(
    directory,
    "infra/terraform/environments/foundation/variables.tf",
    (source) => source.replace('"iam.disableServiceAccountKeyCreation" = true', '"iam.disableServiceAccountKeyCreation" = false'),
  ),
  (snapshot) => snapshot.facts.identity.service_account_key_creation_policy_enforced === false,
);

await runCase(
  "unsafe IAM and secret resources added to Terraform",
  async (directory) => {
    const target = join(directory, "infra/terraform/collector-unsafe.tf");
    await writeFile(
      target,
      `resource "google_service_account_key" "unsafe" {}\nresource "google_project_iam_member" "unsafe" {\n  role = "roles/owner"\n  member = "allUsers"\n}\nresource "google_project_iam_binding" "unsafe_plural" {\n  role = "roles/example"\n  members = ["allAuthenticatedUsers"]\n}\nresource "google_secret_manager_secret_version" "unsafe" {}\n`,
      "utf8",
    );
  },
  (snapshot) =>
    snapshot.facts.identity.service_account_key_resources.length === 1 &&
    snapshot.facts.identity.primitive_role_assignments.length === 1 &&
    snapshot.facts.identity.public_principal_assignments.length === 2 &&
    snapshot.facts.secrets.plaintext_secret_version_resources.length === 1,
);

await runCase(
  "Cloud SQL public IPv4 enabled in Terraform",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/cloud-sql-postgres/main.tf",
    (source) => source.replace("ipv4_enabled                                  = false", "ipv4_enabled                                  = true"),
  ),
  (snapshot) => snapshot.facts.network.cloud_sql_public_ipv4_disabled === false,
);

await runCase(
  "Cloud Run unrestricted ingress introduced",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/cloud-run-service/variables.tf",
    (source) => source.replace('"INGRESS_TRAFFIC_INTERNAL_ONLY",', '"INGRESS_TRAFFIC_ALL",'),
  ),
  (snapshot) => snapshot.facts.network.cloud_run_public_ingress_rejected === false,
);

await runCase(
  "Cloud Run public invoker guardrail removed",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/cloud-run-service/variables.tf",
    (source) => source.replace('!contains(["allUsers", "allAuthenticatedUsers"], member)', 'contains(["allUsers", "allAuthenticatedUsers"], member)'),
  ),
  (snapshot) => snapshot.facts.network.cloud_run_public_invokers_rejected === false,
);

await runCase(
  "Storage public-access prevention weakened",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/cloud-storage/main.tf",
    (source) => source.replace('public_access_prevention    = "enforced"', 'public_access_prevention    = "inherited"'),
  ),
  (snapshot) => snapshot.facts.storage.public_access_prevention_enforced === false,
);

await runCase(
  "Cloud Armor detached from the edge backend",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/regional-serverless-edge/main.tf",
    (source) => source.replace("security_policy       = google_compute_region_security_policy.edge.self_link", "security_policy       = null"),
  ),
  (snapshot) => snapshot.facts.edge.cloud_armor_attached === false,
);

await runCase(
  "KMS rotation default removed",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/cloud-kms/variables.tf",
    (source) => source.replace('rotation_period             = optional(string, "7776000s")', 'rotation_period             = optional(string)'),
  ),
  (snapshot) => snapshot.facts.kms.rotation_default_configured === false,
);

await runCase(
  "KMS rotation default weakened below reviewed 90-day value",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/cloud-kms/variables.tf",
    (source) => source.replace('rotation_period             = optional(string, "7776000s")', 'rotation_period             = optional(string, "60s")'),
  ),
  (snapshot) => snapshot.facts.kms.rotation_default_configured === false,
);

await runCase(
  "KMS destruction-delay default removed",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/cloud-kms/variables.tf",
    (source) => source.replace('destroy_scheduled_duration  = optional(string, "2592000s")', 'destroy_scheduled_duration  = optional(string)'),
  ),
  (snapshot) => snapshot.facts.kms.destroy_delay_default_configured === false,
);

await runCase(
  "KMS destruction-delay default weakened below reviewed 30-day value",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/cloud-kms/variables.tf",
    (source) => source.replace('destroy_scheduled_duration  = optional(string, "2592000s")', 'destroy_scheduled_duration  = optional(string, "86400s")'),
  ),
  (snapshot) => snapshot.facts.kms.destroy_delay_default_configured === false,
);

await runCase(
  "project owner metadata removed",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/project-factory/main.tf",
    (source) => source.replace("    owner               = var.owner\n", ""),
  ),
  (snapshot) => !snapshot.facts.governance.project_required_labels.includes("owner"),
);

await runCase(
  "central organization log sink removed",
  (directory) => mutateFile(
    directory,
    "infra/terraform/modules/centralized-logging/main.tf",
    (source) => source.replace('resource "google_logging_organization_sink" "this"', 'resource "google_logging_project_sink" "this"'),
  ),
  (snapshot) => snapshot.facts.logging.organization_sink_configured === false,
);

{
  const directory = await fixture();
  try {
    const generated = join(directory, "infra/terraform/.terraform/modules/cache");
    await mkdir(generated, { recursive: true });
    await writeFile(
      join(generated, "unsafe.tf"),
      `resource "google_service_account_key" "generated" {}\nresource "google_project_iam_member" "generated" { role = "roles/owner" member = "allUsers" }\n`,
      "utf8",
    );
    const snapshot = await collectRepositoryPosture(directory);
    if (
      snapshot.facts.identity.service_account_key_resources.length !== 0 ||
      snapshot.facts.identity.primitive_role_assignments.length !== 0 ||
      snapshot.facts.identity.public_principal_assignments.length !== 0
    ) {
      fail("generated .terraform cache must not affect reviewed repository posture facts");
    }
    console.log("PASS allow: generated .terraform cache excluded from posture facts");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

console.log("Repository posture collector compromise controls validated: 15 scenarios passed.");
