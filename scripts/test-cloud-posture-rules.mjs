import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import process from "node:process";

const execFileAsync = promisify(execFile);
const root = resolve(process.cwd());
const validator = join(root, "scripts/validate-cloud-posture-rules.mjs");
const baselineRules = JSON.parse(await readFile(join(root, "security/cloud-posture-rules.json"), "utf8"));
const baselineCatalogue = JSON.parse(await readFile(join(root, "security/cloud-posture-controls.json"), "utf8"));
const baselineGovernance = JSON.parse(await readFile(join(root, "security/cloud-posture-governance.json"), "utf8"));

function clone(value) {
  return structuredClone(value);
}

function fail(message) {
  throw new Error(`Cloud posture rule governance test failed: ${message}`);
}

async function runValidator(rules, catalogue, governance) {
  const fixture = await mkdtemp(join(tmpdir(), "afyabridge-posture-rules-"));
  try {
    const rulesPath = join(fixture, "rules.json");
    const cataloguePath = join(fixture, "catalogue.json");
    const governancePath = join(fixture, "governance.json");
    await Promise.all([
      writeFile(rulesPath, `${JSON.stringify(rules, null, 2)}\n`),
      writeFile(cataloguePath, `${JSON.stringify(catalogue, null, 2)}\n`),
      writeFile(governancePath, `${JSON.stringify(governance, null, 2)}\n`),
    ]);
    return await execFileAsync(
      process.execPath,
      [validator, rulesPath, cataloguePath, governancePath],
      { cwd: root, env: { ...process.env, POSTURE_REPO_ROOT: root } },
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}

async function expectPass(label) {
  try {
    await runValidator(clone(baselineRules), clone(baselineCatalogue), clone(baselineGovernance));
    console.log(`PASS allow: ${label}`);
  } catch (error) {
    fail(`${label} unexpectedly failed: ${error.stderr ?? error.message}`);
  }
}

async function expectFail(label, expectedError, mutate) {
  const rules = clone(baselineRules);
  const catalogue = clone(baselineCatalogue);
  const governance = clone(baselineGovernance);
  mutate(rules, catalogue, governance);
  try {
    await runValidator(rules, catalogue, governance);
  } catch (error) {
    const output = `${error.stderr ?? ""}\n${error.stdout ?? ""}\n${error.message ?? ""}`;
    if (!output.includes(expectedError)) {
      fail(`${label} failed for the wrong reason; expected error containing: ${expectedError}`);
    }
    console.log(`PASS deny: ${label}`);
    return;
  }
  fail(`${label} unexpectedly passed`);
}

await expectPass("reviewed executable posture rule set");

const cases = [
  [
    "required rule deleted",
    "required executable posture rule POSTURE-IAM-001 is missing",
    (rules) => { rules.rules = rules.rules.filter((rule) => rule.id !== "POSTURE-IAM-001"); },
  ],
  [
    "required rule remapped to lower-severity control",
    "POSTURE-IAM-001: control binding must remain IAM-C01",
    (rules) => { rules.rules.find((rule) => rule.id === "POSTURE-IAM-001").control_id = "GOV-C01"; },
  ],
  [
    "duplicate rule identifier",
    "duplicate rule id",
    (rules) => { rules.rules.push(clone(rules.rules[0])); },
  ],
  [
    "unsupported live source introduced before live collector",
    "unsupported source cloud-asset-inventory",
    (rules) => { rules.rules[0].supported_sources = ["cloud-asset-inventory"]; },
  ],
  [
    "claim scope overstates live state",
    "unsupported claim_scope live-effective-state",
    (rules) => { rules.rules[0].claim_scope = "live-effective-state"; },
  ],
  [
    "reviewed partial claim scope overclaimed",
    "POSTURE-LOC-001: claim_scope must remain repository-partial",
    (rules) => { rules.rules.find((rule) => rule.id === "POSTURE-LOC-001").claim_scope = "repository-desired-state"; },
  ],
  [
    "rule loses all assertions",
    "POSTURE-IAM-001.assertions must be a non-empty array",
    (rules) => { rules.rules[0].assertions = []; },
  ],
  [
    "single required assertion deleted",
    "required reviewed assertion is missing or changed",
    (rules) => { rules.rules[0].assertions.splice(1, 1); },
  ],
  [
    "required assertion fact remapped",
    "required reviewed assertion is missing or changed",
    (rules) => { rules.rules[0].assertions[0].fact = "identity.runtime_service_account_created"; },
  ],
  [
    "required boolean expectation weakened",
    "required reviewed assertion is missing or changed",
    (rules) => { rules.rules[0].assertions[0].expected = false; },
  ],
  [
    "required metadata set reduced",
    "required reviewed assertion is missing or changed",
    (rules) => {
      const rule = rules.rules.find((entry) => entry.id === "POSTURE-GOV-001");
      rule.assertions.find((assertion) => assertion.fact === "governance.project_required_labels").expected = ["owner"];
    },
  ],
  [
    "unknown assertion operator",
    "unsupported operator matches",
    (rules) => { rules.rules[0].assertions[0].operator = "matches"; },
  ],
  [
    "rule and governance binding deleted together",
    "governance required rule POSTURE-IAM-001 is missing",
    (rules, _catalogue, governance) => {
      rules.rules = rules.rules.filter((rule) => rule.id !== "POSTURE-IAM-001");
      governance.repository_posture.required_rules = governance.repository_posture.required_rules.filter(
        (rule) => rule.id !== "POSTURE-IAM-001",
      );
    },
  ],
  [
    "governance remaps required rule to lower-severity control",
    "governance POSTURE-IAM-001 binding must remain IAM-C01",
    (_rules, _catalogue, governance) => {
      governance.repository_posture.required_rules.find((rule) => rule.id === "POSTURE-IAM-001").control_id = "GOV-C01";
    },
  ],
];

for (const [label, expectedError, mutate] of cases) {
  await expectFail(label, expectedError, mutate);
}

console.log(`Cloud posture rule governance validated: ${cases.length + 1} scenarios passed.`);
