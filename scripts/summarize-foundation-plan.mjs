// Consume sensitive Terraform JSON on stdin and emit aggregate counts only.
// This hierarchy-only rehearsal must never propose deletes, replacements,
// projects, workloads, IAM bindings, or modifications to unrelated resources.
import process from "node:process";

let input = "";
for await (const chunk of process.stdin) input += chunk;
let plan;
try {
  plan = JSON.parse(input);
} catch {
  throw new Error("Foundation plan JSON is invalid; raw content withheld.");
}
if (plan.errored || plan.complete !== true || typeof plan.applyable !== "boolean") {
  throw new Error("Foundation rehearsal requires a complete, non-errored plan.");
}
const counts = { create: 0, update: 0, noop: 0 };
const expected = new Map([
  ['module.resource_hierarchy.google_folder.shared', "google_folder"],
  ['module.resource_hierarchy.google_folder.country["ke"]', "google_folder"],
  ['module.resource_hierarchy.google_folder.environment["ke-dev"]', "google_folder"],
]);
for (const scope of ["global", "ke"]) {
  for (const constraint of ["iam.disableServiceAccountKeyCreation", "iam.disableServiceAccountKeyUpload"]) {
    expected.set(`module.folder_policies["${scope}"].google_org_policy_policy.boolean["${constraint}"]`, "google_org_policy_policy");
  }
}
const seen = new Set();
if (!Array.isArray(plan.resource_changes)) {
  throw new Error("Foundation plan must contain the reviewed resource inventory.");
}
for (const resource of plan.resource_changes ?? []) {
  if (resource.mode === "data") continue;
  const actions = resource.change?.actions;
  if (!Array.isArray(actions) || actions.length !== 1) {
    throw new Error("Foundation rehearsal rejects replacements or malformed actions.");
  }
  const action = actions[0];
  if (expected.get(resource.address) !== resource.type || seen.has(resource.address) || !["create", "update", "no-op"].includes(action)) {
    throw new Error("Foundation rehearsal exceeds the reviewed hierarchy-only scope.");
  }
  seen.add(resource.address);
  if (resource.type === "google_folder" && resource.change.after?.deletion_protection !== true) {
    throw new Error("Foundation folders must retain deletion protection.");
  }
  if (resource.type === "google_org_policy_policy") {
    const rules = resource.change.after?.spec?.[0]?.rules;
    if (!Array.isArray(rules) || rules.length !== 1 || ![true, "true", "TRUE"].includes(rules[0].enforce)) {
      throw new Error("Foundation key restrictions must remain enforced.");
    }
  }
  counts[action === "no-op" ? "noop" : action] += 1;
}
if (seen.size !== expected.size) {
  throw new Error("Foundation plan is missing reviewed hierarchy controls.");
}
console.log("## Foundation hierarchy rehearsal\n");
console.log("| Action | Count |\n|---|---:|");
console.log(`| Create | ${counts.create} |\n| Update | ${counts.update} |\n| No change | ${counts.noop} |`);
console.log("\nPlanning evidence only. No apply or saved-plan artifact is produced for deployment.");
