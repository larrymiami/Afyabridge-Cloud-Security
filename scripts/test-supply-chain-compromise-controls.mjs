import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import process from "node:process";

const execFileAsync = promisify(execFile);
const root = process.cwd();
const identityValidator = join(root, "scripts/validate-supply-chain-identities.mjs");
const governanceValidator = join(root, "scripts/validate-supply-chain-governance.mjs");
const revocationChecker = join(root, "scripts/check-supply-chain-revocation.mjs");

function fail(message) {
  throw new Error(`Supply-chain compromise test failed: ${message}`);
}

async function runNode(script, args = [], options = {}) {
  return execFileAsync(process.execPath, [script, ...args], {
    cwd: root,
    env: { ...process.env, ...options.env },
  });
}

async function expectPass(label, operation) {
  try {
    await operation();
    console.log(`PASS allow: ${label}`);
  } catch (error) {
    fail(`${label} unexpectedly failed: ${error.stderr ?? error.message}`);
  }
}

async function expectFail(label, operation) {
  try {
    await operation();
  } catch {
    console.log(`PASS deny: ${label}`);
    return;
  }
  fail(`${label} unexpectedly passed`);
}

async function createFixture() {
  const fixture = await mkdtemp(join(tmpdir(), "afyabridge-supply-chain-"));
  await mkdir(join(fixture, "apps/web"), { recursive: true });
  await mkdir(join(fixture, "infra/terraform/modules/cloud-run-service"), {
    recursive: true,
  });
  await mkdir(join(fixture, "security"), { recursive: true });

  await cp(join(root, ".github"), join(fixture, ".github"), { recursive: true });
  await cp(join(root, "apps/web/Dockerfile"), join(fixture, "apps/web/Dockerfile"));
  await cp(
    join(root, "infra/terraform/modules/cloud-run-service/main.tf"),
    join(fixture, "infra/terraform/modules/cloud-run-service/main.tf"),
  );
  await cp(
    join(root, "security/supply-chain-revocations.json"),
    join(fixture, "security/supply-chain-revocations.json"),
  );
  return fixture;
}

async function mutate(fixture, path, transform) {
  const target = join(fixture, path);
  const before = await readFile(target, "utf8");
  const after = transform(before);
  if (after === before) fail(`mutation for ${path} did not change the fixture`);
  await writeFile(target, after);
}

async function validateIdentityFixture(fixture) {
  return runNode(identityValidator, [], {
    env: { SUPPLY_CHAIN_REPO_ROOT: fixture },
  });
}

async function validateGovernanceFixture(fixture) {
  return runNode(governanceValidator, [], {
    env: { SUPPLY_CHAIN_REPO_ROOT: fixture },
  });
}

const baseline = await createFixture();
try {
  await expectPass("reviewed identity boundary", () => validateIdentityFixture(baseline));
  await expectPass("reviewed governance boundary", () => validateGovernanceFixture(baseline));
} finally {
  await rm(baseline, { recursive: true, force: true });
}

const mutations = [
  {
    label: "unprivileged build job gains OIDC permission",
    validator: validateIdentityFixture,
    path: ".github/workflows/supply-chain.yml",
    transform: (text) =>
      text.replace(
        "    timeout-minutes: 35\n\n    steps:",
        "    timeout-minutes: 35\n    permissions:\n      contents: read\n      id-token: write\n\n    steps:",
      ),
  },
  {
    label: "provenance job gains registry write permission",
    validator: validateIdentityFixture,
    path: ".github/workflows/supply-chain.yml",
    transform: (text) =>
      text.replace(
        "      attestations: write\n\n    steps:",
        "      attestations: write\n      packages: write\n\n    steps:",
      ),
  },
  {
    label: "privileged provenance job rebuilds the artifact",
    validator: validateIdentityFixture,
    path: ".github/workflows/supply-chain.yml",
    transform: (text) =>
      text.replace(
        "      - name: Install Cosign",
        "      - name: Malicious rebuild\n        run: docker build .\n\n      - name: Install Cosign",
      ),
  },
  {
    label: "build-to-sign checksum verification is removed",
    validator: validateIdentityFixture,
    path: ".github/workflows/supply-chain.yml",
    transform: (text) =>
      text.replace(
        "          sha256sum --check supply-chain-evidence/SHA256SUMS",
        "          echo checksum-verification-removed",
      ),
  },
  {
    label: "Cloud Run stops using the dedicated runtime identity",
    validator: validateIdentityFixture,
    path: "infra/terraform/modules/cloud-run-service/main.tf",
    transform: (text) =>
      text.replace(
        "    service_account = google_service_account.runtime.email",
        "    service_account = var.project_id",
      ),
  },
  {
    label: "signed provenance evidence retention is shortened",
    validator: validateGovernanceFixture,
    path: ".github/workflows/supply-chain.yml",
    transform: (text) => {
      const marker = "name: supply-chain-provenance-${{ github.sha }}";
      const index = text.indexOf(marker);
      if (index < 0) return text;
      const tail = text.slice(index).replace("retention-days: 90", "retention-days: 7");
      return `${text.slice(0, index)}${tail}`;
    },
  },
  {
    label: "GitHub Actions dependency monitoring is removed",
    validator: validateGovernanceFixture,
    path: ".github/dependabot.yml",
    transform: (text) =>
      text.replace(
        "package-ecosystem: github-actions",
        "package-ecosystem: disabled-actions",
      ),
  },
];

for (const test of mutations) {
  const fixture = await createFixture();
  try {
    await mutate(fixture, test.path, test.transform);
    await expectFail(test.label, () => test.validator(fixture));
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}

const revocationFixture = await mkdtemp(join(tmpdir(), "afyabridge-revocation-"));
try {
  const registryPath = join(revocationFixture, "revocations.json");
  const revokedSource = "1111111111111111111111111111111111111111";
  const allowedSource = "2222222222222222222222222222222222222222";
  await writeFile(
    registryPath,
    `${JSON.stringify(
      {
        schema_version: 1,
        revocations: [
          {
            id: "SC-REV-2026-001",
            kind: "source-commit",
            value: revokedSource,
            reason:
              "Synthetic compromised source used to prove fail-closed revocation behavior.",
            revoked_on: "2026-08-07",
            owner: "security",
            tracking_url:
              "https://github.com/larrymiami/Afyabridge-Cloud-Security/issues/1",
          },
        ],
      },
      null,
      2,
    )}\n`,
  );

  await expectPass("non-revoked source remains trusted", () =>
    runNode(revocationChecker, [
      "--registry",
      registryPath,
      "--source-sha",
      allowedSource,
    ]),
  );
  await expectFail("revoked source is denied", () =>
    runNode(revocationChecker, [
      "--registry",
      registryPath,
      "--source-sha",
      revokedSource,
    ]),
  );
} finally {
  await rm(revocationFixture, { recursive: true, force: true });
}

console.log(
  `Supply-chain compromise controls validated: ${mutations.length + 2} scenarios passed.`,
);
