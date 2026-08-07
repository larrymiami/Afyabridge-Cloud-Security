import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import process from "node:process";

const execFileAsync = promisify(execFile);
const root = resolve(process.cwd());
const validator = join(root, "scripts/validate-posture-findings.mjs");
const defaultAsOf = "2026-08-07T12:00:00Z";

function fail(message) {
  throw new Error(`Posture finding lifecycle test failed: ${message}`);
}

function validOpenFinding() {
  return {
    id: "CSPM-FND-2026-001",
    source: "repository-posture",
    control_id: "NET-C04",
    rule_id: "POSTURE-EDGE-001",
    severity: "high",
    title: "Approved public edge posture requires remediation",
    owner: "cloud-security",
    status: "open",
    detected_at: "2026-08-07T10:00:00Z",
    remediation_due_at: "2026-08-14T10:00:00Z",
    tracking_url: "https://github.com/larrymiami/Afyabridge-Cloud-Security/issues/1",
    history: [
      {
        status: "open",
        at: "2026-08-07T10:00:00Z",
        actor: "security-automation",
        note: "Finding created from the governed repository posture check."
      }
    ]
  };
}

function validException(findingId = "CSPM-FND-2026-001") {
  return {
    id: "SEC-EX-2026-001",
    gate: "cloud-posture",
    scope: `${findingId} / NET-C04`,
    rationale: "Temporary risk acceptance while the reviewed remediation is implemented and independently verified.",
    compensating_controls: [
      "Keep the affected edge restricted to approved ingress while remediation is in progress."
    ],
    owner: "cloud-security",
    approved_by: "security-operations",
    tracking_url: "https://github.com/larrymiami/Afyabridge-Cloud-Security/issues/2",
    finding_ids: [findingId],
    created_on: "2026-08-07",
    expires_on: "2026-08-21"
  };
}

function validRiskAcceptedFinding() {
  const finding = validOpenFinding();
  finding.status = "risk-accepted";
  finding.exception_id = "SEC-EX-2026-001";
  finding.history.push({
    status: "risk-accepted",
    at: "2026-08-07T11:00:00Z",
    actor: "security-operations",
    note: "Time-bounded risk acceptance approved with compensating controls."
  });
  return finding;
}

function validClosedFinding() {
  const finding = validOpenFinding();
  finding.status = "closed";
  finding.history.push(
    {
      status: "in-remediation",
      at: "2026-08-07T10:30:00Z",
      actor: "cloud-security",
      note: "Remediation work started under the assigned finding owner."
    },
    {
      status: "resolved",
      at: "2026-08-07T11:15:00Z",
      actor: "cloud-security",
      note: "Remediation completed and evidence attached for independent verification."
    },
    {
      status: "closed",
      at: "2026-08-07T11:45:00Z",
      actor: "security-operations",
      note: "Independent verification completed and the finding was closed."
    }
  );
  finding.resolution = {
    resolved_at: "2026-08-07T11:15:00Z",
    summary: "The reviewed edge configuration was remediated and the posture control now passes again.",
    remediation_evidence: ["repo:docs/evidence/example-remediation.md"],
    verified_by: "security-operations",
    verified_at: "2026-08-07T11:40:00Z",
    closed_at: "2026-08-07T11:45:00Z",
    closure_evidence: [
      "https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/1"
    ]
  };
  return finding;
}

function validClosedAfterRiskAcceptance() {
  const finding = validRiskAcceptedFinding();
  finding.status = "closed";
  finding.history.push(
    {
      status: "in-remediation",
      at: "2026-08-07T11:10:00Z",
      actor: "cloud-security",
      note: "Risk acceptance ended and remediation work resumed."
    },
    {
      status: "resolved",
      at: "2026-08-07T11:30:00Z",
      actor: "cloud-security",
      note: "Remediation completed after the temporary risk acceptance."
    },
    {
      status: "closed",
      at: "2026-08-07T11:50:00Z",
      actor: "security-operations",
      note: "Independent verification passed and historical risk acceptance was retained."
    }
  );
  finding.resolution = {
    resolved_at: "2026-08-07T11:30:00Z",
    summary: "The temporarily accepted edge finding was remediated and independently verified after acceptance ended.",
    remediation_evidence: ["repo:docs/evidence/example-remediation.md"],
    verified_by: "security-operations",
    verified_at: "2026-08-07T11:45:00Z",
    closed_at: "2026-08-07T11:50:00Z",
    closure_evidence: ["https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/1"]
  };
  return finding;
}

async function run(findings, exceptions = [], asOf = defaultAsOf) {
  const directory = await mkdtemp(join(tmpdir(), "afyabridge-finding-lifecycle-"));
  try {
    const findingsPath = join(directory, "findings.json");
    const exceptionsPath = join(directory, "exceptions.json");
    await Promise.all([
      writeFile(findingsPath, `${JSON.stringify({ schema_version: 1, findings }, null, 2)}\n`, "utf8"),
      writeFile(exceptionsPath, `${JSON.stringify({ schema_version: 1, exceptions }, null, 2)}\n`, "utf8"),
    ]);
    return await execFileAsync(
      process.execPath,
      [validator, "--findings", findingsPath, "--exceptions", exceptionsPath, "--as-of", asOf],
      { cwd: root, env: { ...process.env, POSTURE_REPO_ROOT: root } },
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function expectPass(label, findings, exceptions = [], asOf = defaultAsOf) {
  try {
    await run(findings, exceptions, asOf);
    console.log(`PASS allow: ${label}`);
  } catch (error) {
    fail(`${label} unexpectedly failed: ${error.stderr ?? error.message}`);
  }
}

async function expectFail(label, expectedError, findings, exceptions = [], asOf = defaultAsOf) {
  try {
    await run(findings, exceptions, asOf);
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

await expectPass("empty finding registry", []);
await expectPass("valid open finding", [validOpenFinding()]);
await expectPass("valid risk-accepted finding with active linked exception", [validRiskAcceptedFinding()], [validException()]);
await expectPass("valid independently verified closed finding", [validClosedFinding()]);
await expectPass(
  "closed finding retains historical expired exception evidence",
  [validClosedAfterRiskAcceptance()],
  [validException()],
  "2026-09-01T12:00:00Z",
);

{
  const finding = validOpenFinding();
  finding.severity = "medium";
  await expectFail("severity downgrade rejected", "severity must match control NET-C04 severity high", [finding]);
}

{
  const finding = validOpenFinding();
  finding.owner = "unknown-team";
  await expectFail("unapproved owner rejected", "owner unknown-team is not approved", [finding]);
}

{
  const finding = validOpenFinding();
  finding.source = "security-command-center";
  delete finding.rule_id;
  await expectFail("planned Security Command Center source cannot masquerade as operational", "source security-command-center is not active for operational findings", [finding]);
}

{
  const finding = validOpenFinding();
  finding.source = "terraform-drift";
  delete finding.rule_id;
  await expectFail("live Terraform drift source remains inactive before remote-state validation", "source terraform-drift is not active for operational findings", [finding]);
}

{
  const finding = validOpenFinding();
  finding.history[0].actor = "unknown-actor";
  await expectFail("unapproved lifecycle actor rejected", "actor unknown-actor is not allowed", [finding]);
}

await expectFail(
  "overdue open finding rejected",
  "open finding is overdue since 2026-08-14T10:00:00Z",
  [validOpenFinding()],
  [],
  "2026-08-15T10:00:01Z",
);

{
  const finding = validRiskAcceptedFinding();
  delete finding.exception_id;
  await expectFail("risk acceptance without exception rejected", "finding history contains risk acceptance but exception_id is missing", [finding]);
}

{
  const finding = validOpenFinding();
  finding.exception_id = "SEC-EX-2026-001";
  await expectFail("exception linkage without risk-acceptance history rejected", "exception_id requires at least one risk-accepted history event", [finding], [validException()]);
}

{
  const finding = validRiskAcceptedFinding();
  const exception = validException();
  exception.finding_ids = ["CSPM-FND-2026-999"];
  await expectFail("risk acceptance must explicitly link the finding", "must explicitly include the finding id", [finding], [exception]);
}

{
  const finding = validRiskAcceptedFinding();
  const exception = validException();
  exception.expires_on = "2026-09-20";
  await expectFail("control-specific exception lifetime enforced", "exceeds control maximum of 30 days", [finding], [exception]);
}

{
  const finding = validRiskAcceptedFinding();
  const exception = validException();
  exception.gate = "terraform-drift";
  await expectFail("exception gate must match finding source", "repository-posture findings require cloud-posture exceptions, got terraform-drift", [finding], [exception]);
}

{
  const finding = validRiskAcceptedFinding();
  const exception = validException();
  exception.approved_by = "external-approver";
  await expectFail("exception approver must be governed", "exception approver external-approver is not an approved governance owner", [finding], [exception]);
}

{
  const finding = validRiskAcceptedFinding();
  const exception = validException();
  exception.created_on = "2026-08-08";
  await expectFail("future-created exception cannot authorize current risk", "exception SEC-EX-2026-001 cannot be created in the future", [finding], [exception]);
}

{
  const finding = validRiskAcceptedFinding();
  finding.history[1].at = "2026-08-15T10:00:00Z";
  await expectFail(
    "risk acceptance cannot retroactively erase an SLA breach",
    "risk acceptance cannot be approved after remediation SLA 2026-08-14T10:00:00Z",
    [finding],
    [validException()],
    "2026-08-15T10:30:00Z",
  );
}

{
  const finding = validOpenFinding();
  finding.control_id = "IAM-C02";
  finding.rule_id = "POSTURE-IAM-002";
  finding.severity = "high";
  finding.title = "Dedicated runtime identity finding requires remediation";
  finding.exception_id = "SEC-EX-2026-001";
  finding.status = "risk-accepted";
  finding.history.push({
    status: "risk-accepted",
    at: "2026-08-07T11:00:00Z",
    actor: "security-operations",
    note: "Attempted risk acceptance for a control that forbids exceptions."
  });
  const exception = validException();
  exception.scope = `${finding.id} / IAM-C02`;
  await expectFail("non-exceptionable control cannot be risk accepted", "control IAM-C02 does not allow risk acceptance", [finding], [exception]);
}

{
  const finding = validOpenFinding();
  finding.status = "closed";
  finding.history.push({
    status: "closed",
    at: "2026-08-07T11:00:00Z",
    actor: "security-operations",
    note: "Invalid direct transition used for negative lifecycle validation."
  });
  finding.resolution = validClosedFinding().resolution;
  await expectFail("invalid open-to-closed transition rejected", "transition open -> closed is not allowed", [finding]);
}

{
  const finding = validOpenFinding();
  finding.status = "in-remediation";
  await expectFail("history must match current status", "final history status must match current status in-remediation", [finding]);
}

{
  const finding = validOpenFinding();
  finding.rule_id = "POSTURE-IAM-001";
  await expectFail("repository rule/control mismatch rejected", "rule POSTURE-IAM-001 maps to IAM-C01, not NET-C04", [finding]);
}

{
  const finding = validClosedFinding();
  finding.resolution.closure_evidence = [];
  await expectFail("closed finding requires closure evidence", "closed finding requires at least 1 closure evidence item", [finding]);
}

{
  const finding = validClosedFinding();
  finding.resolution.verified_by = finding.owner;
  await expectFail("finding owner cannot self-verify closure", "closure verifier must be independent from the finding owner", [finding]);
}

{
  const finding = validClosedFinding();
  finding.resolution.resolved_at = "2026-08-07T11:10:00Z";
  await expectFail("resolution timestamp must match lifecycle history", "resolution.resolved_at must match the latest resolved history event", [finding]);
}

{
  const finding = validClosedFinding();
  finding.resolution.closed_at = "2026-08-07T11:46:00Z";
  await expectFail("closure timestamp must match terminal history", "resolution.closed_at must match the terminal closed history event", [finding]);
}

{
  const finding = validClosedFinding();
  finding.history.at(-1).actor = "application-security";
  await expectFail("closure actor must match independent verifier", "terminal closed history actor must match resolution.verified_by", [finding]);
}

{
  const finding = validOpenFinding();
  finding.remediation_due_at = "2026-08-15T10:00:01Z";
  await expectFail("severity SLA cannot be extended silently", "remediation_due_at exceeds high SLA of 168 hours", [finding]);
}

{
  const finding = validOpenFinding();
  finding.detected_at = "2026-02-31T10:00:00Z";
  finding.history[0].at = finding.detected_at;
  await expectFail("impossible finding timestamp rejected", "detected_at is invalid", [finding]);
}

{
  const finding = validOpenFinding();
  finding.id = "CSPM-FND-2025-001";
  await expectFail("finding id year must match detection year", "finding id year must match detected_at year", [finding]);
}

{
  const finding = validOpenFinding();
  finding.detected_at = "2026-08-08T10:00:00Z";
  finding.history[0].at = finding.detected_at;
  finding.remediation_due_at = "2026-08-15T10:00:00Z";
  await expectFail("future-dated finding rejected", "detected_at cannot be in the future", [finding]);
}

console.log("Posture finding lifecycle controls validated: 31 scenarios passed.");
