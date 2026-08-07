import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const apiRoot = path.join(root, "apps/web/src/app/api");
const contractPath = path.join(root, "contracts/openapi/afyabridge-api.openapi.json");
const HTTP_METHODS = new Set(["get", "post", "put", "patch", "delete", "options", "head"]);

function fail(message) {
  throw new Error(`API contract validation failed: ${message}`);
}

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

function routePathFromFile(file) {
  const relativeDirectory = path.relative(apiRoot, path.dirname(file));
  if (!relativeDirectory) {
    return "/api";
  }

  const segments = relativeDirectory.split(path.sep).map((segment) => {
    const dynamic = /^\[([^\]]+)\]$/.exec(segment);
    return dynamic ? `{${dynamic[1]}}` : segment;
  });

  return `/api/${segments.join("/")}`;
}

function implementedOperations(routeFiles) {
  const operations = new Set();

  for (const { file, source } of routeFiles) {
    const route = routePathFromFile(file);
    const methodPattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g;
    let match;

    while ((match = methodPattern.exec(source)) !== null) {
      operations.add(`${match[1].toLowerCase()} ${route}`);
    }
  }

  return operations;
}

function contractOperations(spec) {
  const operations = new Set();

  for (const [route, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of Object.keys(pathItem)) {
      if (HTTP_METHODS.has(method)) {
        operations.add(`${method} ${route}`);
      }
    }
  }

  return operations;
}

function resolveLocalRef(spec, ref) {
  if (!ref.startsWith("#/")) {
    fail(`external reference is not permitted: ${ref}`);
  }

  return ref
    .slice(2)
    .split("/")
    .map((segment) => segment.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((value, segment) => value?.[segment], spec);
}

function validateReferences(spec) {
  const visit = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) visit(item);
      return;
    }

    if (!value || typeof value !== "object") return;

    if (typeof value.$ref === "string" && resolveLocalRef(spec, value.$ref) === undefined) {
      fail(`unresolved local reference: ${value.$ref}`);
    }

    for (const child of Object.values(value)) visit(child);
  };

  visit(spec);
}

function parameterDefinitions(pathItem, operation) {
  return [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])];
}

function validateOperationMetadata(spec) {
  const operationIds = new Set();

  for (const [route, pathItem] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method)) continue;

      if (!operation.operationId || typeof operation.operationId !== "string") {
        fail(`${method.toUpperCase()} ${route} is missing operationId`);
      }
      if (operationIds.has(operation.operationId)) {
        fail(`duplicate operationId: ${operation.operationId}`);
      }
      operationIds.add(operation.operationId);

      if (!operation.summary || typeof operation.summary !== "string") {
        fail(`${method.toUpperCase()} ${route} is missing summary`);
      }
      if (!operation.responses || Object.keys(operation.responses).length === 0) {
        fail(`${method.toUpperCase()} ${route} has no responses`);
      }

      const routeParameters = [...route.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
      const definitions = parameterDefinitions(pathItem, operation);
      for (const parameterName of routeParameters) {
        const definition = definitions.find(
          (parameter) => parameter?.name === parameterName && parameter?.in === "path" && parameter?.required === true,
        );
        if (!definition) {
          fail(`${method.toUpperCase()} ${route} does not define required path parameter ${parameterName}`);
        }
      }

      if (route !== "/api/health") {
        const hasActorSecurity = (operation.security ?? []).some((entry) =>
          Object.prototype.hasOwnProperty.call(entry, "ActorContext"),
        );
        if (!hasActorSecurity) {
          fail(`${method.toUpperCase()} ${route} is missing ActorContext security`);
        }
        if (!operation.responses["401"] || !operation.responses["500"]) {
          fail(`${method.toUpperCase()} ${route} must document 401 and 500 responses`);
        }
      }
    }
  }
}

const spec = JSON.parse(await readFile(contractPath, "utf8"));

if (spec.openapi !== "3.1.0") fail(`expected OpenAPI 3.1.0, found ${spec.openapi ?? "missing"}`);
if (!spec.info?.title || !spec.info?.version) fail("info.title and info.version are required");
if (!spec.paths || typeof spec.paths !== "object") fail("paths object is required");
if (!spec.components?.securitySchemes?.ActorContext) fail("ActorContext security scheme is required");

validateReferences(spec);
validateOperationMetadata(spec);

const routeFiles = await Promise.all(
  (await walk(apiRoot))
    .filter((file) => path.basename(file) === "route.ts")
    .map(async (file) => ({ file, source: await readFile(file, "utf8") })),
);

const implemented = implementedOperations(routeFiles);
const contracted = contractOperations(spec);

const missingFromContract = [...implemented].filter((operation) => !contracted.has(operation)).sort();
const missingFromImplementation = [...contracted].filter((operation) => !implemented.has(operation)).sort();

if (missingFromContract.length > 0) {
  fail(`implemented operations missing from contract: ${missingFromContract.join(", ")}`);
}
if (missingFromImplementation.length > 0) {
  fail(`contracted operations missing from implementation: ${missingFromImplementation.join(", ")}`);
}

console.log(`OpenAPI contract validated: ${contracted.size} operations across ${Object.keys(spec.paths).length} paths.`);
