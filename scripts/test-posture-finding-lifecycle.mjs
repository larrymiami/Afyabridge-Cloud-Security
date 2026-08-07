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
let scenarioCount = 0;

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

function validException({
  id = "SEC-EX-2026-001",
  findingId = "CSPM-FND-2026-001",
  createdOn = "2026-08-07",
  expiresOn = "2026-08-21"
} = {}) {
  return {
    id,
    status: "active",
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
    created_on: createdOn,
    expires_on: expiresOn
  };
}

function historicalException(options = {}) {
  const exception = validException(options);
  exception.status = "historical";
  exception.retired_on = options.retiredOn ?? exception.created_on;
  return exception;
}

function pendingAttempt(resolvedAt) {
  return {
    resolved_at: resolvedAt,
    summary: "The reviewed configuration was remediated and is awaiting independent verification before closure.",
    remediation_evidence: ["repo:docs/evidence/example-remediation.md"],
    verification_status: "pending"
  };
}

function failedAttempt(resolvedAt, verifiedAt = "2026-08-07T11:05:00Z") {
  return {
    resolved_at: resolvedAt,
    summary: "The first remediation attempt was completed but independent verification identified remaining control gaps.",
    remediation_evidence: ["repo:docs/evidence/example-remediation.md"],
    verification_status: "failed",
    verified_by: "security-operations",
    verified_at: verifiedAt,
    verification_evidence: ["https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/1"]
  };
}

function passedAttempt(resolvedAt, closedAt, verifiedAt) {
  return {
    resolved_at: resolvedAt,
    summary: "The reviewed configuration was remediated and independent verification confirmed the control now passes.",
    remediation_evidence: ["repo:docs/evidence/example-remediation.md"],
    verification_status: "passed",
    verified_by: "security-operations",
    verified_at: verifiedAt,
    closed_at: closedAt,
    closure_evidence: ["https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/1"]
  };
}

function validRiskAcceptedFinding(exceptionId = "SEC-EX-2026-001") {
  const finding = validOpenFinding();
  finding.status = "risk-accepted";
  finding.history.push({
    status: "risk-accepted",
    at: "2026-08-07T11:00:00Z",
    actor: "security-operations",
    exception_id: exceptionId,
    note: "Time-bounded risk acceptance approved with compensating controls."
  });
  return finding;
}

function validResolvedFinding() {
  const finding = validOpenFinding();
  finding.status = "resolved";
  finding.history.push(
    {
      status: "in-remediation",
      at: "2026-08-07T10:30:00Z",
      actor: "cloud-security",
      note: "Remediation work started under the assigned finding owner."
    },
    {
      status: "resolved",
      at: "2026-08-07T11:00:00Z",
      actor: "cloud-security",
      note: "Remediation completed and submitted for independent verification."
    }
  );
  finding.resolution_attempts = [pendingAttempt("2026-08-07T11:00:00Z")];
  return finding;
}

function validReopenedFinding() {
  const finding = validOpenFinding();
  finding.status = "in-remediation";
  finding.history.push(
    {
      status: "in-remediation",
      at: "2026-08-07T10:20:00Z",
      actor: "cloud-security",
      note: "Initial remediation work started."
    },
    {
      status: "resolved",
      at: "2026-08-07T10:50:00Z",
      actor: "cloud-security",
      note: "Initial remediation was submitted for verification."
    },
    {
      status: "in-remediation",
      at: "2026-08-07T11:10:00Z",
      actor: "security-operations",
      note: "Independent verification failed and the finding was returned to remediation."
    }
  );
  finding.resolution_attempts = [failedAttempt("2026-08-07T10:50:00Z")];
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
  finding.resolution_attempts = [
    passedAttempt("2026-08-07T11:15:00Z", "2026-08-07T11:45:00Z", "2026-08-07T11:40:00Z")
  ];
  return finding;
}

function validClosedAfterFailedAttempt() {
  const finding = validReopenedFinding();
  finding.status = "closed";
  finding.history.push(
    {
      status: "resolved",
      at: "2026-08-07T11:30:00Z",
      actor: "cloud-security",
      note: "Second remediation attempt completed after addressing failed verification evidence."
    },
    {
      status: "closed",
      at: "2026-08-07T11:50:00Z",
      actor: "security-operations",
      note: "Second attempt passed independent verification and the finding was closed."
    }
  );
  finding.resolution_attempts.push(
    passedAttempt("2026-08-07T11:30:00Z", "2026-08-07T11:50:00Z", "2026-08-07T11:45:00Z")
  );
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
  finding.resolution_attempts = [
    passedAttempt("2026-08-07T11:30:00Z", "2026-08-07T11:50:00Z", "2026-08-07T11:45:00Z")
  ];
  return finding;
}

function validRepeatedRiskAcceptanceFinding() {
  const finding = validOpenFinding();
  finding.status = "risk-accepted";
  finding.history.push(
    {
      status: "risk-accepted",
      at: "2026-08-07T11:00:00Z",
      actor: "security-operations",
      exception_id: "SEC-EX-2026-001",
      note: "First time-bounded risk acceptance approved."
    },
    {
      status: "in-remediation",
      at: "2026-08-07T12:00:00Z",
      actor: "cloud-security",
      note: "First risk acceptance retired and remediation resumed."
    },
    {
      status: "risk-accepted",
      at: "2026-08-08T10:00:00Z",
      actor: "security-operations",
      exception_id: "SEC-EX-2026-002",
      note: "Second independently tracked risk acceptance approved."
    }
  );
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
  scenarioCount += 1;
  try {
    await run(findings, exceptions, asOf);
    console.log(`PASS allow: ${label}`);
  } catch (error) {
    fail(`${label} unexpectedly failed: ${error.stderr ?? error.message}`);
  }
}

async function expectFail(label, expectedError, findings, exceptions = [], asOf = defaultAsOf) {
  scenarioCount += 1;
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
await expectPass("valid resolved finding awaiting verification", [validResolvedFinding()]);
await expectPass("failed verification reopens finding without losing the attempt", [validReopenedFinding()]);
await expectPass("valid independently verified closed finding", [validClosedFinding()]);
await expectPass("second remediation attempt closes after first verification failure", [validClosedAfterFailedAttempt()]);
await expectPass(
  "closed finding retains retired historical exception evidence",
  [validClosedAfterRiskAcceptance()],
  [historicalException()],
  "2026-09-01T12:00:00Z",
);
await expectPass(
  "separate risk-acceptance periods retain separate exception records",
  [validRepeatedRiskAcceptanceFinding()],
  [
    historicalException({ id: "SEC-EX-2026-001", retiredOn: "2026-08-07" }),
    validException({ id: "SEC-EX-2026-002", createdOn: "2026-08-08", expiresOn: "2026-08-20" })
  ],
  "2026-08-08T12:00:00Z",
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
  delete finding.history[1].exception_id;
  await expectFail("risk acceptance without event exception rejected", "risk-accepted history event requires exception_id", [finding], [validException()]);
}
{
  const finding = validRiskAcceptedFinding();
  finding.exception_id = "SEC-EX-2026-001";
  await expectFail("legacy top-level exception linkage rejected", "legacy top-level exception_id is not allowed", [finding], [validException()]);
}
{
  const finding = validOpenFinding();
  finding.history[0].exception_id = "SEC-EX-2026-001";
  await expectFail("exception linkage allowed only on risk events", "exception_id is allowed only on risk-accepted events", [finding], [validException()]);
}
{
  const finding = validRiskAcceptedFinding("SEC-EX-2026-999");
  await expectFail("risk event must reference existing exception", "exception SEC-EX-2026-999 does not exist", [finding], [validException()]);
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
  const finding = validRiskAcceptedFinding();
  const exception = historicalException();
  await expectFail("current risk acceptance cannot use historical exception", "current risk acceptance requires active exception SEC-EX-2026-001", [finding], [exception]);
}
{
  const finding = validRiskAcceptedFinding();
  const exception = historicalException({ createdOn: "2026-08-01", retiredOn: "2026-08-06" });
  await expectFail("historical exception must cover acceptance timestamp", "was not active when risk was accepted at 2026-08-07T11:00:00Z", [finding], [exception]);
}
{
  const finding = validRiskAcceptedFinding();
  const exception = validException({ createdOn: "2026-08-07", expiresOn: "2026-08-21" });
  await expectFail(
    "expired current exception cannot keep risk accepted",
    "exception SEC-EX-2026-001 expired on 2026-08-21",
    [finding],
    [exception],
    "2026-08-22T12:00:00Z",
  );
}
{
  const finding = validOpenFinding();
  finding.control_id = "IAM-C02";
  finding.rule_id = "POSTURE-IAM-002";
  finding.severity = "high";
  finding.title = "Dedicated runtime identity finding requires remediation";
  finding.status = "risk-accepted";
  finding.history.push({
    status: "risk-accepted",
    at: "2026-08-07T11:00:00Z",
    actor: "security-operations",
    exception_id: "SEC-EX-2026-001",
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
  const finding = validOpenFinding();
  finding.resolution_attempts = [pendingAttempt("2026-08-07T11:00:00Z")];
  await expectFail("resolution attempt before resolved transition rejected", "resolution_attempts must be absent or empty before the first resolved transition", [finding]);
}
{
  const finding = validResolvedFinding();
  delete finding.resolution_attempts;
  await expectFail("resolved transition requires preserved resolution attempt", "resolution_attempts must contain exactly one entry per resolved history transition", [finding]);
}
{
  const finding = validResolvedFinding();
  finding.resolution_attempts[0].verification_status = "passed";
  finding.resolution_attempts[0].verified_by = "security-operations";
  finding.resolution_attempts[0].verified_at = "2026-08-07T11:10:00Z";
  finding.resolution_attempts[0].closed_at = "2026-08-07T11:20:00Z";
  finding.resolution_attempts[0].closure_evidence = ["https://github.com/larrymiami/Afyabridge-Cloud-Security/actions/runs/1"];
  await expectFail("resolved finding cannot claim passed verification before closure", "passed verification is valid only for the terminal closed attempt", [finding]);
}
{
  const finding = validReopenedFinding();
  finding.resolution_attempts[0].verification_status = "pending";
  delete finding.resolution_attempts[0].verified_by;
  delete finding.resolution_attempts[0].verified_at;
  delete finding.resolution_attempts[0].verification_evidence;
  await expectFail("reopened finding must retain failed verification", "pending verification is valid only for the current resolved attempt", [finding]);
}
{
  const finding = validReopenedFinding();
  finding.resolution_attempts[0].verification_evidence = [];
  await expectFail("failed verification requires evidence", "verification_evidence requires at least 1 evidence item", [finding]);
}
{
  const finding = validReopenedFinding();
  finding.resolution_attempts[0].verified_by = finding.owner;
  await expectFail("finding owner cannot self-verify a failed attempt", "verifier must be independent from the finding owner", [finding]);
}
{
  const finding = validClosedAfterFailedAttempt();
  finding.resolution_attempts[0].verification_status = "pending";
  delete finding.resolution_attempts[0].verified_by;
  delete finding.resolution_attempts[0].verified_at;
  delete finding.resolution_attempts[0].verification_evidence;
  await expectFail("non-terminal resolution attempts must record verification failure", "pending verification is valid only for the current resolved attempt", [finding]);
}
{
  const finding = validClosedFinding();
  finding.resolution_attempts[0].closure_evidence = [];
  await expectFail("closed finding requires closure evidence", "closure_evidence requires at least 1 evidence item", [finding]);
}
{
  const finding = validClosedFinding();
  finding.resolution_attempts[0].verified_by = finding.owner;
  await expectFail("finding owner cannot self-verify closure", "verifier must be independent from the finding owner", [finding]);
}
{
  const finding = validClosedFinding();
  finding.resolution_attempts[0].resolved_at = "2026-08-07T11:10:00Z";
  await expectFail("resolution timestamp must match lifecycle history", "resolved_at must match resolved history event 2026-08-07T11:15:00Z", [finding]);
}
{
  const finding = validClosedFinding();
  finding.resolution_attempts[0].closed_at = "2026-08-07T11:46:00Z";
  await expectFail("closure timestamp must match terminal history", "closed_at must match the terminal closed history event", [finding]);
}
{
  const finding = validClosedFinding();
  finding.history.at(-1).actor = "application-security";
  await expectFail("closure actor must match independent verifier", "terminal closed history actor must match verified_by", [finding]);
}
{
  const finding = validClosedFinding();
  finding.resolution = { summary: "legacy" };
  await expectFail("ambiguous legacy resolution object rejected", "legacy resolution field is not allowed; use resolution_attempts", [finding]);
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

console.log(`Posture finding lifecycle controls validated: ${scenarioCount} scenarios passed.`);
