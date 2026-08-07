import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import process from "node:process";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const validator = join(root, "scripts/validate-cloud-posture-catalogue.mjs");
const baselineCatalogue = JSON.parse(
  await readFile(join(root, "security/cloud-posture-controls.json"), "utf8"),
);
const baselineGovernance = JSON.parse(
  await readFile(join(root, "security/cloud-posture-governance.json"), "utf8"),
);

function clone(value) {
  return structuredClone(value);
}

function fail(message) {
  throw new Error(`Cloud posture negative test failed: ${message}`);
}

async function runValidator(catalogue, governance) {
  const fixture = await mkdtemp(join(tmpdir(), "afyabridge-posture-"));
  const cataloguePath = join(fixture, "catalogue.json");
  const governancePath = join(fixture, "governance.json");
  try {
    await writeFile(cataloguePath, `${JSON.stringify(catalogue, null, 2)}\n`);
    await writeFile(governancePath, `${JSON.stringify(governance, null, 2)}\n`);
    return await execFileAsync(
      process.execPath,
      [validator, cataloguePath, governancePath],
      {
        cwd: root,
        env: { ...process.env, POSTURE_REPO_ROOT: root },
      },
    );
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}

async function expectPass(label, mutate = () => {}) {
  const catalogue = clone(baselineCatalogue);
  const governance = clone(baselineGovernance);
  mutate(catalogue, governance);
  try {
    await runValidator(catalogue, governance);
    console.log(`PASS allow: ${label}`);
  } catch (error) {
    fail(`${label} unexpectedly failed: ${error.stderr ?? error.message}`);
  }
}

async function expectFail(label, expectedError, mutate) {
  const catalogue = clone(baselineCatalogue);
  const governance = clone(baselineGovernance);
  mutate(catalogue, governance);
  try {
    await runValidator(catalogue, governance);
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

await expectPass("reviewed cloud posture baseline");

const cases = [
  {
    label: "duplicate control identifier",
    expectedError: "duplicate control id",
    mutate: (catalogue) => catalogue.controls.push(clone(catalogue.controls[0])),
  },
  {
    label: "control identifier missing from authoritative matrix",
    expectedError: "control id is not present",
    mutate: (catalogue) => {
      catalogue.controls[0].id = "IAM-C99";
    },
  },
  {
    label: "active posture entry points at matrix control still marked Planned",
    expectedError: "authoritative control-matrix status Planned is inconsistent with inclusion in the active posture baseline",
    mutate: (catalogue) => {
      catalogue.controls[0].id = "IAM-C04";
    },
  },
  {
    label: "unknown country scope",
    expectedError: "contains unsupported value unknown-country",
    mutate: (catalogue) => {
      catalogue.controls[0].applies_to.countries.push("unknown-country");
    },
  },
  {
    label: "unapproved control owner",
    expectedError: "unsupported owner nobody",
    mutate: (catalogue) => {
      catalogue.controls[0].owner = "nobody";
    },
  },
  {
    label: "required data-location category removed",
    expectedError: "required posture category data-location has no control coverage",
    mutate: (catalogue) => {
      catalogue.controls.find((control) => control.id === "CSPM-C02").category = "cloud-posture";
    },
  },
  {
    label: "critical remediation SLA weakened",
    expectedError: "critical remediation SLA may not exceed 24 hours",
    mutate: (_catalogue, governance) => {
      governance.severity_policy.critical.max_remediation_hours = 48;
    },
  },
  {
    label: "exception registry redirected away from the reviewed contract",
    expectedError: "exception_policy.registry must remain security/exceptions.json",
    mutate: (_catalogue, governance) => {
      governance.exception_policy.registry = "security/supply-chain-revocations.json";
    },
  },
  {
    label: "required exception approval field removed",
    expectedError: "exception_policy.required_fields must match the reviewed security exception contract",
    mutate: (_catalogue, governance) => {
      governance.exception_policy.required_fields = governance.exception_policy.required_fields.filter(
        (field) => field !== "approved_by",
      );
    },
  },
  {
    label: "live Cloud Asset Inventory overclaimed as operational",
    expectedError: "cloud-asset-inventory must remain planned while profile_stage is repository-baseline",
    mutate: (_catalogue, governance) => {
      governance.live_cloud_sources.find((source) => source.source === "cloud-asset-inventory").status = "active";
    },
  },
  {
    label: "control overclaims live cloud detector",
    expectedError: "cloud-asset-inventory cannot be active before live Google Cloud validation",
    mutate: (catalogue) => {
      const detector = catalogue.controls
        .find((control) => control.id === "CSPM-C01")
        .detection.find((item) => item.method === "cloud-asset-inventory");
      detector.status = "active";
    },
  },
  {
    label: "live-pending control loses pending rationale",
    expectedError: "CSPM-C03.validation.pending_reason must be a string",
    mutate: (catalogue) => {
      delete catalogue.controls.find((control) => control.id === "CSPM-C03").validation.pending_reason;
    },
  },
  {
    label: "implementation evidence points outside reviewed repository state",
    expectedError: "does not exist: infra/terraform/does-not-exist.tf",
    mutate: (catalogue) => {
      catalogue.controls[0].implementation_refs[0].path = "infra/terraform/does-not-exist.tf";
    },
  },
  {
    label: "control exception exceeds global policy",
    expectedError: "exception maximum_days exceeds global policy",
    mutate: (catalogue) => {
      catalogue.controls.find((control) => control.id === "GOV-C01").exception.maximum_days = 91;
    },
  },
];

for (const test of cases) {
  await expectFail(test.label, test.expectedError, test.mutate);
}

console.log(`Cloud posture negative controls validated: ${cases.length + 1} scenarios passed.`);
