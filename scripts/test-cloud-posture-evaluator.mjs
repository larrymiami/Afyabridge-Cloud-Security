import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { collectRepositoryPosture } from "./collect-repository-cloud-posture.mjs";
import { evaluatePosture } from "./evaluate-cloud-posture.mjs";

const root = resolve(process.cwd());
const load = async (path) => JSON.parse(await readFile(resolve(root, path), "utf8"));
const rules = await load("security/cloud-posture-rules.json");
const catalogue = await load("security/cloud-posture-controls.json");
const governance = await load("security/cloud-posture-governance.json");
const baseline = await collectRepositoryPosture(root);

function clone(value) {
  return structuredClone(value);
}

function fail(message) {
  throw new Error(`Cloud posture evaluator test failed: ${message}`);
}

function evaluate(snapshot) {
  return evaluatePosture({ snapshot, rules, catalogue, governance });
}

const baselineResult = evaluate(baseline);
if (baselineResult.summary.blocking_findings !== 0 || baselineResult.summary.failing !== 0) {
  fail(`reviewed baseline must pass, got ${JSON.stringify(baselineResult.summary)}`);
}
console.log("PASS allow: reviewed repository posture baseline");

const cases = [
  ["service-account key creation policy disabled", "POSTURE-IAM-001", true, (s) => { s.facts.identity.service_account_key_creation_policy_enforced = false; }],
  ["user-managed service-account key introduced", "POSTURE-IAM-001", true, (s) => { s.facts.identity.service_account_key_resources.push({path: "unsafe.tf", line: 1, value: "leaked"}); }],
  ["primitive IAM role introduced", "POSTURE-IAM-003", true, (s) => { s.facts.identity.primitive_role_assignments.push({path: "unsafe.tf", line: 1, value: "roles/owner"}); }],
  ["public IAM principal introduced", "POSTURE-IAM-003", true, (s) => { s.facts.identity.public_principal_assignments.push({path: "unsafe.tf", line: 1, value: "allUsers"}); }],
  ["Cloud SQL public IPv4 enabled", "POSTURE-NET-001", true, (s) => { s.facts.network.cloud_sql_public_ipv4_disabled = false; }],
  ["Cloud Run public ingress permitted", "POSTURE-EDGE-001", true, (s) => { s.facts.network.cloud_run_public_ingress_rejected = false; }],
  ["Cloud Run public invoker permitted", "POSTURE-EDGE-001", true, (s) => { s.facts.network.cloud_run_public_invokers_rejected = false; }],
  ["Cloud Armor detached", "POSTURE-EDGE-001", true, (s) => { s.facts.edge.cloud_armor_attached = false; }],
  ["KMS rotation field removed", "POSTURE-KMS-001", true, (s) => { s.facts.kms.rotation_configured = false; }],
  ["KMS rotation default removed", "POSTURE-KMS-001", true, (s) => { s.facts.kms.rotation_default_configured = false; }],
  ["KMS destruction-delay default removed", "POSTURE-KMS-001", true, (s) => { s.facts.kms.destroy_delay_default_configured = false; }],
  ["Terraform-managed secret payload introduced", "POSTURE-SEC-001", true, (s) => { s.facts.secrets.plaintext_secret_version_resources.push({path: "unsafe.tf", line: 1, value: "payload"}); }],
  ["storage public access prevention removed", "POSTURE-STORAGE-001", true, (s) => { s.facts.storage.public_access_prevention_enforced = false; }],
  ["project ownership label removed", "POSTURE-GOV-001", false, (s) => { s.facts.governance.project_required_labels = s.facts.governance.project_required_labels.filter((label) => label !== "owner"); }],
  ["central organization logging sink removed", "POSTURE-LOG-001", true, (s) => { s.facts.logging.organization_sink_configured = false; }],
  ["country scope guardrail removed", "POSTURE-LOC-001", true, (s) => { s.facts.location.foundation_country_scope_validation = false; }],
];

for (const [label, expectedRule, expectedBlocking, mutate] of cases) {
  const snapshot = clone(baseline);
  mutate(snapshot);
  const result = evaluate(snapshot);
  const failedRule = result.results.find((entry) => entry.rule_id === expectedRule);
  if (!failedRule || failedRule.status !== "fail") {
    fail(`${label} did not produce the expected ${expectedRule} finding`);
  }
  if (failedRule.blocking !== expectedBlocking) {
    fail(`${label} expected blocking=${expectedBlocking} but got blocking=${failedRule.blocking}`);
  }
  console.log(`PASS ${expectedBlocking ? "deny" : "report"}: ${label} -> ${expectedRule}`);
}

console.log(`Cloud posture evaluator controls validated: ${cases.length + 1} scenarios passed.`);
