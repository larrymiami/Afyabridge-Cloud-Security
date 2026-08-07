import { evaluateTerraformDrift } from "./evaluate-terraform-drift.mjs";

function fail(message) {
  throw new Error(`Terraform drift evaluator test failed: ${message}`);
}

function plan(resourceChanges) {
  return { format_version: "1.2", resource_changes: resourceChanges };
}

function resource(address, actions, mode = "managed") {
  return { address, mode, type: address.split(".")[0], change: { actions } };
}

const safe = evaluateTerraformDrift(
  plan([
    resource("google_project.safe", ["no-op"]),
    resource("google_compute_network.lookup", ["read"], "data"),
  ]),
);
if (safe.summary.drift_findings !== 0) fail("no-op/read plan must be clean");
console.log("PASS allow: no managed-resource drift");

const cases = [
  ["managed resource update", [resource("google_project.changed", ["update"])], "high"],
  ["unexpected managed resource creation", [resource("google_storage_bucket.extra", ["create"])], "high"],
  ["managed resource deletion", [resource("google_sql_database_instance.db", ["delete"])], "critical"],
  ["managed resource replacement", [resource("google_compute_network.vpc", ["delete", "create"])], "critical"],
  ["data source read ignored", [resource("google_client_config.current", ["read"], "data")], null],
];

for (const [label, resources, severity] of cases) {
  const result = evaluateTerraformDrift(plan(resources));
  if (severity === null) {
    if (result.summary.drift_findings !== 0) fail(`${label} should not create drift`);
    console.log(`PASS allow: ${label}`);
    continue;
  }
  if (result.summary.drift_findings !== 1 || result.findings[0].severity !== severity) {
    fail(`${label} should create one ${severity} finding`);
  }
  console.log(`PASS deny: ${label} -> ${severity}`);
}

console.log(`Terraform drift evaluator controls validated: ${cases.length + 1} scenarios passed.`);
