import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const SAFE_ACTIONS = new Set(["no-op", "read"]);

export function evaluateTerraformDrift(plan) {
  const changes = Array.isArray(plan?.resource_changes) ? plan.resource_changes : [];
  const findings = [];

  for (const resource of changes) {
    if (resource.mode === "data") continue;
    const actions = resource.change?.actions ?? [];
    if (actions.length === 0 || actions.every((action) => SAFE_ACTIONS.has(action))) continue;

    const replaces = actions.includes("create") && actions.includes("delete");
    const deletes = actions.includes("delete");
    findings.push({
      address: resource.address ?? "unknown",
      resource_type: resource.type ?? "unknown",
      actions,
      severity: replaces || deletes ? "critical" : "high",
      reason: replaces
        ? "managed resource replacement detected"
        : deletes
          ? "managed resource deletion detected"
          : "managed resource differs from reviewed Terraform state",
    });
  }

  return {
    schema_version: 1,
    source: "terraform-show-json",
    summary: {
      managed_resources_evaluated: changes.filter((resource) => resource.mode !== "data").length,
      drift_findings: findings.length,
      critical: findings.filter((finding) => finding.severity === "critical").length,
      high: findings.filter((finding) => finding.severity === "high").length,
    },
    findings,
  };
}

export function driftMarkdown(result) {
  const lines = [
    "# Terraform drift evaluation",
    "",
    `- Managed resources evaluated: **${result.summary.managed_resources_evaluated}**`,
    `- Drift findings: **${result.summary.drift_findings}**`,
    `- Critical: **${result.summary.critical}**`,
    `- High: **${result.summary.high}**`,
    "",
  ];
  if (result.findings.length === 0) {
    lines.push("No managed-resource drift is represented in this Terraform plan.", "");
  } else {
    lines.push("| Resource | Actions | Severity | Reason |", "|---|---|---|---|");
    for (const finding of result.findings) {
      lines.push(
        `| ${finding.address} | ${finding.actions.join(", ")} | ${finding.severity} | ${finding.reason} |`,
      );
    }
    lines.push("");
  }
  lines.push(
    "A clean result is meaningful only when the input plan was generated against the deployed remote state without an intentional configuration change. v0.10B tests this evaluator with synthetic plans; live out-of-band drift remains pending the v0.7 deployment path.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

async function main() {
  const planPath = process.argv[2];
  if (!planPath) throw new Error("usage: node scripts/evaluate-terraform-drift.mjs <terraform-show.json> [--json path] [--markdown path]");
  const getArg = (name) => {
    const index = process.argv.indexOf(name);
    return index >= 0 ? process.argv[index + 1] : null;
  };
  const result = evaluateTerraformDrift(JSON.parse(await readFile(resolve(planPath), "utf8")));
  const jsonOutput = getArg("--json");
  const markdownOutput = getArg("--markdown");
  if (jsonOutput) {
    await mkdir(dirname(resolve(jsonOutput)), { recursive: true });
    await writeFile(resolve(jsonOutput), `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  const markdown = driftMarkdown(result);
  if (markdownOutput) {
    await mkdir(dirname(resolve(markdownOutput)), { recursive: true });
    await writeFile(resolve(markdownOutput), markdown, "utf8");
  }
  console.log(`Terraform drift evaluated: ${result.summary.drift_findings} finding(s).`);
  if (!jsonOutput && !markdownOutput) process.stdout.write(markdown);
  if (result.summary.drift_findings > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack ?? error.message);
    process.exitCode = 1;
  });
}
