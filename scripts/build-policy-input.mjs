import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const outputIndex = process.argv.indexOf("--output");
const outputPath = path.resolve(
  root,
  outputIndex >= 0 && process.argv[outputIndex + 1]
    ? process.argv[outputIndex + 1]
    : ".security/policy-input.json",
);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute)));
    } else if (entry.isFile()) {
      files.push(absolute);
    }
  }

  return files;
}

function repositoryPath(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split("\n").length;
}

function workflowFacts(file, source) {
  const actions = [];
  const actionPattern = /^\s*uses:\s*([^\s#]+).*$/gm;
  let match;

  while ((match = actionPattern.exec(source)) !== null) {
    const reference = match[1];
    const local = reference.startsWith("./") || reference.startsWith("docker://");
    const separator = reference.lastIndexOf("@");
    const ref = separator >= 0 ? reference.slice(separator + 1) : "";

    actions.push({
      reference,
      line: lineNumberAt(source, match.index),
      local,
      pinned: local || /^[0-9a-f]{40}$/i.test(ref),
    });
  }

  const relative = repositoryPath(file);

  return {
    path: relative,
    pull_request_target: /^\s*pull_request_target\s*:/m.test(source),
    enforce_immutable_actions: relative === ".github/workflows/security-gates.yml",
    actions,
  };
}

function dockerFacts(file, source) {
  const fromPattern = /^\s*FROM\s+([^\s]+)(?:\s+AS\s+([^\s]+))?/gim;
  const stages = [];
  let match;

  while ((match = fromPattern.exec(source)) !== null) {
    stages.push({
      image: match[1],
      alias: match[2] ?? null,
      index: match.index,
      line: lineNumberAt(source, match.index),
    });
  }

  const finalStage = stages.at(-1);
  const finalSource = finalStage ? source.slice(finalStage.index) : source;
  const userMatches = [...finalSource.matchAll(/^\s*USER\s+([^\s#]+)/gim)];
  const finalUser = userMatches.at(-1)?.[1] ?? "";
  const packageManagerMatches = [
    ...finalSource.matchAll(/^\s*RUN\s+.*\b(corepack|pnpm|npm|yarn)\b.*$/gim),
  ];

  return {
    path: repositoryPath(file),
    final_user: finalUser,
    runtime_package_manager_commands: packageManagerMatches.map((entry) => ({
      command: entry[0].trim(),
      line: finalStage
        ? finalStage.line - 1 + lineNumberAt(finalSource, entry.index ?? 0)
        : lineNumberAt(source, entry.index ?? 0),
    })),
    latest_base_images: stages
      .filter((stage) => stage.image === "latest" || /:latest(?:@|$)/i.test(stage.image))
      .map((stage) => ({ image: stage.image, line: stage.line })),
  };
}

function terraformFacts(file, source) {
  const primitiveRoleAssignments = [];
  const primitiveRolePattern = /\brole\s*=\s*"(roles\/(?:owner|editor|viewer))"/g;
  let match;

  while ((match = primitiveRolePattern.exec(source)) !== null) {
    primitiveRoleAssignments.push({
      role: match[1],
      line: lineNumberAt(source, match.index),
    });
  }

  const publicPrincipalAssignments = [];
  const publicPrincipalPattern = /\bmember\s*=\s*"(allUsers|allAuthenticatedUsers)"/g;
  while ((match = publicPrincipalPattern.exec(source)) !== null) {
    publicPrincipalAssignments.push({
      member: match[1],
      line: lineNumberAt(source, match.index),
    });
  }

  const authoritativeIamPolicyResources = [];
  const authoritativePattern = /resource\s+"(google_[^"]+_iam_policy)"\s+"([^"]+)"/g;
  while ((match = authoritativePattern.exec(source)) !== null) {
    authoritativeIamPolicyResources.push({
      resource_type: match[1],
      resource_name: match[2],
      line: lineNumberAt(source, match.index),
    });
  }

  return {
    path: repositoryPath(file),
    primitive_role_assignments: primitiveRoleAssignments,
    public_principal_assignments: publicPrincipalAssignments,
    authoritative_iam_policy_resources: authoritativeIamPolicyResources,
  };
}

const workflowDirectory = path.join(root, ".github/workflows");
const workflowFiles = (await walk(workflowDirectory)).filter((file) => /\.ya?ml$/i.test(file));
const workflows = await Promise.all(
  workflowFiles.map(async (file) => workflowFacts(file, await readFile(file, "utf8"))),
);

const dockerfiles = (await walk(root))
  .filter(
    (file) =>
      path.basename(file) === "Dockerfile" &&
      !repositoryPath(file).startsWith(".git/") &&
      !repositoryPath(file).includes("/node_modules/"),
  );
const docker = await Promise.all(
  dockerfiles.map(async (file) => dockerFacts(file, await readFile(file, "utf8"))),
);

const terraformRoot = path.join(root, "infra/terraform");
const terraformFiles = (await walk(terraformRoot)).filter((file) => file.endsWith(".tf"));
const terraform = await Promise.all(
  terraformFiles.map(async (file) => terraformFacts(file, await readFile(file, "utf8"))),
);

const input = {
  schema_version: 1,
  workflows: workflows.sort((a, b) => a.path.localeCompare(b.path)),
  dockerfiles: docker.sort((a, b) => a.path.localeCompare(b.path)),
  terraform: terraform.sort((a, b) => a.path.localeCompare(b.path)),
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(input, null, 2)}\n`, "utf8");
console.log(`Policy input written to ${path.relative(root, outputPath)}.`);
