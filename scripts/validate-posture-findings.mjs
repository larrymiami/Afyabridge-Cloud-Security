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
const requiredFields = lifecycle.required_fields ?? [];
const requiredFieldSet = new Set(requiredFields);
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
const allowedExceptionGates = new Set(lifecycle.risk_acceptance?.allowed_exception_gates ?? []);
const exceptionGateBySource = lifecycle.risk_acceptance?.exception_gate_by_source ?? {};
const requireActiveException = lifecycle.risk_acceptance?.requires_active_exception === true;
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

function validateLinkedException(finding, exceptionId, riskAcceptedEvents, requireActiveNow) {
  const exception = exceptionMap.get(exceptionId);
  if (!exception) fail(`${finding.id}: exception ${exceptionId} does not exist`);

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
  if (exception.owner !== finding.owner) {
    fail(`${finding.id}: exception owner must match finding owner`);
  }
  if (!approvedOwners.has(exception.approved_by)) {
    fail(`${finding.id}: exception approver ${exception.approved_by ?? "missing"} is not an approved governance owner`);
  }
  if (exception.approved_by === exception.owner) {
    fail(`${finding.id}: exception owner and approver must be different`);
  }
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

  for (const event of riskAcceptedEvents) {
    const acceptedDate = utcDateOnly(event.atDate);
    if (acceptedDate < created || acceptedDate > expires) {
      fail(`${finding.id}: exception ${exceptionId} was not active when risk was accepted at ${event.at}`);
    }
  }

  if (requireActiveNow && expires < asOfDate) {
    fail(`${finding.id}: exception ${exceptionId} expired on ${exception.expires_on}`);
  }
  return exception;
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
  if (!activeSources.has(finding.source)) {
    fail(`${id}: source ${finding.source} is not active for operational findings`);
  }
  const control = controls.get(finding.control_id);
  if (!control) fail(`${id}: control ${finding.control_id ?? "missing"} is not in the active posture catalogue`);
  if (finding.severity !== control.severity) {
    fail(`${id}: severity must match control ${finding.control_id} severity ${control.severity}`);
  }
  requireString(finding.title, `${id}.title`, 12);
  if (!approvedOwners.has(finding.owner)) fail(`${id}: owner ${finding.owner ?? "missing"} is not approved`);
  if (!allowedStatuses.has(finding.status)) fail(`${id}: unsupported status ${finding.status ?? "missing"}`);
  if (!validTrackingUrl(finding.tracking_url)) fail(`${id}: tracking_url must reference a GitHub issue or pull request`);

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
      if (!allowedNext.includes(event.status)) {
        fail(`${id}: transition ${previousStatus} -> ${event.status} is not allowed`);
      }
    }
    if (event.status === "risk-accepted") {
      if (eventAt > due) fail(`${id}: risk acceptance cannot be approved after remediation SLA ${finding.remediation_due_at}`);
      riskAcceptedEvents.push({ ...event, atDate: eventAt });
    }
    if (event.status === "resolved") resolvedEvents.push({ ...event, atDate: eventAt });
    if (event.status === "closed") closedEvents.push({ ...event, atDate: eventAt });
    previousStatus = event.status;
    previousAt = eventAt;
  }
  if (previousStatus !== finding.status) fail(`${id}: final history status must match current status ${finding.status}`);

  if (riskAcceptedEvents.length > 0 && !finding.exception_id) {
    fail(`${id}: finding history contains risk acceptance but exception_id is missing`);
  }
  if (finding.exception_id && riskAcceptedEvents.length === 0) {
    fail(`${id}: exception_id requires at least one risk-accepted history event`);
  }
  if (finding.status === "risk-accepted" && requireActiveException && !finding.exception_id) {
    fail(`${id}: risk-accepted finding requires exception_id`);
  }
  if (finding.exception_id) {
    validateLinkedException(
      finding,
      finding.exception_id,
      riskAcceptedEvents,
      finding.status === "risk-accepted" && requireActiveException,
    );
  }

  if (["open", "in-remediation"].includes(finding.status) && asOf > due) {
    fail(`${id}: ${finding.status} finding is overdue since ${finding.remediation_due_at}`);
  }

  if (["resolved", "closed"].includes(finding.status)) {
    if (!finding.resolution || typeof finding.resolution !== "object") fail(`${id}: ${finding.status} finding requires resolution`);
    if (resolvedEvents.length === 0) fail(`${id}: ${finding.status} finding requires a resolved history event`);
    const resolvedAt = parseTimestamp(finding.resolution.resolved_at, `${id}.resolution.resolved_at`);
    if (resolvedAt > asOf) fail(`${id}: resolved_at cannot be in the future`);
    const latestResolved = resolvedEvents.at(-1);
    if (finding.resolution.resolved_at !== latestResolved.at) {
      fail(`${id}: resolution.resolved_at must match the latest resolved history event`);
    }
    if (resolvedAt < detected) fail(`${id}: resolved_at cannot precede detected_at`);
    requireString(finding.resolution.summary, `${id}.resolution.summary`, 20);
    if (!Array.isArray(finding.resolution.remediation_evidence) || finding.resolution.remediation_evidence.length === 0) {
      fail(`${id}: resolution.remediation_evidence is required`);
    }
    for (const evidence of finding.resolution.remediation_evidence) {
      if (!validEvidenceRef(evidence)) fail(`${id}: invalid remediation evidence reference ${evidence}`);
    }

    if (finding.status === "closed") {
      if (closedEvents.length !== 1 || finding.history.at(-1)?.status !== "closed") {
        fail(`${id}: closed finding requires exactly one terminal closed history event`);
      }
      if (!Array.isArray(finding.resolution.closure_evidence) || finding.resolution.closure_evidence.length < minimumClosureEvidence) {
        fail(`${id}: closed finding requires at least ${minimumClosureEvidence} closure evidence item(s)`);
      }
      for (const evidence of finding.resolution.closure_evidence) {
        if (!validEvidenceRef(evidence)) fail(`${id}: invalid closure evidence reference ${evidence}`);
      }
      if (!approvedOwners.has(finding.resolution.verified_by)) {
        fail(`${id}: resolution.verified_by must be an approved owner`);
      }
      if (requireIndependentVerifier && finding.resolution.verified_by === finding.owner) {
        fail(`${id}: closure verifier must be independent from the finding owner`);
      }
      const verifiedAt = parseTimestamp(finding.resolution.verified_at, `${id}.resolution.verified_at`);
      const closedAt = parseTimestamp(finding.resolution.closed_at, `${id}.resolution.closed_at`);
      if (verifiedAt > asOf || closedAt > asOf) fail(`${id}: closure timestamps cannot be in the future`);
      if (verifiedAt < resolvedAt) fail(`${id}: verified_at cannot precede resolved_at`);
      if (closedAt < verifiedAt) fail(`${id}: closed_at cannot precede verified_at`);
      if (finding.resolution.closed_at !== closedEvents[0].at) {
        fail(`${id}: resolution.closed_at must match the terminal closed history event`);
      }
      if (finding.resolution.verified_by !== closedEvents[0].actor) {
        fail(`${id}: terminal closed history actor must match resolution.verified_by`);
      }
    }
  } else if (finding.resolution !== undefined) {
    fail(`${id}: unresolved finding must not carry resolution evidence`);
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
