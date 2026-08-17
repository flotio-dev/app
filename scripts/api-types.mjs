#!/usr/bin/env node
/**
 * Flotio frontend API type generation pipeline (contract specs/frontend-api-contract.md §3).
 *
 * Steps (run from app/, via `pnpm api:types`):
 *   1. Verify the authoritative backend spec exists; mkdir openapi/ + .openapi/.
 *   2. Copy ../core-api/docs/api/swagger.json -> openapi/swagger.json (byte-identical, G1).
 *   3. Convert Swagger 2.0 -> OpenAPI 3.0 with swagger2openapi (G2, gitignored) and
 *      assert the emitted version is 3.0.x.
 *   4. Generate TypeScript types with openapi-typescript -> src/api/generated/schema.d.ts (G3).
 *   5. Print operation/path counts parsed from the OpenAPI 3.0 intermediate (human check).
 *
 * Any step failure exits non-zero (pipeline MUST fail loudly).
 * The pipeline never fetches "latest" at runtime: both tools run from local node_modules.
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_SPEC = join(APP_ROOT, "..", "core-api", "docs", "api", "swagger.json");
const OPENAPI_DIR = join(APP_ROOT, "openapi");
const INTERMEDIATE_DIR = join(APP_ROOT, ".openapi");
const VENDORED_SPEC = join(OPENAPI_DIR, "swagger.json");
const OPENAPI3 = join(INTERMEDIATE_DIR, "openapi3.json");
const GENERATED = join(APP_ROOT, "src", "api", "generated", "schema.d.ts");

const fail = (msg) => {
  console.error(`[api:types] ERROR: ${msg}`);
  process.exit(1);
};

// 1. Verify source + ensure output directories.
if (!existsSync(SOURCE_SPEC)) {
  fail("core-api spec not found — run Phase 1 first (" + SOURCE_SPEC + ")");
}
mkdirSync(OPENAPI_DIR, { recursive: true });
mkdirSync(INTERMEDIATE_DIR, { recursive: true });
mkdirSync(dirname(GENERATED), { recursive: true });

// 2. Vendored copy — byte-identical.
copyFileSync(SOURCE_SPEC, VENDORED_SPEC);
const vendored = readFileSync(VENDORED_SPEC);
const source = readFileSync(SOURCE_SPEC);
if (vendored.length !== source.length) {
  fail(`vendored copy differs in size from source (${vendored.length} vs ${source.length})`);
}

// 3. Swagger 2.0 -> OpenAPI 3.0 (input positional, -o output; JSON inferred from extension).
execFileSync(
  process.execPath,
  [join(APP_ROOT, "node_modules", "swagger2openapi", "swagger2openapi.js"), VENDORED_SPEC, "-o", OPENAPI3],
  { stdio: "inherit" }
);

const openapi3 = JSON.parse(readFileSync(OPENAPI3, "utf8"));
const version = String(openapi3.openapi ?? "");
if (!/^3\.0\./.test(version)) {
  fail(`swagger2openapi emitted openapi "${version}" — expected 3.0.x`);
}

// 4. Generate TS types.
execFileSync(
  process.execPath,
  [join(APP_ROOT, "node_modules", "openapi-typescript", "bin", "cli.js"), OPENAPI3, "-o", GENERATED],
  { stdio: "inherit" }
);

// 5. Print counts parsed from the OpenAPI 3.0 intermediate.
const METHODS = new Set(["get", "post", "put", "delete", "patch", "head", "options", "trace"]);
let opCount = 0;
for (const path of Object.keys(openapi3.paths ?? {})) {
  for (const method of Object.keys(openapi3.paths[path] ?? {})) {
    if (METHODS.has(method)) opCount++;
  }
}
const pathCount = Object.keys(openapi3.paths ?? {}).length;
console.log(`[api:types] ok — ${pathCount} paths / ${opCount} operations (openapi ${version})`);
console.log(`[api:types] artifacts: openapi/swagger.json, src/api/generated/schema.d.ts`);
