import { readFile } from "node:fs/promises";
import process from "node:process";

const registryPath = process.argv[2] ?? "security/exceptions.json";
const allowedGates = new Set([
  "secret-scanning",
  "dependency-review",
  "license-review",
  "codeql",
  "iac-scan",
  "package-scan",
  "container-scan",
  "api-contract",
  "policy-as-code",
]);

function fail(message) {
  throw new Error(`Security exception validation failed: ${message}`);
}

function parseDate(value, field, id) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) {
    fail(`${id}: ${field} must use YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) fail(`${id}: ${field} is invalid`);
  return date;
}

const registry = JSON.parse(await readFile(registryPath, "utf8"));
if (registry.schema_version !== 1) fail("schema_version must be 1");
if (!Array.isArray(registry.exceptions)) fail("exceptions must be an array");

const ids = new Set();
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

for (const exception of registry.exceptions) {
  const id = exception?.id;
  if (!/^SEC-EX-\d{4}-\d{3}$/.test(id ?? "")) fail("exception id must match SEC-EX-YYYY-NNN");
  if (ids.has(id)) fail(`${id}: duplicate id`);
  ids.add(id);

  if (!allowedGates.has(exception.gate)) fail(`${id}: unsupported gate ${exception.gate ?? "missing"}`);
  if (typeof exception.scope !== "string" || exception.scope.trim().length < 3) fail(`${id}: scope is required`);
  if (typeof exception.rationale !== "string" || exception.rationale.trim().length < 20) fail(`${id}: rationale must be substantive`);
  if (!Array.isArray(exception.compensating_controls) || exception.compensating_controls.length === 0) fail(`${id}: compensating_controls are required`);
  if (exception.compensating_controls.some((value) => typeof value !== "string" || value.trim().length < 5)) fail(`${id}: compensating controls must be descriptive strings`);
  if (typeof exception.owner !== "string" || exception.owner.trim().length < 2) fail(`${id}: owner is required`);
  if (typeof exception.approved_by !== "string" || exception.approved_by.trim().length < 2) fail(`${id}: approved_by is required`);
  if (exception.owner === exception.approved_by) fail(`${id}: owner and approver must be different`);
  if (typeof exception.tracking_url !== "string" || !/^https:\/\/github\.com\/[^/]+\/[^/]+\/(issues|pull)\/\d+$/.test(exception.tracking_url)) fail(`${id}: tracking_url must reference a GitHub issue or pull request`);

  const created = parseDate(exception.created_on, "created_on", id);
  const expires = parseDate(exception.expires_on, "expires_on", id);
  const lifetimeDays = Math.round((expires - created) / 86400000);
  if (lifetimeDays < 1 || lifetimeDays > 90) fail(`${id}: exception lifetime must be between 1 and 90 days`);
  if (expires < today) fail(`${id}: exception expired on ${exception.expires_on}`);
}

console.log(`Security exception registry validated: ${registry.exceptions.length} active exception(s).`);
