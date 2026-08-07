import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_ROOT = resolve(process.cwd());

function repositoryPath(root, file) {
  return relative(root, file).split("\\").join("/");
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    if (entry.isFile()) files.push(path);
  }
  return files;
}

function has(source, pattern) {
  return pattern.test(source);
}

function collectMatches(root, files, pattern, valueIndex = 1) {
  const findings = [];
  for (const file of files) {
    const source = file.source;
    const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    let match;
    while ((match = regex.exec(source)) !== null) {
      findings.push({
        path: repositoryPath(root, file.path),
        line: lineNumberAt(source, match.index),
        value: match[valueIndex] ?? match[0],
      });
      if (match[0].length === 0) regex.lastIndex += 1;
    }
  }
  return findings;
}

async function read(root, path) {
  return readFile(join(root, path), "utf8");
}

export async function collectRepositoryPosture(root = DEFAULT_ROOT) {
  const terraformRoot = join(root, "infra/terraform");
  const terraformPaths = (await walk(terraformRoot)).filter((file) => file.endsWith(".tf"));
  const terraformFiles = await Promise.all(
    terraformPaths.map(async (path) => ({ path, source: await readFile(path, "utf8") })),
  );

  const foundationVariables = await read(root, "infra/terraform/environments/foundation/variables.tf");
  const workloadVariables = await read(root, "infra/terraform/environments/workloads/variables.tf");
  const cloudSql = await read(root, "infra/terraform/modules/cloud-sql-postgres/main.tf");
  const cloudRun = await read(root, "infra/terraform/modules/cloud-run-service/main.tf");
  const cloudRunVariables = await read(root, "infra/terraform/modules/cloud-run-service/variables.tf");
  const storage = await read(root, "infra/terraform/modules/cloud-storage/main.tf");
  const kms = await read(root, "infra/terraform/modules/cloud-kms/main.tf");
  const secretManager = await read(root, "infra/terraform/modules/secret-manager/main.tf");
  const projectFactory = await read(root, "infra/terraform/modules/project-factory/main.tf");
  const logging = await read(root, "infra/terraform/modules/centralized-logging/main.tf");
  const edgeMain = await read(root, "infra/terraform/modules/regional-serverless-edge/main.tf");
  const edgeArmor = await read(root, "infra/terraform/modules/regional-serverless-edge/cloud-armor.tf");
  const edgeTlsDns = await read(root, "infra/terraform/modules/regional-serverless-edge/tls-dns.tf");

  const primitiveRoleAssignments = collectMatches(
    root,
    terraformFiles,
    /\brole\s*=\s*"(roles\/(?:owner|editor|viewer))"/g,
  );
  const publicPrincipalAssignments = collectMatches(
    root,
    terraformFiles,
    /\bmember\s*=\s*"(allUsers|allAuthenticatedUsers)"/g,
  );
  const serviceAccountKeyResources = collectMatches(
    root,
    terraformFiles,
    /resource\s+"google_service_account_key"\s+"([^"]+)"/g,
  );
  const plaintextSecretVersionResources = collectMatches(
    root,
    terraformFiles,
    /resource\s+"google_secret_manager_secret_version"\s+"([^"]+)"/g,
  );

  const requiredProjectLabels = [
    "managed_by",
    "application",
    "country",
    "environment",
    "service",
    "owner",
    "cost_center",
    "data_classification",
  ].filter((label) => new RegExp(`\\b${label}\\s*=`).test(projectFactory));

  return {
    schema_version: 1,
    profile_id: "AFYA-CSPM-BASELINE-1",
    source: {
      type: "repository",
      stage: "desired-state",
      commit: process.env.GITHUB_SHA ?? null,
      ref: process.env.GITHUB_REF ?? null,
    },
    facts: {
      identity: {
        service_account_key_creation_policy_enforced: has(
          foundationVariables,
          /"iam\.disableServiceAccountKeyCreation"\s*=\s*true/,
        ),
        service_account_key_upload_policy_enforced: has(
          foundationVariables,
          /"iam\.disableServiceAccountKeyUpload"\s*=\s*true/,
        ),
        service_account_key_resources: serviceAccountKeyResources,
        primitive_role_assignments: primitiveRoleAssignments,
        public_principal_assignments: publicPrincipalAssignments,
        runtime_service_account_created: has(
          cloudRun,
          /resource\s+"google_service_account"\s+"runtime"/,
        ),
        runtime_service_account_assigned: has(
          cloudRun,
          /service_account\s*=\s*google_service_account\.runtime\.email/,
        ),
      },
      network: {
        cloud_sql_public_ipv4_disabled: has(cloudSql, /ipv4_enabled\s*=\s*false/),
        cloud_sql_private_network_configured: has(
          cloudSql,
          /private_network\s*=\s*var\.private_network/,
        ),
        cloud_run_public_ingress_rejected:
          cloudRunVariables.includes('"INGRESS_TRAFFIC_INTERNAL_ONLY"') &&
          cloudRunVariables.includes('"INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"') &&
          !cloudRunVariables.includes('"INGRESS_TRAFFIC_ALL"'),
      },
      storage: {
        public_access_prevention_enforced: has(
          storage,
          /public_access_prevention\s*=\s*"enforced"/,
        ),
        uniform_bucket_level_access_enabled: has(
          storage,
          /uniform_bucket_level_access\s*=\s*true/,
        ),
      },
      kms: {
        rotation_configured: has(kms, /rotation_period\s*=\s*each\.value\.rotation_period/),
        destroy_delay_configured: has(
          kms,
          /destroy_scheduled_duration\s*=\s*each\.value\.destroy_scheduled_duration/,
        ),
        prevent_destroy: has(kms, /lifecycle\s*\{[\s\S]*?prevent_destroy\s*=\s*true[\s\S]*?\}/),
      },
      secrets: {
        secret_manager_resource_present: has(
          secretManager,
          /resource\s+"google_secret_manager_secret"/,
        ),
        plaintext_secret_version_resources: plaintextSecretVersionResources,
        cloud_run_secret_reference_configured: has(cloudRun, /secret_key_ref\s*\{/),
      },
      edge: {
        cloud_armor_attached: has(
          edgeMain,
          /security_policy\s*=\s*google_compute_region_security_policy\.edge\.self_link/,
        ),
        waf_deny_rules_configured: has(edgeArmor, /action\s*=\s*"deny\(403\)"/),
        rate_limit_configured:
          has(edgeArmor, /action\s*=\s*"throttle"/) &&
          has(edgeArmor, /exceed_action\s*=\s*"deny\(429\)"/),
        tls_minimum_12: has(edgeTlsDns, /min_tls_version\s*=\s*"TLS_1_2"/),
        https_forwarding_rule_443:
          has(edgeTlsDns, /resource\s+"google_compute_forwarding_rule"\s+"https"/) &&
          has(edgeTlsDns, /port_range\s*=\s*"443"/),
        http_redirects_to_https: has(edgeTlsDns, /https_redirect\s*=\s*true/),
        frontend_dns_targets_managed_address: has(
          edgeTlsDns,
          /rrdatas\s*=\s*\[google_compute_address\.frontend\.address\]/,
        ),
        backend_logging_enabled: has(
          edgeMain,
          /log_config\s*\{[\s\S]*?enable\s*=\s*true[\s\S]*?\}/,
        ),
      },
      governance: {
        project_required_labels: requiredProjectLabels,
        auto_create_network_disabled: has(projectFactory, /auto_create_network\s*=\s*false/),
        production_deletion_protection_required: has(
          projectFactory,
          /var\.environment\s*!=\s*"prod"\s*\|\|\s*var\.deletion_policy\s*==\s*"PREVENT"/,
        ),
      },
      logging: {
        organization_sink_configured: has(
          logging,
          /resource\s+"google_logging_organization_sink"/,
        ),
        central_log_bucket_configured: has(
          logging,
          /resource\s+"google_logging_project_bucket_config"/,
        ),
        sink_writer_binding_configured:
          has(logging, /role\s*=\s*"roles\/logging\.bucketWriter"/) &&
          has(logging, /writer_identity/),
        log_bucket_prevent_destroy: has(
          logging,
          /google_logging_project_bucket_config[\s\S]*?lifecycle\s*\{[\s\S]*?prevent_destroy\s*=\s*true/,
        ),
      },
      location: {
        foundation_country_scope_validation: has(
          foundationVariables,
          /contains\(\["ke",\s*"gh",\s*"za",\s*"global"\],\s*project\.country\)/,
        ),
        foundation_environment_scope_validation: has(
          foundationVariables,
          /contains\(\["dev",\s*"stg",\s*"prod",\s*"shared"\],\s*project\.environment\)/,
        ),
        workload_country_scope_validation: has(
          workloadVariables,
          /contains\(\["ke",\s*"gh",\s*"za"\],\s*repository\.country\)/,
        ),
      },
    },
  };
}

async function main() {
  const rootArg = process.argv.indexOf("--root");
  const outputArg = process.argv.indexOf("--output");
  const root = rootArg >= 0 && process.argv[rootArg + 1] ? resolve(process.argv[rootArg + 1]) : DEFAULT_ROOT;
  const output = outputArg >= 0 && process.argv[outputArg + 1] ? resolve(process.argv[outputArg + 1]) : null;
  const snapshot = await collectRepositoryPosture(root);
  const json = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (output) {
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, json, "utf8");
    console.log(`Repository cloud posture snapshot written to ${relative(root, output)}.`);
  } else {
    process.stdout.write(json);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
