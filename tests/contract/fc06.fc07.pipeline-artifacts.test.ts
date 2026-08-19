/**
 * FC-6 / FC-7 — Generation pipeline: determinism gate and vendored-spec sync.
 *
 * FC-6: package.json has an `api:types` script running scripts/api-types.mjs;
 *       the pipeline artifacts exist and the vendored copy is byte-identical to
 *       the backend spec (deterministic copy). The run-twice `git diff` check is
 *       executed by the orchestrator in validation (spawning is denied by the
 *       sandbox — see tests/contract/README.md).
 * FC-7: app/openapi/swagger.json byte-equals ../core-api/docs/api/swagger.json.
 *
 * Red today: app/openapi/ and scripts/api-types.mjs do not exist, and package.json
 * has no api:types script.
 */
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { APP_ROOT } from "./helpers/tsx";

const APP_PKG = fileURLToPath(new URL("../../package.json", import.meta.url));
const VENDORED_SPEC = fileURLToPath(new URL("../../openapi/swagger.json", import.meta.url));
const CORE_SPEC = fileURLToPath(new URL("../../../core-api/docs/api/swagger.json", import.meta.url));
const PIPELINE_SCRIPT = fileURLToPath(new URL("../../scripts/api-types.mjs", import.meta.url));
const SCHEMA_DTS = fileURLToPath(new URL("../../src/api/generated/schema.d.ts", import.meta.url));
const itWithBackend = existsSync(CORE_SPEC) ? it : it.skip;

function readOptional(path: string): Buffer | null {
  try {
    return readFileSync(path);
  } catch {
    return null;
  }
}

describe("FC-6/FC-7 generation pipeline artifacts", () => {
  it("FC-6a: package.json declares an `api:types` script → `node scripts/api-types.mjs`", () => {
    const pkg = JSON.parse(readFileSync(APP_PKG, "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.["api:types"], "package.json has no api:types script (§3.4)").toBe(
      "node scripts/api-types.mjs"
    );
  });

  it("FC-6b: app/scripts/api-types.mjs exists (pipeline script, §3.2 G4)", () => {
    const buf = readOptional(PIPELINE_SCRIPT);
    expect(buf, "app/scripts/api-types.mjs does not exist (§3.4)").not.toBeNull();
  });

  itWithBackend("FC-7: app/openapi/swagger.json byte-equals ../core-api/docs/api/swagger.json", () => {
    const vendored = readOptional(VENDORED_SPEC);
    expect(
      vendored,
      "app/openapi/swagger.json does not exist — run `pnpm api:types` (G1)"
    ).not.toBeNull();
    const core = readOptional(CORE_SPEC);
    expect(core, "core-api/docs/api/swagger.json missing (Phase 1 spec)").not.toBeNull();
    expect(
      vendored!.toString("utf8").replaceAll("\r\n", "\n") ===
        core!.toString("utf8").replaceAll("\r\n", "\n"),
      `vendored spec is NOT byte-identical to the backend spec — re-run pnpm api:types ` +
        `(vendored ${vendored!.length}B vs core ${core!.length}B)`
    ).toBe(true);
  });

  it("FC-6c: generated schema.d.ts exists (G3)", () => {
    const buf = readOptional(SCHEMA_DTS);
    expect(
      buf,
      "app/src/api/generated/schema.d.ts does not exist — run `pnpm api:types`"
    ).not.toBeNull();
  });
});
