import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { validateReportingConfiguration, parseReportingTimestamp } from "./generate-posture-report.mjs";

const EXPECTED_CONTROL_SEVERITIES = {
  "IAM-C01": "critical",
  "IAM-C02": "high",
  "NET-C01": "critical",
  "NET-C04": "high",
  "KMS-C01": "high",
  "KMS-C03": "high",
  "SEC-C02": "critical",
  "CICD-C01": "critical",
  "DEP-C02": "high",
  "CSPM-C01": "critical",
  "CSPM-C02": "high",
  "CSPM-C03": "high",
  "CSPM-C04": "high",
  "CSPM-C05": "high",
  "GOV-C01": "medium",
  "GOV-C02": "critical",
  "GOV-C03": "high",
  "MON-C01": "high"
};

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

async function load(path, label) {
  try {
    return JSON.parse(await readFile(resolve(path), "utf8"));
  } catch (error) {
    throw new Error(`Posture reporting governance validation failed: ${label} could not be loaded: ${error.message}`);
  }
}

export function validateCommittedHistoryBoundary({ governance, history }) {
  if (governance.profile_stage === "repository-baseline" && history.snapshots.length !== 0) {
    throw new Error(
      "Posture reporting governance validation failed: committed metrics history must remain empty while profile_stage is repository-baseline; repository CI snapshots are evidence artifacts, not trusted operational trend history",
    );
  }
}

export function validateReportingSeverityBaseline({ catalogue }) {
  if (catalogue?.schema_version !== 1 || !Array.isArray(catalogue.controls)) {
    throw new Error("Posture reporting governance validation failed: posture catalogue is malformed");
  }
  const controls = new Map(catalogue.controls.map((control) => [control.id, control]));
  for (const [controlId, expectedSeverity] of Object.entries(EXPECTED_CONTROL_SEVERITIES)) {
    const control = controls.get(controlId);
    if (!control) {
      throw new Error(`Posture reporting governance validation failed: reviewed control ${controlId} is missing`);
    }
    if (control.severity !== expectedSeverity) {
      throw new Error(
        `Posture reporting governance validation failed: ${controlId} severity must remain ${expectedSeverity}, got ${control.severity ?? "missing"}`,
      );
    }
  }
}

async function main() {
  const policyPath = arg("--policy", "security/posture-reporting-policy.json");
  const governancePath = arg("--governance", "security/cloud-posture-governance.json");
  const historyPath = arg("--history", "security/posture-metrics-history.json");
  const cataloguePath = arg("--catalogue", "security/cloud-posture-controls.json");
  const asOfValue = arg("--as-of", null);
  const asOf = asOfValue
    ? parseReportingTimestamp(asOfValue, "--as-of")
    : new Date(Math.floor(Date.now() / 1000) * 1000);

  const [policy, governance, history, catalogue] = await Promise.all([
    load(policyPath, "reporting policy"),
    load(governancePath, "posture governance"),
    load(historyPath, "metrics history"),
    load(cataloguePath, "posture catalogue"),
  ]);

  validateReportingConfiguration({ policy, governance, history, asOf });
  validateCommittedHistoryBoundary({ governance, history });
  validateReportingSeverityBaseline({ catalogue });
  for (const [label, path] of [
    ["findings registry", policy.findings_registry],
    ["exceptions registry", policy.exceptions_registry],
    ["history registry", policy.history_registry],
  ]) {
    try {
      await access(resolve(path));
    } catch {
      throw new Error(`Posture reporting governance validation failed: ${label} does not exist at ${path}`);
    }
  }

  console.log(
    `Posture reporting governance validated: policy=${policy.policy_id}; history_snapshots=${history.snapshots.length}; lookback_days=${policy.trend.lookback_days}; minimum_snapshots=${policy.trend.minimum_snapshots}; severity_bindings=${Object.keys(EXPECTED_CONTROL_SEVERITIES).length}; committed_history_mode=${governance.profile_stage === "repository-baseline" ? "empty-until-live" : "governed"}.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
