import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(process.env.POSTURE_REPO_ROOT ?? process.cwd());
const rulesArg = process.argv[2] ?? "security/cloud-posture-rules.json";
const catalogueArg = process.argv[3] ?? "security/cloud-posture-controls.json";
const governanceArg = process.argv[4] ?? "security/cloud-posture-governance.json";

function canonicalExpected(value) {
  return Array.isArray(value) ? [...value].sort() : value;
}

function assertionSignature(assertion) {
  const expected = Object.hasOwn(assertion, "expected")
    ? JSON.stringify(canonicalExpected(assertion.expected))
    : "";
  return `${assertion.fact}|${assertion.operator}|${expected}`;
}

function reviewedAssertion(fact, operator, expected) {
  const assertion = { fact, operator };
  if (arguments.length === 3) assertion.expected = expected;
  return assertionSignature(assertion);
}

const REVIEWED_REQUIRED_RULE_BINDINGS = new Map([
  ["POSTURE-IAM-001", "IAM-C01"],
  ["POSTURE-IAM-002", "IAM-C02"],
  ["POSTURE-IAM-003", "CSPM-C01"],
  ["POSTURE-NET-001", "NET-C01"],
  ["POSTURE-EDGE-001", "NET-C04"],
  ["POSTURE-KMS-001", "KMS-C03"],
  ["POSTURE-SEC-001", "SEC-C02"],
  ["POSTURE-STORAGE-001", "CSPM-C01"],
  ["POSTURE-GOV-001", "GOV-C01"],
  ["POSTURE-LOG-001", "MON-C01"],
  ["POSTURE-LOC-001", "CSPM-C02"],
]);

const REVIEWED_REQUIRED_ASSERTIONS = new Map([
  ["POSTURE-IAM-001", [
    reviewedAssertion("identity.service_account_key_creation_policy_enforced", "equals", true),
    reviewedAssertion("identity.service_account_key_upload_policy_enforced", "equals", true),
    reviewedAssertion("identity.service_account_key_policy_override_guardrail", "equals", true),
    reviewedAssertion("identity.service_account_key_resources", "empty"),
  ]],
  ["POSTURE-IAM-002", [
    reviewedAssertion("identity.runtime_service_account_created", "equals", true),
    reviewedAssertion("identity.runtime_service_account_assigned", "equals", true),
  ]],
  ["POSTURE-IAM-003", [
    reviewedAssertion("identity.primitive_role_assignments", "empty"),
    reviewedAssertion("identity.public_principal_assignments", "empty"),
  ]],
  ["POSTURE-NET-001", [
    reviewedAssertion("network.cloud_sql_public_ipv4_disabled", "equals", true),
    reviewedAssertion("network.cloud_sql_private_network_configured", "equals", true),
  ]],
  ["POSTURE-EDGE-001", [
    reviewedAssertion("network.cloud_run_public_ingress_rejected", "equals", true),
    reviewedAssertion("network.cloud_run_public_invokers_rejected", "equals", true),
    reviewedAssertion("edge.cloud_armor_attached", "equals", true),
    reviewedAssertion("edge.waf_deny_rules_configured", "equals", true),
    reviewedAssertion("edge.rate_limit_configured", "equals", true),
    reviewedAssertion("edge.tls_minimum_12", "equals", true),
    reviewedAssertion("edge.https_forwarding_rule_443", "equals", true),
    reviewedAssertion("edge.http_redirects_to_https", "equals", true),
    reviewedAssertion("edge.frontend_dns_targets_managed_address", "equals", true),
    reviewedAssertion("edge.backend_logging_enabled", "equals", true),
  ]],
  ["POSTURE-KMS-001", [
    reviewedAssertion("kms.rotation_configured", "equals", true),
    reviewedAssertion("kms.rotation_default_configured", "equals", true),
    reviewedAssertion("kms.rotation_override_guardrail", "equals", true),
    reviewedAssertion("kms.destroy_delay_configured", "equals", true),
    reviewedAssertion("kms.destroy_delay_default_configured", "equals", true),
    reviewedAssertion("kms.destroy_delay_override_guardrail", "equals", true),
    reviewedAssertion("kms.prevent_destroy", "equals", true),
  ]],
  ["POSTURE-SEC-001", [
    reviewedAssertion("secrets.secret_manager_resource_present", "equals", true),
    reviewedAssertion("secrets.plaintext_secret_version_resources", "empty"),
    reviewedAssertion("secrets.cloud_run_secret_reference_configured", "equals", true),
  ]],
  ["POSTURE-STORAGE-001", [
    reviewedAssertion("storage.public_access_prevention_enforced", "equals", true),
    reviewedAssertion("storage.uniform_bucket_level_access_enabled", "equals", true),
  ]],
  ["POSTURE-GOV-001", [
    reviewedAssertion(
      "governance.project_required_labels",
      "contains_all",
      ["managed_by", "application", "country", "environment", "service", "owner", "cost_center", "data_classification"],
    ),
    reviewedAssertion("governance.auto_create_network_disabled", "equals", true),
    reviewedAssertion("governance.production_deletion_protection_required", "equals", true),
  ]],
  ["POSTURE-LOG-001", [
    reviewedAssertion("logging.organization_sink_configured", "equals", true),
    reviewedAssertion("logging.central_log_bucket_configured", "equals", true),
    reviewedAssertion("logging.sink_writer_binding_configured", "equals", true),
    reviewedAssertion("logging.log_bucket_prevent_destroy", "equals", true),
  ]],
  ["POSTURE-LOC-001", [
    reviewedAssertion("location.foundation_country_scope_validation", "equals", true),
    reviewedAssertion("location.foundation_environment_scope_validation", "equals", true),
    reviewedAssertion("location.workload_country_scope_validation", "equals", true),
  ]],
]);

function fail(message) {
  throw new Error(`Cloud posture rule validation failed: ${message}`);
}

async function load(path, label) {
  try {
    return JSON.parse(await readFile(resolve(root, path), "utf8"));
  } catch (error) {
    fail(`${label} could not be loaded as JSON: ${error.message}`);
  }
}

function string(value, label, minimum = 1) {
  if (typeof value !== "string" || value.trim().length < minimum) {
    fail(`${label} must be a string with at least ${minimum} character(s)`);
  }
  return value.trim();
}

function array(value, label) {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a non-empty array`);
  return value;
}

function uniqueStrings(values, label) {
  const seen = new Set();
  for (const [index, value] of array(values, label).entries()) {
    const normalized = string(value, `${label}[${index}]`);
    if (seen.has(normalized)) fail(`${label} contains duplicate value ${normalized}`);
    seen.add(normalized);
  }
  return seen;
}

const [rules, catalogue, governance] = await Promise.all([
  load(rulesArg, "rule set"),
  load(catalogueArg, "control catalogue"),
  load(governanceArg, "governance profile"),
]);

if (rules.schema_version !== 1) fail("rules schema_version must be 1");
if (catalogue.schema_version !== 1) fail("catalogue schema_version must be 1");
if (governance.schema_version !== 1) fail("governance schema_version must be 1");
if (rules.profile_id !== governance.profile_id || rules.profile_id !== catalogue.profile_id) {
  fail("rule set, catalogue, and governance profile_id values must match");
}

const policy = governance.repository_posture;
if (!policy || typeof policy !== "object") fail("governance repository_posture policy is required");
if (policy.check_set_id !== "AFYA-CSPM-REPOSITORY-1") {
  fail("repository_posture.check_set_id must remain AFYA-CSPM-REPOSITORY-1");
}
if (rules.check_set_id !== policy.check_set_id) fail("rule set check_set_id must match governance");

const allowedScopes = uniqueStrings(policy.allowed_claim_scopes, "repository_posture.allowed_claim_scopes");
const allowedSources = uniqueStrings(policy.allowed_sources, "repository_posture.allowed_sources");
const allowedOperators = uniqueStrings(
  policy.allowed_assertion_operators,
  "repository_posture.allowed_assertion_operators",
);
for (const required of ["repository-desired-state", "repository-partial"]) {
  if (!allowedScopes.has(required)) fail(`allowed_claim_scopes must include ${required}`);
}
if (allowedSources.size !== 1 || !allowedSources.has("repository")) {
  fail("repository-baseline executable posture sources must remain repository-only");
}
for (const required of ["equals", "empty", "contains_all"]) {
  if (!allowedOperators.has(required)) fail(`allowed_assertion_operators must include ${required}`);
}

const controls = new Map(array(catalogue.controls, "catalogue.controls").map((control) => [control.id, control]));
const requiredRules = new Map();
for (const [index, required] of array(policy.required_rules, "repository_posture.required_rules").entries()) {
  if (!required || typeof required !== "object") fail(`required_rules[${index}] must be an object`);
  const id = string(required.id, `required_rules[${index}].id`);
  const controlId = string(required.control_id, `required_rules[${index}].control_id`);
  if (requiredRules.has(id)) fail(`required_rules contains duplicate rule ${id}`);
  if (!controls.has(controlId)) fail(`${id}: required control ${controlId} is not in the active catalogue`);
  requiredRules.set(id, controlId);
}
for (const [id, controlId] of REVIEWED_REQUIRED_RULE_BINDINGS) {
  if (!requiredRules.has(id)) fail(`governance required rule ${id} is missing`);
  if (requiredRules.get(id) !== controlId) {
    fail(`governance ${id} binding must remain ${controlId}, got ${requiredRules.get(id)}`);
  }
}

const ruleList = array(rules.rules, "rules.rules");
const ruleMap = new Map();
const assertionSignaturesByRule = new Map();
let assertionCount = 0;
for (const [index, rule] of ruleList.entries()) {
  const label = `rules[${index}]`;
  if (!rule || typeof rule !== "object") fail(`${label} must be an object`);
  const id = string(rule.id, `${label}.id`);
  if (!/^POSTURE-[A-Z]+-\d{3}$/.test(id)) fail(`${id}: rule id format is invalid`);
  if (ruleMap.has(id)) fail(`${id}: duplicate rule id`);

  const controlId = string(rule.control_id, `${id}.control_id`);
  if (!controls.has(controlId)) fail(`${id}: control ${controlId} is not in the active posture catalogue`);
  string(rule.title, `${id}.title`, 12);
  if (!allowedScopes.has(rule.claim_scope)) fail(`${id}: unsupported claim_scope ${rule.claim_scope ?? "missing"}`);

  const sources = uniqueStrings(rule.supported_sources, `${id}.supported_sources`);
  for (const source of sources) {
    if (!allowedSources.has(source)) fail(`${id}: unsupported source ${source}`);
  }

  const assertions = array(rule.assertions, `${id}.assertions`);
  const assertionFacts = new Set();
  const signatures = new Set();
  for (const [assertionIndex, assertion] of assertions.entries()) {
    const assertionLabel = `${id}.assertions[${assertionIndex}]`;
    if (!assertion || typeof assertion !== "object") fail(`${assertionLabel} must be an object`);
    const fact = string(assertion.fact, `${assertionLabel}.fact`);
    if (!/^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)+$/.test(fact)) {
      fail(`${assertionLabel}.fact must be a normalized dotted fact path`);
    }
    if (assertionFacts.has(fact)) fail(`${id}: duplicate assertion fact ${fact}`);
    assertionFacts.add(fact);
    if (!allowedOperators.has(assertion.operator)) {
      fail(`${assertionLabel}: unsupported operator ${assertion.operator ?? "missing"}`);
    }
    string(assertion.message, `${assertionLabel}.message`, 20);
    if (assertion.operator === "equals" && !Object.hasOwn(assertion, "expected")) {
      fail(`${assertionLabel}: equals requires expected`);
    }
    if (assertion.operator === "contains_all") {
      uniqueStrings(assertion.expected, `${assertionLabel}.expected`);
    }
    const signature = assertionSignature(assertion);
    if (signatures.has(signature)) fail(`${id}: duplicate assertion signature ${signature}`);
    signatures.add(signature);
    assertionCount += 1;
  }

  ruleMap.set(id, rule);
  assertionSignaturesByRule.set(id, signatures);
}

for (const [requiredId, requiredControlId] of REVIEWED_REQUIRED_RULE_BINDINGS) {
  const rule = ruleMap.get(requiredId);
  if (!rule) fail(`required executable posture rule ${requiredId} is missing`);
  if (rule.control_id !== requiredControlId) {
    fail(`${requiredId}: control binding must remain ${requiredControlId}, got ${rule.control_id}`);
  }

  const signatures = assertionSignaturesByRule.get(requiredId);
  for (const requiredSignature of REVIEWED_REQUIRED_ASSERTIONS.get(requiredId) ?? []) {
    if (!signatures.has(requiredSignature)) {
      fail(`${requiredId}: required reviewed assertion is missing or changed: ${requiredSignature}`);
    }
  }
}

console.log(
  `Cloud posture rules validated: ${ruleMap.size} rules, ${assertionCount} assertions, ${REVIEWED_REQUIRED_RULE_BINDINGS.size} anchored rule/control bindings, ${[...REVIEWED_REQUIRED_ASSERTIONS.values()].flat().length} anchored assertions.`,
);
