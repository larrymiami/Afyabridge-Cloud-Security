import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";

const root = resolve(process.env.POSTURE_REPO_ROOT ?? process.cwd());

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const findingsPath = arg("--findings", "security/posture-findings.json");
const governancePath = arg("--governance", "security/cloud-posture-governance.json");
const cataloguePath = arg("--catalogue", "security/cloud-posture-controls.json");
const rulesPath = arg("--rules", "security/cloud-posture-rules.json");
const exceptionsPath = arg("--exceptions", "security/exceptions.json");
const asOfValue = arg("--as-of", null);

function fail(message) {
  throw new Error(`Posture finding lifecycle validation failed: ${message}`);
}

async function load(path, label) {
  try {
    return JSON.parse(await readFile(resolve(root, path), "utf8"));
  } catch (error) {
    fail(`${label} could not be loaded as JSON: ${error.message}`);
  }
}

function requireString(value, label, minimum = 1) {
  if (typeof value !== "string" || value.trim().length < minimum) {
    fail(`${label} must be a string with at least ${minimum} character(s)`);
  }
  return value.trim();
}

function parseTimestamp(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(value ?? "")) {
    fail(`${label} must use UTC RFC3339 format YYYY-MM-DDTHH:MM:SSZ`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.toISOString().replace(".000Z", "Z") !== value) {
    fail(`${label} is invalid`);
  }
  return date;
}

function parseDate(value, label) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) fail(`${label} must use YYYY-MM-DD`);
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    fail(`${label} is invalid`);
  }
  return date;
}

function utcDateOnly(date) {
  const value = new Date(date);
  value.setUTCHours(0, 0, 0, 0);
  return value;
}

function validTrackingUrl(value) {
  return typeof value === "string" && /^https:\/\/github\.com\/[^/]+\/[^/]+\/(issues|pull)\/\d+$/.test(value);
}

function validEvidenceRef(value) {
  if (typeof value !== "string") return false;
  return (
    /^repo:[A-Za-z0-9._/-]+$/.test(value) ||
    /^https:\/\/github\.com\/[^/]+\/[^/]+\/(actions\/runs|issues|pull|commit)\/[^\s]+$/.test(value)
  );
}

function validateEvidenceList(values, label, minimum = 1) {
  if (!Array.isArray(values) || values.length < minimum) {
    fail(`${label} requires at least ${minimum} evidence item(s)`);
  }
  for (const evidence of values) {
    if (!validEvidenceRef(evidence)) fail(`${label} contains invalid evidence reference ${evidence}`);
  }
}

const [registry, governance, catalogue, rules, exceptions] = await Promise.all([
  load(findingsPath, "finding registry"),
  load(governancePath, "posture governance"),
  load(cataloguePath, "posture catalogue"),
  load(rulesPath, "posture rules"),
  load(exceptionsPath, "security exceptions"),
]);

if (registry.schema_version !== 1) fail("finding registry schema_version must be 1");
if (!Array.isArray(registry.findings)) fail("finding registry findings must be an array");
if (governance.schema_version !== 1) fail("posture governance schema_version must be 1");
if (catalogue.schema_version !== 1) fail("posture catalogue schema_version must be 1");
if (rules.schema_version !== 1) fail("posture rules schema_version must be 1");
if (exceptions.schema_version !== 1 || !Array.isArray(exceptions.exceptions)) {
  fail("security exception registry must use schema_version 1 and contain exceptions array");
}

const lifecycle = governance.finding_lifecycle;
if (!lifecycle || typeof lifecycle !== "object") fail("finding_lifecycle governance is required");
if (lifecycle.registry !== "security/posture-findings.json") {
  fail("finding_lifecycle.registry must remain security/posture-findings.json");
}
if (lifecycle.initial_status !== "open") fail("finding lifecycle initial_status must remain open");

const allowedStatuses = new Set(lifecycle.allowed_statuses ?? []);
const allowedSources = new Set(lifecycle.allowed_sources ?? []);
const activeSources = new Set(lifecycle.active_sources ?? []);
const allowedActors = new Set(lifecycle.allowed_actors ?? []);
const approvedOwners = new Set(governance.owners ?? []);
const requiredFieldSet = new Set(lifecycle.required_fields ?? []);
const expectedRequiredFields = [
  "id",
  "source",
  "control_id",
  "severity",
  "title",
  "owner",
  "status",
  "detected_at",
  "remediation_due_at",
  "tracking_url",
  "history",
];
for (const field of expectedRequiredFields) {
  if (!requiredFieldSet.has(field)) fail(`finding_lifecycle.required_fields must include ${field}`);
}
for (const status of ["open", "in-remediation", "risk-accepted", "resolved", "closed"]) {
  if (!allowedStatuses.has(status)) fail(`finding_lifecycle.allowed_statuses must include ${status}`);
}
for (const source of ["repository-posture", "terraform-drift", "security-command-center", "manual-review"]) {
  if (!allowedSources.has(source)) fail(`finding_lifecycle.allowed_sources must include ${source}`);
}
for (const source of ["repository-posture", "manual-review"]) {
  if (!activeSources.has(source)) fail(`finding_lifecycle.active_sources must include ${source}`);
}
for (const source of activeSources) {
  if (!allowedSources.has(source)) fail(`finding_lifecycle.active_sources contains unsupported source ${source}`);
}
for (const actor of ["security-automation", ...approvedOwners]) {
  if (!allowedActors.has(actor)) fail(`finding_lifecycle.allowed_actors must include ${actor}`);
}

const riskPolicy = lifecycle.risk_acceptance ?? {};
if (riskPolicy.exception_binding !== "history-event") {
  fail("finding_lifecycle.risk_acceptance.exception_binding must remain history-event");
}
const resolutionPolicy = lifecycle.resolution ?? {};
const allowedVerificationStatuses = new Set(resolutionPolicy.allowed_verification_statuses ?? []);
for (const status of ["pending", "failed", "passed"]) {
  if (!allowedVerificationStatuses.has(status)) {
    fail(`finding_lifecycle.resolution.allowed_verification_statuses must include ${status}`);
  }
}
if (resolutionPolicy.require_attempt_per_resolved_transition !== true) {
  fail("finding_lifecycle.resolution.require_attempt_per_resolved_transition must remain true");
}
if (resolutionPolicy.failed_verification_requires_evidence !== true) {
  fail("finding_lifecycle.resolution.failed_verification_requires_evidence must remain true");
}

const controls = new Map((catalogue.controls ?? []).map((control) => [control.id, control]));
const ruleMap = new Map((rules.rules ?? []).map((rule) => [rule.id, rule]));
const exceptionMap = new Map();
for (const exception of exceptions.exceptions) {
  if (!/^SEC-EX-\d{4}-\d{3}$/.test(exception?.id ?? "")) fail("linked exception id must match SEC-EX-YYYY-NNN");
  if (exceptionMap.has(exception.id)) fail(`duplicate linked exception id ${exception.id}`);
  exceptionMap.set(exception.id, exception);
}
const severityPolicy = governance.severity_policy ?? {};
const transitions = lifecycle.allowed_transitions ?? {};
const allowedExceptionGates = new Set(riskPolicy.allowed_exception_gates ?? []);
const exceptionGateBySource = riskPolicy.exception_gate_by_source ?? {};
const requireActiveException = riskPolicy.requires_active_exception === true;
const requireIndependentVerifier = lifecycle.closure?.require_independent_verifier === true;
const minimumClosureEvidence = lifecycle.closure?.minimum_evidence_items ?? 1;

for (const source of allowedSources) {
  const expectedGate = exceptionGateBySource[source];
  if (!allowedExceptionGates.has(expectedGate)) {
    fail(`finding_lifecycle.risk_acceptance.exception_gate_by_source must map ${source} to an allowed gate`);
  }
}

const asOf = asOfValue ? parseTimestamp(asOfValue, "--as-of") : new Date();
const asOfDate = utcDateOnly(asOf);
const ids = new Set();
let openCount = 0;
let remediationCount = 0;
let acceptedCount = 0;
let resolvedCount = 0;
let closedCount = 0;

function validateVerifier(finding, attempt, label) {
  if (!approvedOwners.has(attempt.verified_by)) {
    fail(`${label}.verified_by must be an approved owner`);
  }
  if (requireIndependentVerifier && attempt.verified_by === finding.owner) {
    fail(`${label}: verifier must be independent from the finding owner`);
  }
  const verifiedAt = parseTimestamp(attempt.verified_at, `${label}.verified_at`);
  if (verifiedAt > asOf) fail(`${label}.verified_at cannot be in the future`);
  return verifiedAt;
}

function validateRiskAcceptanceException(finding, event, requireActiveNow) {
  const exceptionId = event.exception_id;
  if (!/^SEC-EX-\d{4}-\d{3}$/.test(exceptionId ?? "")) {
    fail(`${finding.id}: risk-accepted history event requires exception_id`);
  }
  const exception = exceptionMap.get(exceptionId);
  if (!exception) fail(`${finding.id}: exception ${exceptionId} does not exist`);
  if (!new Set(["active", "historical"]).has(exception.status)) {
    fail(`${finding.id}: exception ${exceptionId} status must be active or historical`);
  }

  const expectedGate = exceptionGateBySource[finding.source];
  if (!allowedExceptionGates.has(exception.gate)) {
    fail(`${finding.id}: exception ${exceptionId} gate ${exception.gate ?? "missing"} is not allowed for posture findings`);
  }
  if (exception.gate !== expectedGate) {
    fail(`${finding.id}: ${finding.source} findings require ${expectedGate} exceptions, got ${exception.gate}`);
  }
  if (!Array.isArray(exception.finding_ids) || !exception.finding_ids.includes(finding.id)) {
    fail(`${finding.id}: exception ${exceptionId} must explicitly include the finding id`);
  }
  if (exception.owner !== finding.owner) fail(`${finding.id}: exception owner must match finding owner`);
  if (!approvedOwners.has(exception.approved_by)) {
    fail(`${finding.id}: exception approver ${exception.approved_by ?? "missing"} is not an approved governance owner`);
  }
  if (exception.approved_by === exception.owner) fail(`${finding.id}: exception owner and approver must be different`);
  if (typeof exception.scope !== "string" || exception.scope.trim().length < 3) {
    fail(`${finding.id}: exception ${exceptionId} scope is required`);
  }
  if (typeof exception.rationale !== "string" || exception.rationale.trim().length < 20) {
    fail(`${finding.id}: exception ${exceptionId} rationale must be substantive`);
  }
  if (!Array.isArray(exception.compensating_controls) || exception.compensating_controls.length === 0) {
    fail(`${finding.id}: exception ${exceptionId} compensating controls are required`);
  }
  if (exception.compensating_controls.some((value) => typeof value !== "string" || value.trim().length < 5)) {
    fail(`${finding.id}: exception ${exceptionId} compensating controls must be descriptive strings`);
  }
  if (!validTrackingUrl(exception.tracking_url)) {
    fail(`${finding.id}: exception ${exceptionId} tracking_url must reference a GitHub issue or pull request`);
  }

  const control = controls.get(finding.control_id);
  if (control?.exception?.allowed !== true) {
    fail(`${finding.id}: control ${finding.control_id} does not allow risk acceptance`);
  }
  const created = parseDate(exception.created_on, `${finding.id}: exception ${exceptionId} created_on`);
  const expires = parseDate(exception.expires_on, `${finding.id}: exception ${exceptionId} expires_on`);
  const lifetimeDays = Math.round((expires - created) / 86400000);
  const controlMaximum = control.exception.maximum_days ?? governance.exception_policy?.maximum_days ?? 90;
  if (lifetimeDays < 1 || lifetimeDays > controlMaximum) {
    fail(`${finding.id}: exception ${exceptionId} exceeds control maximum of ${controlMaximum} days`);
  }
  if (created > asOfDate) fail(`${finding.id}: exception ${exceptionId} cannot be created in the future`);

  let authorizationEnd = expires;
  if (exception.status === "historical") {
    const retired = parseDate(exception.retired_on, `${finding.id}: exception ${exceptionId} retired_on`);
    if (retired < created) fail(`${finding.id}: exception ${exceptionId} retired_on cannot precede created_on`);
    if (retired > expires) fail(`${finding.id}: exception ${exceptionId} retired_on cannot follow expires_on`);
    if (retired > asOfDate) fail(`${finding.id}: exception ${exceptionId} retired_on cannot be in the future`);
    authorizationEnd = retired;
  } else if (exception.retired_on !== undefined) {
    fail(`${finding.id}: active exception ${exceptionId} must not include retired_on`);
  }

  const acceptedDate = utcDateOnly(event.atDate);
  if (acceptedDate < created || acceptedDate > authorizationEnd) {
    fail(`${finding.id}: exception ${exceptionId} was not active when risk was accepted at ${event.at}`);
  }

  if (requireActiveNow) {
    if (exception.status !== "active") {
      fail(`${finding.id}: current risk acceptance requires active exception ${exceptionId}`);
    }
    if (expires < asOfDate) fail(`${finding.id}: exception ${exceptionId} expired on ${exception.expires_on}`);
  }
}

for (const finding of registry.findings) {
  const id = finding?.id;
  if (!/^CSPM-FND-\d{4}-\d{3}$/.test(id ?? "")) fail("finding id must match CSPM-FND-YYYY-NNN");
  if (ids.has(id)) fail(`${id}: duplicate id`);
  ids.add(id);

  for (const field of expectedRequiredFields) {
    if (!Object.hasOwn(finding, field)) fail(`${id}: required field ${field} is missing`);
  }

  if (!allowedSources.has(finding.source)) fail(`${id}: unsupported source ${finding.source ?? "missing"}`);
  if (!activeSources.has(finding.source)) fail(`${id}: source ${finding.source} is not active for operational findings`);
  const control = controls.get(finding.control_id);
  if (!control) fail(`${id}: control ${finding.control_id ?? "missing"} is not in the active posture catalogue`);
  if (finding.severity !== control.severity) {
    fail(`${id}: severity must match control ${finding.control_id} severity ${control.severity}`);
  }
  requireString(finding.title, `${id}.title`, 12);
  if (!approvedOwners.has(finding.owner)) fail(`${id}: owner ${finding.owner ?? "missing"} is not approved`);
  if (!allowedStatuses.has(finding.status)) fail(`${id}: unsupported status ${finding.status ?? "missing"}`);
  if (!validTrackingUrl(finding.tracking_url)) fail(`${id}: tracking_url must reference a GitHub issue or pull request`);
  if (finding.resolution !== undefined) fail(`${id}: legacy resolution field is not allowed; use resolution_attempts`);
  if (finding.exception_id !== undefined) fail(`${id}: legacy top-level exception_id is not allowed; bind exceptions to risk-accepted history events`);

  const detected = parseTimestamp(finding.detected_at, `${id}.detected_at`);
  if (detected > asOf) fail(`${id}: detected_at cannot be in the future`);
  if (Number(id.slice(9, 13)) !== detected.getUTCFullYear()) {
    fail(`${id}: finding id year must match detected_at year`);
  }
  const due = parseTimestamp(finding.remediation_due_at, `${id}.remediation_due_at`);
  if (due < detected) fail(`${id}: remediation_due_at cannot precede detected_at`);
  const severity = severityPolicy[finding.severity];
  if (!severity || !Number.isInteger(severity.max_remediation_hours)) {
    fail(`${id}: severity policy for ${finding.severity} is missing max_remediation_hours`);
  }
  const latestDue = new Date(detected.getTime() + severity.max_remediation_hours * 3600000);
  if (due > latestDue) {
    fail(`${id}: remediation_due_at exceeds ${finding.severity} SLA of ${severity.max_remediation_hours} hours`);
  }

  if (finding.source === "repository-posture") {
    if (!/^POSTURE-[A-Z]+-\d{3}$/.test(finding.rule_id ?? "")) {
      fail(`${id}: repository-posture findings require rule_id`);
    }
    const rule = ruleMap.get(finding.rule_id);
    if (!rule) fail(`${id}: rule ${finding.rule_id} is not in the executable posture rule set`);
    if (rule.control_id !== finding.control_id) {
      fail(`${id}: rule ${finding.rule_id} maps to ${rule.control_id}, not ${finding.control_id}`);
    }
  }

  if (!Array.isArray(finding.history) || finding.history.length === 0) fail(`${id}: history must be a non-empty array`);
  let previousStatus = null;
  let previousAt = null;
  const riskAcceptedEvents = [];
  const resolvedEvents = [];
  const closedEvents = [];
  for (const [index, event] of finding.history.entries()) {
    if (!event || typeof event !== "object") fail(`${id}.history[${index}] must be an object`);
    if (!allowedStatuses.has(event.status)) fail(`${id}.history[${index}]: unsupported status ${event.status ?? "missing"}`);
    const eventAt = parseTimestamp(event.at, `${id}.history[${index}].at`);
    if (eventAt > asOf) fail(`${id}.history[${index}].at cannot be in the future`);
    if (!allowedActors.has(event.actor)) fail(`${id}.history[${index}]: actor ${event.actor ?? "missing"} is not allowed`);
    requireString(event.note, `${id}.history[${index}].note`, 8);
    if (index === 0) {
      if (event.status !== lifecycle.initial_status) fail(`${id}: first history status must be ${lifecycle.initial_status}`);
      if (event.at !== finding.detected_at) fail(`${id}: first history timestamp must equal detected_at`);
    } else {
      if (eventAt < previousAt) fail(`${id}: history timestamps must be chronological`);
      const allowedNext = transitions[previousStatus] ?? [];
      if (!allowedNext.includes(event.status)) fail(`${id}: transition ${previousStatus} -> ${event.status} is not allowed`);
    }
    if (event.status === "risk-accepted") {
      if (!/^SEC-EX-\d{4}-\d{3}$/.test(event.exception_id ?? "")) {
        fail(`${id}: risk-accepted history event requires exception_id`);
      }
      if (eventAt > due) fail(`${id}: risk acceptance cannot be approved after remediation SLA ${finding.remediation_due_at}`);
      riskAcceptedEvents.push({ ...event, atDate: eventAt, index });
    } else if (event.exception_id !== undefined) {
      fail(`${id}.history[${index}]: exception_id is allowed only on risk-accepted events`);
    }
    if (event.status === "resolved") resolvedEvents.push({ ...event, atDate: eventAt, index });
    if (event.status === "closed") closedEvents.push({ ...event, atDate: eventAt, index });
    previousStatus = event.status;
    previousAt = eventAt;
  }
  if (previousStatus !== finding.status) fail(`${id}: final history status must match current status ${finding.status}`);

  for (const event of riskAcceptedEvents) {
    const currentAcceptance = finding.status === "risk-accepted" && event.index === finding.history.length - 1;
    validateRiskAcceptanceException(finding, event, currentAcceptance && requireActiveException);
  }

  if (["open", "in-remediation"].includes(finding.status) && asOf > due) {
    fail(`${id}: ${finding.status} finding is overdue since ${finding.remediation_due_at}`);
  }

  const attempts = finding.resolution_attempts;
  if (resolvedEvents.length === 0) {
    if (attempts !== undefined && (!Array.isArray(attempts) || attempts.length !== 0)) {
      fail(`${id}: resolution_attempts must be absent or empty before the first resolved transition`);
    }
  } else {
    if (!Array.isArray(attempts) || attempts.length !== resolvedEvents.length) {
      fail(`${id}: resolution_attempts must contain exactly one entry per resolved history transition`);
    }

    for (const [index, attempt] of attempts.entries()) {
      const label = `${id}.resolution_attempts[${index}]`;
      if (!attempt || typeof attempt !== "object") fail(`${label} must be an object`);
      const resolvedEvent = resolvedEvents[index];
      if (attempt.resolved_at !== resolvedEvent.at) {
        fail(`${label}.resolved_at must match resolved history event ${resolvedEvent.at}`);
      }
      const resolvedAt = parseTimestamp(attempt.resolved_at, `${label}.resolved_at`);
      if (resolvedAt > asOf) fail(`${label}.resolved_at cannot be in the future`);
      requireString(attempt.summary, `${label}.summary`, 20);
      validateEvidenceList(attempt.remediation_evidence, `${label}.remediation_evidence`);
      if (!allowedVerificationStatuses.has(attempt.verification_status)) {
        fail(`${label}: unsupported verification_status ${attempt.verification_status ?? "missing"}`);
      }

      const nextHistoryEvent = finding.history[resolvedEvent.index + 1] ?? null;
      if (attempt.verification_status === "pending") {
        if (index !== attempts.length - 1 || finding.status !== "resolved") {
          fail(`${label}: pending verification is valid only for the current resolved attempt`);
        }
        for (const field of ["verified_by", "verified_at", "verification_evidence", "closed_at", "closure_evidence"]) {
          if (attempt[field] !== undefined) fail(`${label}: pending verification must not include ${field}`);
        }
      }

      if (attempt.verification_status === "failed") {
        const verifiedAt = validateVerifier(finding, attempt, label);
        if (verifiedAt < resolvedAt) fail(`${label}.verified_at cannot precede resolved_at`);
        validateEvidenceList(attempt.verification_evidence, `${label}.verification_evidence`);
        if (!nextHistoryEvent || nextHistoryEvent.status !== "in-remediation") {
          fail(`${label}: failed verification must transition the finding back to in-remediation`);
        }
        const reopenedAt = parseTimestamp(nextHistoryEvent.at, `${id}.history[${resolvedEvent.index + 1}].at`);
        if (reopenedAt < verifiedAt) fail(`${label}: in-remediation transition cannot precede failed verification`);
        for (const field of ["closed_at", "closure_evidence"]) {
          if (attempt[field] !== undefined) fail(`${label}: failed verification must not include ${field}`);
        }
      }

      if (attempt.verification_status === "passed") {
        if (index !== attempts.length - 1 || finding.status !== "closed") {
          fail(`${label}: passed verification is valid only for the terminal closed attempt`);
        }
        const verifiedAt = validateVerifier(finding, attempt, label);
        if (verifiedAt < resolvedAt) fail(`${label}.verified_at cannot precede resolved_at`);
        if (!nextHistoryEvent || nextHistoryEvent.status !== "closed") {
          fail(`${label}: passed verification must transition directly to closed`);
        }
        const closedAt = parseTimestamp(attempt.closed_at, `${label}.closed_at`);
        if (closedAt > asOf) fail(`${label}.closed_at cannot be in the future`);
        if (closedAt < verifiedAt) fail(`${label}.closed_at cannot precede verified_at`);
        if (attempt.closed_at !== nextHistoryEvent.at) {
          fail(`${label}.closed_at must match the terminal closed history event`);
        }
        if (attempt.verified_by !== nextHistoryEvent.actor) {
          fail(`${label}: terminal closed history actor must match verified_by`);
        }
        validateEvidenceList(attempt.closure_evidence, `${label}.closure_evidence`, minimumClosureEvidence);
      }

      if (index < attempts.length - 1 && attempt.verification_status !== "failed") {
        fail(`${label}: every non-terminal resolution attempt must record failed verification`);
      }
    }

    const lastAttempt = attempts.at(-1);
    if (finding.status === "resolved" && lastAttempt.verification_status !== "pending") {
      fail(`${id}: current resolved finding must have a pending final verification attempt`);
    }
    if (finding.status === "closed" && lastAttempt.verification_status !== "passed") {
      fail(`${id}: closed finding must have a passed final verification attempt`);
    }
    if (["in-remediation", "risk-accepted"].includes(finding.status) && lastAttempt.verification_status !== "failed") {
      fail(`${id}: reopened finding must retain a failed final verification attempt`);
    }
  }

  if (closedEvents.length > 1) fail(`${id}: closed status is terminal and may appear only once`);
  if (finding.status === "closed" && (closedEvents.length !== 1 || finding.history.at(-1)?.status !== "closed")) {
    fail(`${id}: closed finding requires exactly one terminal closed history event`);
  }

  if (finding.status === "open") openCount += 1;
  if (finding.status === "in-remediation") remediationCount += 1;
  if (finding.status === "risk-accepted") acceptedCount += 1;
  if (finding.status === "resolved") resolvedCount += 1;
  if (finding.status === "closed") closedCount += 1;
}

console.log(
  `Posture finding lifecycle validated: ${registry.findings.length} finding(s); open=${openCount}, in-remediation=${remediationCount}, risk-accepted=${acceptedCount}, resolved=${resolvedCount}, closed=${closedCount}.`,
);
