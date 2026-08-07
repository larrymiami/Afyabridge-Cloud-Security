import { readFile } from "node:fs/promises";
import process from "node:process";

const root = process.cwd();

async function source(path) {
  return readFile(`${root}/${path}`, "utf8");
}

function fail(message) {
  throw new Error(`Supply-chain identity validation failed: ${message}`);
}

function count(sourceText, pattern) {
  return [...sourceText.matchAll(pattern)].length;
}

const unprivilegedWorkflows = [
  ".github/workflows/application-baseline.yml",
  ".github/workflows/security-gates.yml",
  ".github/workflows/supply-chain.yml",
  ".github/workflows/terraform-foundation.yml",
];

for (const path of unprivilegedWorkflows) {
  const text = await source(path);
  if (/^\s*id-token:\s*write\s*$/m.test(text)) {
    fail(`${path} must not receive GitHub OIDC token permission`);
  }
  if (/google-github-actions\/auth@/m.test(text)) {
    fail(`${path} must not authenticate to Google Cloud`);
  }
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
  const checkouts = [...text.matchAll(/uses:\s*actions\/checkout@[^\n]+[\s\S]*?(?=\n\s*- name:|$)/g)];
  if (checkouts.length === 0) fail(`${path} must check out the repository`);
  for (const checkout of checkouts) {
    if (!/persist-credentials:\s*false/.test(checkout[0])) {
      fail(`${path} checkout credentials must not persist`);
    }
  }
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

console.log("Supply-chain identity boundaries validated.");
