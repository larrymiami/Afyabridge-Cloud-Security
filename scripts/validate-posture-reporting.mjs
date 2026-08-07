import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { validateReportingConfiguration, parseReportingTimestamp } from "./generate-posture-report.mjs";

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

const policyPath = arg("--policy", "security/posture-reporting-policy.json");
const governancePath = arg("--governance", "security/cloud-posture-governance.json");
const historyPath = arg("--history", "security/posture-metrics-history.json");
const asOfValue = arg("--as-of", null);
const asOf = asOfValue
  ? parseReportingTimestamp(asOfValue, "--as-of")
  : new Date(Math.floor(Date.now() / 1000) * 1000);

const [policy, governance, history] = await Promise.all([
  load(policyPath, "reporting policy"),
  load(governancePath, "posture governance"),
  load(historyPath, "metrics history"),
]);

validateReportingConfiguration({ policy, governance, history, asOf });
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
  `Posture reporting governance validated: policy=${policy.policy_id}; history_snapshots=${history.snapshots.length}; lookback_days=${policy.trend.lookback_days}; minimum_snapshots=${policy.trend.minimum_snapshots}.`,
);
