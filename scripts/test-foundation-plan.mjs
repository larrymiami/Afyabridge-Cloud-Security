import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

function fixture(action = "create") {
  const resources = [
    ['module.resource_hierarchy.google_folder.shared', "google_folder"],
    ['module.resource_hierarchy.google_folder.country["ke"]', "google_folder"],
    ['module.resource_hierarchy.google_folder.environment["ke-dev"]', "google_folder"],
  ];
  for (const scope of ["global", "ke"]) {
    for (const constraint of ["iam.disableServiceAccountKeyCreation", "iam.disableServiceAccountKeyUpload"]) {
      resources.push([`module.folder_policies["${scope}"].google_org_policy_policy.boolean["${constraint}"]`, "google_org_policy_policy"]);
    }
  }
  return {
    complete: true, applyable: action !== "no-op", errored: false,
    resource_changes: resources.map(([address, type]) => ({
      address, type, mode: "managed",
      change: { actions: [action], after: type === "google_folder"
        ? { display_name: "PRIVATE_SENTINEL", deletion_protection: true }
        : { spec: [{ rules: [{ enforce: "true" }] }] } },
    })),
  };
}
function run(plan) {
  return spawnSync(process.execPath, ["scripts/summarize-foundation-plan.mjs"], {
    input: typeof plan === "string" ? plan : JSON.stringify(plan), encoding: "utf8",
  });
}
for (const action of ["create", "update", "no-op"]) {
  test(`accepts reviewed ${action} inventory without leaking metadata`, () => {
    const result = run(fixture(action));
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Foundation hierarchy rehearsal/);
    assert.doesNotMatch(result.stdout + result.stderr, /PRIVATE_SENTINEL|module\.|disableServiceAccount/);
  });
}
const cases = [
  ["delete", p => { p.resource_changes[0].change.actions = ["delete"]; }],
  ["replace", p => { p.resource_changes[0].change.actions = ["delete", "create"]; }],
  ["extra project", p => { p.resource_changes.push({ mode: "managed", address: "private-project", type: "google_project", change: { actions: ["create"] } }); }],
  ["unrelated folder", p => { p.resource_changes[0].address = "unrelated.folder"; }],
  ["missing key restriction", p => { p.resource_changes.pop(); }],
  ["disabled key restriction", p => { p.resource_changes[3].change.after.spec[0].rules[0].enforce = "FALSE"; }],
  ["unprotected folder", p => { p.resource_changes[0].change.after.deletion_protection = false; }],
  ["duplicate address", p => { p.resource_changes.push(p.resource_changes[0]); }],
  ["incomplete plan", p => { p.complete = false; }],
  ["errored plan", p => { p.errored = true; }],
  ["missing inventory", p => { delete p.resource_changes; }],
];
for (const [label, mutate] of cases) {
  test(`rejects ${label} without leaking plan content`, () => {
    const plan = fixture(); mutate(plan);
    const result = run(plan);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
    assert.doesNotMatch(result.stderr, /PRIVATE_SENTINEL|private-project/);
  });
}
test("malformed JSON fails without echoing input", () => {
  const result = run("PRIVATE_SENTINEL");
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.stderr, /PRIVATE_SENTINEL/);
});
