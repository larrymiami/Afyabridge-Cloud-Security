import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import process from "node:process";

const execFileAsync = promisify(execFile);
const root = resolve(process.cwd());
const validator = join(root, "scripts/validate-security-exceptions.mjs");
const asOf = "2026-08-07";

function fail(message) {
  throw new Error(`Security exception governance test failed: ${message}`);
}

function validException() {
  return {
    id: "SEC-EX-2026-001",
    gate: "cloud-posture",
    scope: "CSPM-FND-2026-001 / NET-C04",
    rationale: "Temporary risk acceptance while the reviewed remediation is implemented and independently verified.",
    compensating_controls: [
      "Keep the affected edge restricted to approved ingress while remediation is in progress."
    ],
    owner: "cloud-security",
    approved_by: "security-operations",
    tracking_url: "https://github.com/larrymiami/Afyabridge-Cloud-Security/issues/1",
    finding_ids: ["CSPM-FND-2026-001"],
    created_on: "2026-08-07",
    expires_on: "2026-08-21"
  };
}

async function run(registry) {
  const directory = await mkdtemp(join(tmpdir(), "afyabridge-exception-governance-"));
  try {
    const path = join(directory, "exceptions.json");
    await writeFile(path, `${JSON.stringify(registry, null, 2)}\n`, "utf8");
    return await execFileAsync(process.execPath, [validator, path, "--as-of", asOf], { cwd: root });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

async function expectPass(label, registry) {
  try {
    await run(registry);
    console.log(`PASS allow: ${label}`);
  } catch (error) {
    fail(`${label} unexpectedly failed: ${error.stderr ?? error.message}`);
  }
}

async function expectFail(label, expectedError, registry) {
  try {
    await run(registry);
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

await expectPass("empty reviewed exception registry", { schema_version: 1, exceptions: [] });
await expectPass("posture finding risk acceptance uses existing exception registry", {
  schema_version: 1,
  exceptions: [validException()],
});

{
  const exception = validException();
  exception.expires_on = "2026-02-31";
  await expectFail("impossible calendar date rejected", "expires_on is invalid", {
    schema_version: 1,
    exceptions: [exception],
  });
}

{
  const exception = validException();
  exception.created_on = "2026-06-01";
  exception.expires_on = "2026-07-01";
  await expectFail("expired exception rejected", "exception expired on 2026-07-01", {
    schema_version: 1,
    exceptions: [exception],
  });
}

{
  const exception = validException();
  exception.created_on = "2026-08-08";
  exception.expires_on = "2026-08-21";
  await expectFail("future-created exception rejected", "exception cannot be created in the future", {
    schema_version: 1,
    exceptions: [exception],
  });
}

{
  const exception = validException();
  exception.id = "SEC-EX-2025-001";
  await expectFail("exception id year must match creation year", "exception id year must match created_on year", {
    schema_version: 1,
    exceptions: [exception],
  });
}

{
  const exception = validException();
  exception.finding_ids = ["CSPM-FND-2026-001", "CSPM-FND-2026-001"];
  await expectFail("duplicate finding linkage rejected", "duplicate finding id CSPM-FND-2026-001", {
    schema_version: 1,
    exceptions: [exception],
  });
}

{
  const exception = validException();
  exception.finding_ids = ["FINDING-1"];
  await expectFail("malformed finding linkage rejected", "finding_ids entries must match CSPM-FND-YYYY-NNN", {
    schema_version: 1,
    exceptions: [exception],
  });
}

{
  const exception = validException();
  exception.approved_by = exception.owner;
  await expectFail("self-approved exception rejected", "owner and approver must be different", {
    schema_version: 1,
    exceptions: [exception],
  });
}

{
  const exception = validException();
  exception.created_on = "2026-08-07";
  exception.expires_on = "2026-11-06";
  await expectFail("exception longer than global maximum rejected", "exception lifetime must be between 1 and 90 days", {
    schema_version: 1,
    exceptions: [exception],
  });
}

console.log("Security exception governance validated: 10 scenarios passed.");
