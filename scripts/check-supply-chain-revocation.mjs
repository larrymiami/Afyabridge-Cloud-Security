import { readFile } from "node:fs/promises";
import process from "node:process";

function fail(message) {
  throw new Error(`Supply-chain revocation check failed: ${message}`);
}

function parseArgs(argv) {
  const options = {
    registry: "security/supply-chain-revocations.json",
    sourceSha: null,
    artifactSha256: null,
    workflowIdentity: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === "--registry") options.registry = value;
    else if (argument === "--source-sha") options.sourceSha = value;
    else if (argument === "--artifact-sha256") options.artifactSha256 = value;
    else if (argument === "--workflow-identity") options.workflowIdentity = value;
    else fail(`unsupported argument ${argument}`);
    index += 1;
    if (!value) fail(`${argument} requires a value`);
  }

  return options;
}

function parseDate(value, field, id) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) {
    fail(`${id}: ${field} must use YYYY-MM-DD`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    fail(`${id}: ${field} is invalid`);
  }
  return date;
}

const options = parseArgs(process.argv.slice(2));
const registry = JSON.parse(await readFile(options.registry, "utf8"));

if (registry.schema_version !== 1) fail("schema_version must be 1");
if (!Array.isArray(registry.revocations)) fail("revocations must be an array");

const allowedKinds = new Set([
  "artifact-digest",
  "source-commit",
  "workflow-identity",
]);
const ids = new Set();
const values = new Set();
const today = new Date();
today.setUTCHours(0, 0, 0, 0);

for (const revocation of registry.revocations) {
  const id = revocation?.id;
  if (!/^SC-REV-\d{4}-\d{3}$/.test(id ?? "")) {
    fail("revocation id must match SC-REV-YYYY-NNN");
  }
  if (ids.has(id)) fail(`${id}: duplicate id`);
  ids.add(id);

  if (!allowedKinds.has(revocation.kind)) {
    fail(`${id}: unsupported kind ${revocation.kind ?? "missing"}`);
  }
  if (typeof revocation.value !== "string") fail(`${id}: value is required`);

  if (
    revocation.kind === "artifact-digest" &&
    !/^sha256:[0-9a-f]{64}$/i.test(revocation.value)
  ) {
    fail(`${id}: artifact-digest value must be sha256:<64 hex characters>`);
  }
  if (
    revocation.kind === "source-commit" &&
    !/^[0-9a-f]{40}$/i.test(revocation.value)
  ) {
    fail(`${id}: source-commit value must be a full 40-character commit SHA`);
  }
  if (
    revocation.kind === "workflow-identity" &&
    !/^https:\/\/github\.com\/[^/]+\/[^/]+\/\.github\/workflows\/[^@]+@.+$/.test(
      revocation.value,
    )
  ) {
    fail(`${id}: workflow-identity value must be an exact GitHub Actions workflow identity`);
  }

  const uniqueValue = `${revocation.kind}:${revocation.value.toLowerCase()}`;
  if (values.has(uniqueValue)) fail(`${id}: duplicate revoked value`);
  values.add(uniqueValue);

  if (
    typeof revocation.reason !== "string" ||
    revocation.reason.trim().length < 20
  ) {
    fail(`${id}: reason must be substantive`);
  }
  if (typeof revocation.owner !== "string" || revocation.owner.trim().length < 2) {
    fail(`${id}: owner is required`);
  }
  if (
    typeof revocation.tracking_url !== "string" ||
    !/^https:\/\/github\.com\/[^/]+\/[^/]+\/(issues|pull)\/\d+$/.test(
      revocation.tracking_url,
    )
  ) {
    fail(`${id}: tracking_url must reference a GitHub issue or pull request`);
  }

  const revokedOn = parseDate(revocation.revoked_on, "revoked_on", id);
  if (revokedOn > today) fail(`${id}: revoked_on cannot be in the future`);
}

const candidates = [
  options.sourceSha
    ? { kind: "source-commit", value: options.sourceSha.toLowerCase() }
    : null,
  options.artifactSha256
    ? {
        kind: "artifact-digest",
        value: options.artifactSha256.toLowerCase().startsWith("sha256:")
          ? options.artifactSha256.toLowerCase()
          : `sha256:${options.artifactSha256.toLowerCase()}`,
      }
    : null,
  options.workflowIdentity
    ? { kind: "workflow-identity", value: options.workflowIdentity.toLowerCase() }
    : null,
].filter(Boolean);

for (const candidate of candidates) {
  const match = registry.revocations.find(
    (revocation) =>
      revocation.kind === candidate.kind &&
      revocation.value.toLowerCase() === candidate.value,
  );
  if (match) {
    fail(
      `${candidate.kind} ${candidate.value} is revoked by ${match.id}: ${match.reason}`,
    );
  }
  console.log(`ALLOW ${candidate.kind} ${candidate.value}`);
}

console.log(
  `Supply-chain revocation registry validated: ${registry.revocations.length} revoked trust subject(s); ${candidates.length} candidate(s) allowed.`,
);
