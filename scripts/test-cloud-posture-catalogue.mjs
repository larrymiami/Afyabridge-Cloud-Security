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

async function expectFail(label, mutate) {
  const catalogue = clone(baselineCatalogue);
  const governance = clone(baselineGovernance);
  mutate(catalogue, governance);
  try {
    await runValidator(catalogue, governance);
  } catch {
    console.log(`PASS deny: ${label}`);
    return;
  }
  fail(`${label} unexpectedly passed`);
}

await expectPass("reviewed cloud posture baseline");

const cases = [
  {
    label: "duplicate control identifier",
    mutate: (catalogue) => catalogue.controls.push(clone(catalogue.controls[0])),
  },
  {
    label: "control identifier missing from authoritative matrix",
    mutate: (catalogue) => {
      catalogue.controls[0].id = "IAM-C99";
    },
  },
  {
    label: "unknown country scope",
    mutate: (catalogue) => {
      catalogue.controls[0].applies_to.countries.push("unknown-country");
    },
  },
  {
    label: "unapproved control owner",
    mutate: (catalogue) => {
      catalogue.controls[0].owner = "nobody";
    },
  },
  {
    label: "required data-location category removed",
    mutate: (catalogue) => {
      catalogue.controls.find((control) => control.id === "CSPM-C02").category = "cloud-posture";
    },
  },
  {
    label: "critical remediation SLA weakened",
    mutate: (_catalogue, governance) => {
      governance.severity_policy.critical.max_remediation_hours = 48;
    },
  },
  {
    label: "live Cloud Asset Inventory overclaimed as operational",
    mutate: (_catalogue, governance) => {
      governance.live_cloud_sources.find((source) => source.source === "cloud-asset-inventory").status = "active";
    },
  },
  {
    label: "control overclaims live cloud detector",
    mutate: (catalogue) => {
      const detector = catalogue.controls
        .find((control) => control.id === "CSPM-C01")
        .detection.find((item) => item.method === "cloud-asset-inventory");
      detector.status = "active";
    },
  },
  {
    label: "live-pending control loses pending rationale",
    mutate: (catalogue) => {
      delete catalogue.controls.find((control) => control.id === "CSPM-C03").validation.pending_reason;
    },
  },
  {
    label: "implementation evidence points outside reviewed repository state",
    mutate: (catalogue) => {
      catalogue.controls[0].implementation_refs[0].path = "infra/terraform/does-not-exist.tf";
    },
  },
  {
    label: "control exception exceeds global policy",
    mutate: (catalogue) => {
      catalogue.controls.find((control) => control.id === "GOV-C01").exception.maximum_days = 91;
    },
  },
];

for (const test of cases) {
  await expectFail(test.label, test.mutate);
}

console.log(`Cloud posture negative controls validated: ${cases.length + 1} scenarios passed.`);
