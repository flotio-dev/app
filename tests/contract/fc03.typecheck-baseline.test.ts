/**
 * FC-3 — Client compiles (typecheck baseline guard).
 *
 * `pnpm exec tsc --noEmit` from app/ must exit 0 with the new client layer and
 * migrated call sites (strict mode on). Baseline today: exit 0.
 *
 * The suite's own test files are excluded from app/tsconfig.json (see tests/
 * contract/README.md) so the red suite cannot break this gate. tsc is invoked
 * directly through node (no shell) with inherited stdio — required by the
 * sandbox's spawn-EPERM boundary.
 */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const APP_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const TSC_BIN = fileURLToPath(
  new URL("../../node_modules/typescript/bin/tsc", import.meta.url)
);

describe("FC-3 typecheck baseline", () => {
  it(
    "FC-3: `tsc --noEmit` exits 0 (strict, from app/)",
    () => {
      let status = -1;
      let error: unknown = null;
      try {
        execFileSync(process.execPath, [TSC_BIN, "--noEmit", "-p", "tsconfig.json"], {
          cwd: APP_ROOT,
          stdio: "inherit",
        });
        status = 0;
      } catch (e) {
        status = (e as { status?: number }).status ?? -1;
        error = e;
      }
      expect(status, `tsc --noEmit exited ${status}${error ? ` — ${String(error)}` : ""}`).toBe(0);
    },
    30000
  );
});
