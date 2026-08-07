import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";

const outputDirectory = process.argv[2] ?? "security-evidence";
const needs = JSON.parse(process.env.SECURITY_GATE_RESULTS ?? "{}");
const gates = Object.entries(needs)
  .map(([name, value]) => ({ name, result: value?.result ?? "unknown" }))
  .sort((a, b) => a.name.localeCompare(b.name));

const acceptedResults = new Set(["success", "skipped"]);
const overall = gates.every((gate) => acceptedResults.has(gate.result)) ? "pass" : "fail";
const evidence = {
  schema_version: 1,
  repository: process.env.GITHUB_REPOSITORY ?? "unknown",
  workflow: process.env.GITHUB_WORKFLOW ?? "unknown",
  run_id: process.env.GITHUB_RUN_ID ?? "unknown",
  run_attempt: process.env.GITHUB_RUN_ATTEMPT ?? "unknown",
  event: process.env.GITHUB_EVENT_NAME ?? "unknown",
  ref: process.env.GITHUB_REF ?? "unknown",
  commit: process.env.GITHUB_SHA ?? "unknown",
  generated_at: new Date().toISOString(),
  overall,
  gates,
};

const rows = gates.map((gate) => `| ${gate.name} | ${gate.result} |`).join("\n");
const markdown = `# Security gate evidence\n\n- Repository: \`${evidence.repository}\`\n- Workflow: \`${evidence.workflow}\`\n- Run ID: \`${evidence.run_id}\`\n- Attempt: \`${evidence.run_attempt}\`\n- Event: \`${evidence.event}\`\n- Ref: \`${evidence.ref}\`\n- Commit: \`${evidence.commit}\`\n- Overall: **${overall.toUpperCase()}**\n- Generated: \`${evidence.generated_at}\`\n\n| Gate | Result |\n|---|---|\n${rows}\n`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(`${outputDirectory}/security-gates.json`, `${JSON.stringify(evidence, null, 2)}\n`);
await writeFile(`${outputDirectory}/security-gates.md`, markdown);
console.log(`Security evidence generated with overall result: ${overall}.`);
