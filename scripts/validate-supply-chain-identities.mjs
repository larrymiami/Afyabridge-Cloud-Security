import { readFile } from "node:fs/promises";
import process from "node:process";

const root = process.env.SUPPLY_CHAIN_REPO_ROOT ?? process.cwd();

async function source(path) {
  return readFile(`${root}/${path}`, "utf8");
}

function fail(message) {
  throw new Error(`Supply-chain identity validation failed: ${message}`);
}

function count(sourceText, pattern) {
  return [...sourceText.matchAll(pattern)].length;
}

function jobBlock(workflow, jobName) {
  const pattern = new RegExp(
    `(?:^|\\n)  ${jobName}:\\n[\\s\\S]*?(?=\\n  [A-Za-z0-9_-]+:\\n|$)`,
  );
  const match = workflow.match(pattern);
  if (!match) fail(`Supply-chain workflow must define the ${jobName} job`);
  return match[0];
}

function validateCheckoutCredentials(text, label) {
  const checkouts = [
    ...text.matchAll(/uses:\s*actions\/checkout@[^\n]+[\s\S]*?(?=\n\s*- name:|$)/g),
  ];
  if (checkouts.length === 0) fail(`${label} must check out the repository`);
  for (const checkout of checkouts) {
    if (!/persist-credentials:\s*false/.test(checkout[0])) {
      fail(`${label} checkout credentials must not persist`);
    }
  }
}

const unprivilegedWorkflows = [
  ".github/workflows/application-baseline.yml",
  ".github/workflows/security-gates.yml",
  ".github/workflows/terraform-foundation.yml",
];

const supplyChainPath = ".github/workflows/supply-chain.yml";

const deploymentWorkflows = [
  ".github/workflows/terraform-federation-plan.yml",
  ".github/workflows/terraform-federation-apply.yml",
];

for (const path of [
  ...unprivilegedWorkflows,
  supplyChainPath,
  ...deploymentWorkflows,
]) {
  const text = await source(path);
  if (/runs-on:\s*ubuntu-latest/.test(text)) {
    fail(`${path} must use an explicit Ubuntu runner family`);
  }
  const runnerRefs = [...text.matchAll(/runs-on:\s*(ubuntu-[^\s]+)/g)].map(
    (match) => match[1],
  );
  if (runnerRefs.some((runner) => runner !== "ubuntu-24.04")) {
    fail(`${path} must use the reviewed ubuntu-24.04 runner family`);
  }
}

for (const path of unprivilegedWorkflows) {
  const text = await source(path);
  if (/^\s*id-token:\s*write\s*$/m.test(text)) {
    fail(`${path} must not receive GitHub OIDC token permission`);
  }
  if (/google-github-actions\/auth@/m.test(text)) {
    fail(`${path} must not authenticate to Google Cloud`);
  }
}

const supplyChain = await source(supplyChainPath);
if (!/^permissions:\n  contents:\s*read\s*$/m.test(supplyChain)) {
  fail(`${supplyChainPath} must keep workflow-level permissions at contents: read`);
}
if (count(supplyChain, /^\s*id-token:\s*write\s*$/gm) !== 1) {
  fail(`${supplyChainPath} must grant id-token: write exactly once, at the provenance job`);
}
if (count(supplyChain, /^\s*attestations:\s*write\s*$/gm) !== 1) {
  fail(`${supplyChainPath} must grant attestations: write exactly once, at the provenance job`);
}
if (/^\s*(?:packages|artifact-metadata):\s*write\s*$/m.test(supplyChain)) {
  fail(`${supplyChainPath} must not gain registry or artifact-metadata write permission for blob provenance`);
}
if (/google-github-actions\/auth@/m.test(supplyChain)) {
  fail(`${supplyChainPath} must not authenticate to Google Cloud`);
}

const buildJob = jobBlock(supplyChain, "sbom");
if (/^\s*id-token:\s*write\s*$/m.test(buildJob)) {
  fail("Supply-chain build/SBOM job must not receive GitHub OIDC token permission");
}
if (/^\s*attestations:\s*write\s*$/m.test(buildJob)) {
  fail("Supply-chain build/SBOM job must not receive attestation write permission");
}
if (/\bcosign\s+(?:sign|sign-blob)\b/.test(buildJob) || /actions\/attest@/.test(buildJob)) {
  fail("Supply-chain build/SBOM job must not sign or attest its own outputs");
}
if (!/docker save\s+--output/.test(buildJob)) {
  fail("Supply-chain build/SBOM job must export the exact built image for signing");
}
if (!/supply-chain-evidence\/SHA256SUMS/.test(buildJob)) {
  fail("Supply-chain build/SBOM job must record artifact digests before handoff");
}

const provenanceJob = jobBlock(supplyChain, "provenance");
if (!/^\s*needs:\s*sbom\s*$/m.test(provenanceJob)) {
  fail("Supply-chain provenance job must depend on the unprivileged build/SBOM job");
}
if (!/^\s*if:\s*github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'\s*$/m.test(provenanceJob)) {
  fail("Supply-chain provenance job must sign only trusted pushes to refs/heads/main");
}
if (count(provenanceJob, /^\s*id-token:\s*write\s*$/gm) !== 1) {
  fail("Supply-chain provenance job must receive exactly one GitHub OIDC grant");
}
if (count(provenanceJob, /^\s*attestations:\s*write\s*$/gm) !== 1) {
  fail("Supply-chain provenance job must receive exactly one attestation write grant");
}
if (!/^\s*contents:\s*read\s*$/m.test(provenanceJob)) {
  fail("Supply-chain provenance job must retain read-only repository contents permission");
}
const signingWritePermissions = [
  ...provenanceJob.matchAll(/^\s{6}([A-Za-z0-9-]+):\s*write\s*$/gm),
].map((match) => match[1]);
if (
  signingWritePermissions.length !== 2 ||
  !signingWritePermissions.includes("id-token") ||
  !signingWritePermissions.includes("attestations")
) {
  fail("Supply-chain provenance job may write only id-token and attestations scopes");
}
if (!/actions\/download-artifact@/.test(provenanceJob)) {
  fail("Supply-chain provenance job must consume the prior build artifact instead of rebuilding");
}
if (!/sha256sum --check supply-chain-evidence\/SHA256SUMS/.test(provenanceJob)) {
  fail("Supply-chain provenance job must verify the build evidence handoff before signing");
}
if (!/test \"\$\(jq -r '\.source_commit' supply-chain-evidence\/build-metadata\.json\)\" = \"\$\{GITHUB_SHA\}\"/.test(provenanceJob)) {
  fail("Supply-chain provenance job must bind the build source commit to the trusted main commit");
}
if (!/test \"\$\(jq -r '\.ref' supply-chain-evidence\/build-metadata\.json\)\" = \"refs\/heads\/main\"/.test(provenanceJob)) {
  fail("Supply-chain provenance job must bind build metadata to refs/heads/main");
}
if (!/cosign sign-blob/.test(provenanceJob) || !/cosign verify-blob/.test(provenanceJob)) {
  fail("Supply-chain provenance job must keylessly sign and verify the exported image blob");
}
if (/\.github\/workflows\/supply-chain\.yml@\$\{GITHUB_REF\}/.test(provenanceJob)) {
  fail("Supply-chain signing identity must not trust an arbitrary execution ref");
}
if (count(provenanceJob, /\.github\/workflows\/supply-chain\.yml@refs\/heads\/main/g) < 3) {
  fail("Supply-chain signing and revocation checks must bind to the main workflow identity");
}
if (!/2>&1 \| tee supply-chain-signing-evidence\/cosign-verification\.txt/.test(provenanceJob)) {
  fail("Cosign verification evidence must capture stderr as well as stdout");
}
if (!/test -s supply-chain-signing-evidence\/cosign-verification\.txt/.test(provenanceJob)) {
  fail("Cosign verification evidence must be non-empty");
}
if (count(provenanceJob, /actions\/attest@/g) < 2) {
  fail("Supply-chain provenance job must create build provenance and SBOM attestations");
}
if (count(provenanceJob, /--source-ref \"\$GITHUB_REF\"/g) !== 2) {
  fail("GitHub attestation verification must constrain both attestations to the trusted source ref");
}
if (count(provenanceJob, /--source-digest \"\$GITHUB_SHA\"/g) !== 2) {
  fail("GitHub attestation verification must constrain both attestations to the trusted source digest");
}
if (count(provenanceJob, /check-supply-chain-revocation\.mjs/g) < 2) {
  fail("Supply-chain provenance job must enforce revocation before signing and after verification");
}
if (!/cmp security\/supply-chain-revocations\.json supply-chain-evidence\/revocations\.json/.test(provenanceJob)) {
  fail("Supply-chain provenance job must bind the checked-out revocation policy to the checksummed build snapshot");
}
if (/\bdocker build\b/.test(provenanceJob)) {
  fail("Supply-chain provenance job must not rebuild the artifact it is signing");
}
validateCheckoutCredentials(provenanceJob, "Supply-chain provenance job");

const applicationWorkflow = await source(".github/workflows/application-baseline.yml");
if (!/image:\s*postgres:[^\s]+@sha256:[0-9a-f]{64}/i.test(applicationWorkflow)) {
  fail("Application CI PostgreSQL service must be pinned by digest");
}

const planPath = ".github/workflows/terraform-federation-plan.yml";
const plan = await source(planPath);
if (count(plan, /^\s*id-token:\s*write\s*$/gm) !== 1) {
  fail(`${planPath} must grant id-token: write exactly once, at the plan job`);
}
if (!/vars\.GCP_TERRAFORM_PLAN_SERVICE_ACCOUNT/.test(plan)) {
  fail(`${planPath} must use the dedicated Terraform plan service account`);
}
if (/vars\.GCP_TERRAFORM_APPLY_SERVICE_ACCOUNT/.test(plan)) {
  fail(`${planPath} must not reference the Terraform apply service account`);
}

const applyPath = ".github/workflows/terraform-federation-apply.yml";
const apply = await source(applyPath);
if (count(apply, /^\s*id-token:\s*write\s*$/gm) !== 2) {
  fail(`${applyPath} must grant id-token: write exactly once to each plan/apply job`);
}
if (!/vars\.GCP_TERRAFORM_PLAN_SERVICE_ACCOUNT/.test(apply)) {
  fail(`${applyPath} must use the dedicated Terraform plan service account in the plan job`);
}
if (!/vars\.GCP_TERRAFORM_APPLY_SERVICE_ACCOUNT/.test(apply)) {
  fail(`${applyPath} must use the dedicated Terraform apply service account in the apply job`);
}
if (!/^\s*environment:\s*production\s*$/m.test(apply)) {
  fail(`${applyPath} apply job must remain bound to the production environment`);
}

for (const path of [planPath, applyPath]) {
  const text = await source(path);
  validateCheckoutCredentials(text, path);
}

const dockerfile = await source("apps/web/Dockerfile");
const baseImages = [...dockerfile.matchAll(/^FROM\s+([^\s]+)/gm)].map(
  (match) => match[1],
);
if (baseImages.length < 2) {
  fail("Web image must retain separate build and runtime stages");
}
for (const image of baseImages) {
  if (!/@sha256:[0-9a-f]{64}$/i.test(image)) {
    fail(`Docker base image must be pinned by digest: ${image}`);
  }
}
if (/\bapk\s+upgrade\b/.test(dockerfile)) {
  fail("Runtime image must not mutate its base package set with apk upgrade");
}

const cloudRunModule = await source("infra/terraform/modules/cloud-run-service/main.tf");
if (!/resource\s+"google_service_account"\s+"runtime"/.test(cloudRunModule)) {
  fail("Cloud Run module must create a dedicated runtime service account");
}
if (!/service_account\s*=\s*google_service_account\.runtime\.email/.test(cloudRunModule)) {
  fail("Cloud Run service must execute as the dedicated runtime service account");
}
if (/GCP_TERRAFORM_(?:PLAN|APPLY)_SERVICE_ACCOUNT/.test(cloudRunModule)) {
  fail("Cloud Run runtime module must not reference GitHub deployment identities");
}

console.log("Supply-chain build, signing, revocation, deploy, and runtime boundaries validated.");
