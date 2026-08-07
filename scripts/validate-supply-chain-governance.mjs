import { readFile } from "node:fs/promises";
import process from "node:process";

const root = process.env.SUPPLY_CHAIN_REPO_ROOT ?? process.cwd();

async function source(path) {
  return readFile(`${root}/${path}`, "utf8");
}

function fail(message) {
  throw new Error(`Supply-chain governance validation failed: ${message}`);
}

function artifactBlock(workflow, namePattern) {
  const pattern = new RegExp(
    `uses:\\s*actions\\/upload-artifact@[^\\n]+[\\s\\S]*?name:\\s*${namePattern}[^\\n]*[\\s\\S]*?(?=\\n\\s*- name:|$)`,
  );
  const match = workflow.match(pattern);
  if (!match) fail(`missing upload-artifact block for ${namePattern}`);
  return match[0];
}

const dependabot = await source(".github/dependabot.yml");
if (!/^version:\s*2\s*$/m.test(dependabot)) {
  fail("Dependabot configuration must use version 2");
}
for (const ecosystem of ["npm", "github-actions", "docker", "terraform"]) {
  if (!new RegExp(`package-ecosystem:\\s*${ecosystem}(?:\\s|$)`).test(dependabot)) {
    fail(`Dependabot must monitor ${ecosystem}`);
  }
}
if ((dependabot.match(/interval:\s*weekly/g) ?? []).length < 4) {
  fail("Each reviewed dependency ecosystem must receive a weekly update check");
}
if (!/versioning-strategy:\s*increase-if-necessary/.test(dependabot)) {
  fail("npm updates must preserve compatible constraints where possible");
}

const securityGates = await source(".github/workflows/security-gates.yml");
if (!/fail-on-severity:\s*high/.test(securityGates)) {
  fail("dependency review must block newly introduced high-severity vulnerabilities");
}
if (!/deny-licenses:[^\n]*AGPL-3\.0-only/.test(securityGates)) {
  fail("dependency review must retain the reviewed copyleft license deny list");
}
if (
  !/name:\s*Package vulnerability scan[\s\S]*?severity:\s*HIGH,CRITICAL[\s\S]*?exit-code:\s*'1'/.test(
    securityGates,
  )
) {
  fail("repository package scanning must continue to block fixable HIGH/CRITICAL findings");
}
if (
  !/name:\s*Container image scan[\s\S]*?severity:\s*HIGH,CRITICAL[\s\S]*?exit-code:\s*'1'/.test(
    securityGates,
  )
) {
  fail("container scanning must continue to block fixable HIGH/CRITICAL findings");
}

const supplyChain = await source(".github/workflows/supply-chain.yml");
const buildEvidence = artifactBlock(supplyChain, "supply-chain-build-");
if (!/retention-days:\s*30/.test(buildEvidence)) {
  fail("unsigned build/SBOM evidence must be retained for 30 days");
}
const provenanceEvidence = artifactBlock(supplyChain, "supply-chain-provenance-");
if (!/retention-days:\s*90/.test(provenanceEvidence)) {
  fail("signed provenance evidence must be retained for 90 days");
}
if (!/check-supply-chain-revocation\.mjs/.test(supplyChain)) {
  fail("supply-chain trust decisions must consult the revocation registry");
}
if (!/validate-supply-chain-governance\.mjs/.test(supplyChain)) {
  fail("supply-chain workflow must execute governance validation");
}
if (!/test-supply-chain-compromise-controls\.mjs/.test(supplyChain)) {
  fail("supply-chain workflow must execute negative compromise tests");
}

const gateEvidence = artifactBlock(securityGates, "security-gate-evidence-");
if (!/retention-days:\s*30/.test(gateEvidence)) {
  fail("security-gate evidence must be retained for 30 days");
}

const terraformApply = await source(
  ".github/workflows/terraform-federation-apply.yml",
);
const planEvidence = artifactBlock(terraformApply, "federation-plan-");
if (!/retention-days:\s*1/.test(planEvidence)) {
  fail("saved Terraform plans must remain short-lived at one day");
}

console.log(
  "Supply-chain dependency risk, evidence retention, revocation, and compromise-test governance validated.",
);
