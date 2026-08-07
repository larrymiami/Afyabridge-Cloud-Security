import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

function fail(message) {
  throw new Error(`Cloud posture evaluation failed: ${message}`);
}

function valueAt(object, path) {
  return path.split(".").reduce((value, key) => {
    if (value === undefined || value === null || !Object.hasOwn(value, key)) return undefined;
    return value[key];
  }, object);
}

function evaluateAssertion(actual, assertion) {
  switch (assertion.operator) {
    case "equals":
      return Object.is(actual, assertion.expected);
    case "empty":
      return Array.isArray(actual) && actual.length === 0;
    case "contains_all":
      return (
        Array.isArray(actual) &&
        Array.isArray(assertion.expected) &&
        assertion.expected.every((item) => actual.includes(item))
      );
    default:
      fail(`unsupported assertion operator ${assertion.operator}`);
  }
}

export function evaluatePosture({ snapshot, rules, catalogue, governance }) {
  if (snapshot?.schema_version !== 1) fail("snapshot schema_version must be 1");
  if (rules?.schema_version !== 1) fail("rules schema_version must be 1");
  if (snapshot.profile_id !== rules.profile_id || snapshot.profile_id !== catalogue.profile_id) {
    fail("snapshot, rule set, and catalogue profile_id values must match");
  }
  if (!snapshot.source?.type) fail("snapshot source.type is required");

  const controls = new Map(catalogue.controls.map((control) => [control.id, control]));
  const blockingSeverities = new Set(
    Object.entries(governance.severity_policy)
      .filter(([, policy]) => policy.merge_blocking === true)
      .map(([severity]) => severity),
  );
  const ruleIds = new Set();
  const results = [];

  for (const rule of rules.rules) {
    if (ruleIds.has(rule.id)) fail(`duplicate rule id ${rule.id}`);
    ruleIds.add(rule.id);
    const control = controls.get(rule.control_id);
    if (!control) fail(`${rule.id}: unknown control ${rule.control_id}`);
    if (!rule.supported_sources?.includes(snapshot.source.type)) {
      fail(`${rule.id}: source ${snapshot.source.type} is not supported by this rule`);
    }

    const failedAssertions = [];
    for (const assertion of rule.assertions ?? []) {
      const actual = valueAt(snapshot.facts, assertion.fact);
      if (actual === undefined) {
        failedAssertions.push({
          fact: assertion.fact,
          operator: assertion.operator,
          expected: assertion.expected ?? null,
          actual: null,
          message: `${assertion.message} Fact is missing from the snapshot.`,
        });
        continue;
      }
      if (!evaluateAssertion(actual, assertion)) {
        failedAssertions.push({
          fact: assertion.fact,
          operator: assertion.operator,
          expected: assertion.expected ?? null,
          actual,
          message: assertion.message,
        });
      }
    }

    results.push({
      rule_id: rule.id,
      control_id: control.id,
      title: rule.title,
      category: control.category,
      severity: control.severity,
      owner: control.owner,
      claim_scope: rule.claim_scope,
      live_validation_required: control.validation.live_validation_required,
      status: failedAssertions.length === 0 ? "pass" : "fail",
      blocking: failedAssertions.length > 0 && blockingSeverities.has(control.severity),
      failed_assertions: failedAssertions,
    });
  }

  const summary = {
    rules_evaluated: results.length,
    passing: results.filter((result) => result.status === "pass").length,
    failing: results.filter((result) => result.status === "fail").length,
    blocking_findings: results.filter((result) => result.blocking).length,
    live_validation_pending: results.filter((result) => result.live_validation_required).length,
  };

  return {
    schema_version: 1,
    profile_id: snapshot.profile_id,
    check_set_id: rules.check_set_id,
    source: snapshot.source,
    summary,
    results,
  };
}

export function postureMarkdown(evaluation) {
  const lines = [
    "# Cloud posture evaluation",
    "",
    `- Source: \`${evaluation.source.type}\` / \`${evaluation.source.stage ?? "unknown"}\``,
    `- Rules evaluated: **${evaluation.summary.rules_evaluated}**`,
    `- Passing: **${evaluation.summary.passing}**`,
    `- Failing: **${evaluation.summary.failing}**`,
    `- Blocking findings: **${evaluation.summary.blocking_findings}**`,
    `- Rules still requiring live validation: **${evaluation.summary.live_validation_pending}**`,
    "",
    "| Rule | Control | Severity | Scope | Result | Live validation |",
    "|---|---|---|---|---|---|",
  ];

  for (const result of evaluation.results) {
    lines.push(
      `| ${result.rule_id} | ${result.control_id} | ${result.severity} | ${result.claim_scope} | ${result.status.toUpperCase()} | ${result.live_validation_required ? "pending" : "not required"} |`,
    );
  }

  const failed = evaluation.results.filter((result) => result.status === "fail");
  if (failed.length > 0) {
    lines.push("", "## Findings", "");
    for (const result of failed) {
      lines.push(`### ${result.rule_id} — ${result.title}`, "");
      for (const assertion of result.failed_assertions) {
        lines.push(`- **${assertion.fact}**: ${assertion.message}`);
      }
      lines.push("");
    }
  }

  lines.push(
    "## Evidence boundary",
    "",
    "A PASS from a repository snapshot proves the reviewed desired-state invariant represented by that rule. It does not prove live Google Cloud effective state when the mapped control still has `live_validation_required: true`.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

async function loadJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function main() {
  const root = resolve(process.cwd());
  const arg = (name) => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : null;
  };
  const snapshotPath = resolve(arg("--snapshot") ?? "security-evidence/cloud-posture-snapshot.json");
  const rulesPath = resolve(arg("--rules") ?? "security/cloud-posture-rules.json");
  const cataloguePath = resolve(arg("--catalogue") ?? "security/cloud-posture-controls.json");
  const governancePath = resolve(arg("--governance") ?? "security/cloud-posture-governance.json");
  const jsonOutput = arg("--json") ? resolve(arg("--json")) : null;
  const markdownOutput = arg("--markdown") ? resolve(arg("--markdown")) : null;

  const evaluation = evaluatePosture({
    snapshot: await loadJson(snapshotPath),
    rules: await loadJson(rulesPath),
    catalogue: await loadJson(cataloguePath),
    governance: await loadJson(governancePath),
  });

  if (jsonOutput) {
    await mkdir(dirname(jsonOutput), { recursive: true });
    await writeFile(jsonOutput, `${JSON.stringify(evaluation, null, 2)}\n`, "utf8");
  }
  const markdown = postureMarkdown(evaluation);
  if (markdownOutput) {
    await mkdir(dirname(markdownOutput), { recursive: true });
    await writeFile(markdownOutput, markdown, "utf8");
  }

  console.log(
    `Cloud posture evaluated: ${evaluation.summary.passing}/${evaluation.summary.rules_evaluated} rules passing; ${evaluation.summary.blocking_findings} blocking finding(s); ${evaluation.summary.live_validation_pending} rule(s) still require live validation.`,
  );
  if (!jsonOutput && !markdownOutput) process.stdout.write(markdown);
  if (evaluation.summary.blocking_findings > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
