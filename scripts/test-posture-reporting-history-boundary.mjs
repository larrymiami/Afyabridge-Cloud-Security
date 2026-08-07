import { readFile } from "node:fs/promises";
import { validateCommittedHistoryBoundary } from "./validate-posture-reporting.mjs";

const governance = JSON.parse(await readFile("security/cloud-posture-governance.json", "utf8"));
const history = JSON.parse(await readFile("security/posture-metrics-history.json", "utf8"));

let scenarios = 0;
function expect(condition, name) {
  if (!condition) throw new Error(`FAIL ${name}`);
  scenarios += 1;
  console.log(`PASS ${name}`);
}

validateCommittedHistoryBoundary({ governance, history });
expect(history.snapshots.length === 0, "allow: repository baseline keeps committed metrics history empty");

const fabricated = structuredClone(history);
fabricated.snapshots.push({
  schema_version: 1,
  profile_id: "AFYA-CSPM-BASELINE-1",
  generated_at: "2026-08-01T12:00:00Z",
  evidence_mode: "repository-baseline",
  decision: "pass",
  metrics: {
    active_findings: 0,
    overdue_findings: 0,
    risk_accepted_findings: 0,
    closed_findings: 99,
    repository_failing_rules: 0,
    repository_blocking_findings: 0
  }
});
let rejected = false;
try {
  validateCommittedHistoryBoundary({ governance, history: fabricated });
} catch {
  rejected = true;
}
expect(rejected, "deny: repository PR cannot seed invented trend history");

console.log(`Posture reporting committed-history controls validated: ${scenarios} scenarios passed.`);
