/**
 * FC-2 — Generated schema completeness.
 *
 * app/src/api/generated/schema.d.ts must exist and its `operations` interface
 * must cover all 50 operationIds of the vendored spec; `paths` must contain
 * exactly 39 path keys (specs/frontend-api-contract.md §3.2/§6 FC-2).
 *
 * Red today: the generated file does not exist (no api:types pipeline yet).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { specOperationIds, specPaths } from "./helpers/spec";
import { topLevelKeysOfObject } from "./helpers/tsx";

const SCHEMA_URL = new URL("../../src/api/generated/schema.d.ts", import.meta.url);
const SCHEMA_PATH = fileURLToPath(SCHEMA_URL);

/** Index of the `{` opening the `export interface <name>` block. */
function blockBrace(text: string, name: string): number {
  const re = new RegExp(`interface\\s+${name}\\s*\\{`);
  const m = re.exec(text);
  if (!m) throw new Error(`schema.d.ts has no \`interface ${name}\` block`);
  return m.index + m[0].length - 1;
}

describe("FC-2 generated schema completeness", () => {
  const opIds = specOperationIds();
  const paths = specPaths();

  it("FC-2a: app/src/api/generated/schema.d.ts exists (run `pnpm api:types`)", () => {
    // readFileSync throws ENOENT → red with a clear reason.
    const text = readFileSync(SCHEMA_PATH, "utf8");
    expect(text.length).toBeGreaterThan(0);
  });

  it("FC-2b: `operations` interface covers all 50 operationIds", () => {
    const text = readFileSync(SCHEMA_PATH, "utf8");
    const missing = opIds.filter(
      (id) => !new RegExp(`\\b${id}\\s*:`).test(text)
    );
    expect(
      missing,
      `operationIds missing from schema.d.ts: ${missing.join(", ")}`
    ).toEqual([]);
  });

  it("FC-2c: `paths` interface contains exactly 39 path keys", () => {
    const text = readFileSync(SCHEMA_PATH, "utf8");
    const keys = topLevelKeysOfObject(text, blockBrace(text, "paths"));
    expect(keys.length, `expected 39 path keys, got ${keys.length}`).toBe(39);
    for (const p of paths) {
      expect(
        keys,
        `path ${p} missing from schema.d.ts paths interface`
      ).toContain(p);
    }
  });

  it("FC-2d: `operations` interface has exactly 50 top-level keys (no dropped/extra ops)", () => {
    const text = readFileSync(SCHEMA_PATH, "utf8");
    const keys = topLevelKeysOfObject(text, blockBrace(text, "operations"));
    expect(keys.length, `expected 50 operation keys, got ${keys.length}`).toBe(50);
  });
});
