import { access, readFile } from "node:fs/promises";
import { isAbsolute, join, normalize, resolve } from "node:path";
import process from "node:process";

const root = resolve(process.env.POSTURE_REPO_ROOT ?? process.cwd());
const catalogueArg = process.argv[2] ?? "security/cloud-posture-controls.json";
const governanceArg = process.argv[3] ?? "security/cloud-posture-governance.json";

function fail(message) {
  throw new Error(`Cloud posture validation failed: ${message}`);
}

function pathFromRoot(value) {
  return isAbsolute(value) ? value : join(root, value);
}

async function loadJson(path, label) {
  try {
    return JSON.parse(await readFile(pathFromRoot(path), "utf8"));
  } catch (error) {
    fail(`${label} could not be loaded as JSON: ${error.message}`);
  }
}

function requireString(value, label, minimum = 1) {
  if (typeof value !== "string" || value.trim().length < minimum) {
    fail(`${label} must be a string with at least ${minimum} character(s)`);
  }
  return value.trim();
}

function requireArray(value, label) {
  if (!Array.isArray(value) || value.length === 0) {
    fail(`${label} must be a non-empty array`);
  }
  return value;
}

function requireUniqueStrings(value, label) {
  const items = requireArray(value, label);
  const seen = new Set();
  for (const [index, item] of items.entries()) {
    const normalized = requireString(item, `${label}[${index}]`);
    if (seen.has(normalized)) fail(`${label} contains duplicate value ${normalized}`);
    seen.add(normalized);
  }
  return seen;
}

function requireSubset(values, allowed, label) {
  const seen = new Set();
  for (const value of requireArray(values, label)) {
    if (!allowed.has(value)) fail(`${label} contains unsupported value ${value}`);
    if (seen.has(value)) fail(`${label} contains duplicate value ${value}`);
    seen.add(value);
  }
  return seen;
}

async function requireRepositoryPath(relativePath, label) {
  const path = requireString(relativePath, label);
  if (isAbsolute(path) || normalize(path).startsWith("..")) {
    fail(`${label} must remain inside the repository`);
  }
  try {
    await access(join(root, path));
  } catch {
    fail(`${label} does not exist: ${path}`);
  }
}

const governance = await loadJson(governanceArg, "governance profile");
if (governance.schema_version !== 1) fail("governance schema_version must be 1");
if (governance.profile_id !== "AFYA-CSPM-BASELINE-1") {
  fail("governance profile_id must be AFYA-CSPM-BASELINE-1");
}
if (governance.profile_stage !== "repository-baseline") {
  fail("v0.10A governance profile_stage must remain repository-baseline");
}

const countries = requireUniqueStrings(governance.countries, "governance countries");
for (const required of ["kenya", "ghana", "south-africa"]) {
  if (!countries.has(required)) fail(`governance countries must include ${required}`);
}
const environments = requireUniqueStrings(governance.environments, "governance environments");
for (const required of ["development", "staging", "production", "shared"]) {
  if (!environments.has(required)) fail(`governance environments must include ${required}`);
}
const owners = requireUniqueStrings(governance.owners, "governance owners");
const categories = requireUniqueStrings(
  governance.required_categories,
  "governance required_categories",
);
const requiredControlIds = requireUniqueStrings(
  governance.required_control_ids,
  "governance required_control_ids",
);
const validationModes = requireUniqueStrings(
  governance.allowed_validation_modes,
  "governance allowed_validation_modes",
);
const detectionMethods = requireUniqueStrings(
  governance.allowed_detection_methods,
  "governance allowed_detection_methods",
);

for (const required of ["repository-static", "ci-enforced", "live-pending"]) {
  if (!validationModes.has(required)) {
    fail(`governance allowed_validation_modes must include ${required}`);
  }
}

const maximumSeverityHours = {
  critical: 24,
  high: 168,
  medium: 720,
  low: 2160,
};
const severityPolicy = governance.severity_policy;
if (!severityPolicy || typeof severityPolicy !== "object") {
  fail("governance severity_policy is required");
}
for (const [severity, maximumHours] of Object.entries(maximumSeverityHours)) {
  const policy = severityPolicy[severity];
  if (!policy || typeof policy !== "object") fail(`severity policy ${severity} is required`);
  if (!Number.isInteger(policy.max_remediation_hours) || policy.max_remediation_hours < 1) {
    fail(`${severity} max_remediation_hours must be a positive integer`);
  }
  if (policy.max_remediation_hours > maximumHours) {
    fail(`${severity} remediation SLA may not exceed ${maximumHours} hours`);
  }
  if ((severity === "critical" || severity === "high") && policy.merge_blocking !== true) {
    fail(`${severity} findings must remain merge blocking`);
  }
  if ((severity === "medium" || severity === "low") && typeof policy.merge_blocking !== "boolean") {
    fail(`${severity} merge_blocking must be boolean`);
  }
}

const exceptionPolicy = governance.exception_policy;
if (!exceptionPolicy || typeof exceptionPolicy !== "object") fail("exception_policy is required");
if (!Number.isInteger(exceptionPolicy.maximum_days) || exceptionPolicy.maximum_days < 1 || exceptionPolicy.maximum_days > 90) {
  fail("exception_policy.maximum_days must be between 1 and 90");
}
await requireRepositoryPath(exceptionPolicy.registry, "exception_policy.registry");
requireUniqueStrings(exceptionPolicy.required_fields, "exception_policy.required_fields");

const liveSources = requireArray(governance.live_cloud_sources, "live_cloud_sources");
const liveSourceNames = new Set();
for (const [index, source] of liveSources.entries()) {
  if (!source || typeof source !== "object") fail(`live_cloud_sources[${index}] must be an object`);
  const name = requireString(source.source, `live_cloud_sources[${index}].source`);
  if (liveSourceNames.has(name)) fail(`duplicate live cloud source ${name}`);
  liveSourceNames.add(name);
  if (source.status !== "planned") {
    fail(`${name} must remain planned while profile_stage is repository-baseline`);
  }
  requireString(source.purpose, `live_cloud_sources[${index}].purpose`, 20);
}
for (const required of ["cloud-asset-inventory", "security-command-center"]) {
  if (!liveSourceNames.has(required)) fail(`live_cloud_sources must include ${required}`);
}
requireArray(governance.live_validation_prerequisites, "live_validation_prerequisites");

const catalogue = await loadJson(catalogueArg, "control catalogue");
if (catalogue.schema_version !== 1) fail("catalogue schema_version must be 1");
if (catalogue.profile_id !== governance.profile_id) {
  fail("catalogue profile_id must match governance profile_id");
}
if (catalogue.source_control_matrix !== "docs/security-control-matrix.md") {
  fail("catalogue source_control_matrix must remain docs/security-control-matrix.md");
}
await requireRepositoryPath(catalogue.source_control_matrix, "source_control_matrix");
const matrix = await readFile(join(root, catalogue.source_control_matrix), "utf8");

const controls = requireArray(catalogue.controls, "catalogue controls");
if (controls.length < requiredControlIds.size) {
  fail(`catalogue must contain at least ${requiredControlIds.size} controls`);
}

const ids = new Set();
const coveredCategories = new Set();
const severityCounts = new Map();
const modeCounts = new Map();
let liveValidationPending = 0;

for (const [index, control] of controls.entries()) {
  const label = `controls[${index}]`;
  if (!control || typeof control !== "object") fail(`${label} must be an object`);

  const id = requireString(control.id, `${label}.id`);
  if (!/^(IAM|NET|KMS|SEC|CICD|DEP|CSPM|GOV|MON)-C\d{2}$/.test(id)) {
    fail(`${id}: id must reuse an existing security-control-matrix identifier`);
  }
  if (ids.has(id)) fail(`${id}: duplicate control id`);
  ids.add(id);
  if (!matrix.includes(`| ${id} |`)) {
    fail(`${id}: control id is not present in ${catalogue.source_control_matrix}`);
  }

  requireString(control.title, `${id}.title`, 12);
  requireString(control.requirement, `${id}.requirement`, 40);

  if (!categories.has(control.category)) {
    fail(`${id}: unsupported category ${control.category ?? "missing"}`);
  }
  coveredCategories.add(control.category);

  if (!Object.hasOwn(severityPolicy, control.severity)) {
    fail(`${id}: unsupported severity ${control.severity ?? "missing"}`);
  }
  severityCounts.set(control.severity, (severityCounts.get(control.severity) ?? 0) + 1);

  if (!owners.has(control.owner)) fail(`${id}: unsupported owner ${control.owner ?? "missing"}`);

  if (!control.applies_to || typeof control.applies_to !== "object") {
    fail(`${id}: applies_to is required`);
  }
  requireSubset(control.applies_to.countries, countries, `${id}.applies_to.countries`);
  requireSubset(control.applies_to.environments, environments, `${id}.applies_to.environments`);

  const implementationRefs = requireArray(control.implementation_refs, `${id}.implementation_refs`);
  for (const [refIndex, reference] of implementationRefs.entries()) {
    if (!reference || typeof reference !== "object") {
      fail(`${id}.implementation_refs[${refIndex}] must be an object`);
    }
    requireString(reference.kind, `${id}.implementation_refs[${refIndex}].kind`);
    await requireRepositoryPath(reference.path, `${id}.implementation_refs[${refIndex}].path`);
  }

  const detection = requireArray(control.detection, `${id}.detection`);
  for (const [detectionIndex, detector] of detection.entries()) {
    if (!detector || typeof detector !== "object") {
      fail(`${id}.detection[${detectionIndex}] must be an object`);
    }
    if (!detectionMethods.has(detector.method)) {
      fail(`${id}: unsupported detection method ${detector.method ?? "missing"}`);
    }
    if (!new Set(["active", "planned"]).has(detector.status)) {
      fail(`${id}: detection status must be active or planned`);
    }
    if (
      governance.profile_stage === "repository-baseline" &&
      new Set([
        "cloud-asset-inventory",
        "security-command-center",
        "cloud-logging",
        "terraform-plan-drift",
      ]).has(detector.method) &&
      detector.status !== "planned"
    ) {
      fail(`${id}: ${detector.method} cannot be active before live Google Cloud validation`);
    }
  }

  if (!control.validation || typeof control.validation !== "object") {
    fail(`${id}: validation is required`);
  }
  const mode = control.validation.mode;
  if (!validationModes.has(mode)) fail(`${id}: unsupported validation mode ${mode ?? "missing"}`);
  modeCounts.set(mode, (modeCounts.get(mode) ?? 0) + 1);
  if (typeof control.validation.live_validation_required !== "boolean") {
    fail(`${id}: live_validation_required must be boolean`);
  }
  if (mode === "live-pending" && control.validation.live_validation_required !== true) {
    fail(`${id}: live-pending controls must require live validation`);
  }
  if (control.validation.live_validation_required) {
    liveValidationPending += 1;
    requireString(control.validation.pending_reason, `${id}.validation.pending_reason`, 30);
  } else if (mode === "live-pending") {
    fail(`${id}: live-pending cannot be declared without pending live validation`);
  }

  if (!control.exception || typeof control.exception !== "object") fail(`${id}: exception policy is required`);
  if (typeof control.exception.allowed !== "boolean") fail(`${id}: exception.allowed must be boolean`);
  if (control.exception.allowed) {
    const maximumDays = control.exception.maximum_days;
    if (!Number.isInteger(maximumDays) || maximumDays < 1) {
      fail(`${id}: allowed exceptions require a positive maximum_days`);
    }
    if (maximumDays > exceptionPolicy.maximum_days) {
      fail(`${id}: exception maximum_days exceeds global policy`);
    }
    if (control.severity === "critical" && maximumDays > 30) {
      fail(`${id}: critical-control exceptions may not exceed 30 days`);
    }
  } else if (Object.hasOwn(control.exception, "maximum_days")) {
    fail(`${id}: maximum_days must be omitted when exceptions are prohibited`);
  }
}

for (const requiredId of requiredControlIds) {
  if (!ids.has(requiredId)) fail(`required posture control ${requiredId} is missing`);
}
for (const category of categories) {
  if (!coveredCategories.has(category)) fail(`required posture category ${category} has no control coverage`);
}
if ((modeCounts.get("live-pending") ?? 0) < 2) {
  fail("repository-baseline must explicitly retain multiple live-pending controls rather than overclaiming cloud validation");
}

console.log(`Cloud posture catalogue validated: ${controls.length} controls across ${coveredCategories.size} categories.`);
console.log(`Validation modes: ${JSON.stringify(Object.fromEntries(modeCounts))}`);
console.log(`Severity profile: ${JSON.stringify(Object.fromEntries(severityCounts))}`);
console.log(`Controls still requiring live Google Cloud validation: ${liveValidationPending}.`);
