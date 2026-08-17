/**
 * FC-1 — Endpoint-literal resolution (regression guard).
 *
 * Every backend endpoint literal used in app/src must map to an existing spec
 * path with a matching method (specs/frontend-api-contract.md §6 FC-1, matrix §2.2).
 * The only permitted non-backend strings are the §4.6 frontend-internal routes
 * `/api/auth/session` and `/api/auth/logout`.
 *
 * Ground truth: core-api/docs/api/swagger.json (39 paths / 50 ops) — the vendored
 * app/openapi/swagger.json is used when present (FC-7 keeps them byte-identical).
 *
 * Status today: GREEN (regression guard — all 50 literals resolve; BROKEN = 0).
 */
import { describe, expect, it } from "vitest";
import {
  loadAuthoritativeSpec,
  specOperations,
  specPaths,
} from "./helpers/spec";
import {
  SRC_ROOT,
  extractEndpointLiterals,
  listTsFiles,
} from "./helpers/tsx";

const ALLOWED_INTERNAL = new Set(["/api/auth/session", "/api/auth/logout"]);

describe("FC-1 endpoint-literal resolution", () => {
  const spec = loadAuthoritativeSpec();
  const opList = specOperations(spec);
  const paths = specPaths(spec);

  const files = listTsFiles(SRC_ROOT, [
    /^api\/generated\//,
  ]);
  const literals = extractEndpointLiterals(files);

  it("FC-1a: finds endpoint literals to audit (non-empty; 36 typed client methods + internal per §2.4)", () => {
    const backend = literals.filter((l) => !l.internal);
    const internal = literals.filter((l) => l.internal);
    expect(backend.length).toBeGreaterThan(0);
    expect(internal.length).toBeGreaterThanOrEqual(1);
    expect(backend.length).toBeGreaterThanOrEqual(30);
  });

  it("FC-1b: every non-internal literal resolves to a spec path (segment template match)", () => {
    const specSegments = new Map<string, string[]>();
    for (const p of paths) {
      specSegments.set(
        p,
        p.split("/").filter(Boolean).map((seg) => (seg.startsWith("{") ? "*" : seg))
      );
    }
    const unresolved = new Set<string>();
    for (const lit of literals.filter((l) => !l.internal)) {
      const segs = lit.pathTemplate.split("/").filter(Boolean);
      let matched = false;
      for (const [p, psegs] of specSegments) {
        if (segs.length !== psegs.length) continue;
        let ok = true;
        for (let i = 0; i < segs.length; i++) {
          if (segs[i] !== psegs[i] && psegs[i] !== "*") {
            ok = false;
            break;
          }
        }
        if (ok) {
          matched = true;
          break;
        }
      }
      if (!matched) {
        unresolved.add(`${lit.method} ${lit.rawTemplate} (${lit.file})`);
      }
    }
    expect([...unresolved]).toEqual([]);
  });

  it("FC-1c: the resolved method exists on the matched spec path (zero method mismatches)", () => {
    const opsByPath = new Map<string, Set<string>>();
    for (const op of opList) {
      if (!opsByPath.has(op.path)) opsByPath.set(op.path, new Set());
      opsByPath.get(op.path)!.add(op.method);
    }
    const mismatches = new Set<string>();
    for (const lit of literals.filter((l) => !l.internal)) {
      const segs = lit.pathTemplate.split("/").filter(Boolean);
      let matchedPath: string | null = null;
      for (const [p, psegs] of specSegmentsOf(spec)) {
        if (segs.length !== psegs.length) continue;
        let ok = true;
        for (let i = 0; i < segs.length; i++) {
          if (segs[i] !== psegs[i] && psegs[i] !== "*") {
            ok = false;
            break;
          }
        }
        if (ok) {
          matchedPath = p;
          break;
        }
      }
      if (!matchedPath) continue; // covered by FC-1b
      if (!opsByPath.get(matchedPath)!.has(lit.method)) {
        mismatches.add(
          `${lit.method} ${lit.rawTemplate} → spec ${matchedPath} (${lit.file})`
        );
      }
    }
    expect([...mismatches]).toEqual([]);
  });

  it("FC-1d: the only non-backend endpoint strings are the §4.6 internal routes", () => {
    const bad = new Set<string>();
    for (const lit of literals.filter((l) => l.internal)) {
      if (!ALLOWED_INTERNAL.has(lit.pathTemplate)) {
        bad.add(`${lit.pathTemplate} (${lit.file})`);
      }
    }
    expect([...bad]).toEqual([]);
  });

  it("FC-1e: spec inventory sanity — 39 paths / 50 operations (contract §1.1)", () => {
    expect(paths.length).toBe(39);
    expect(opList.length).toBe(50);
  });
});

function specSegmentsOf(spec: ReturnType<typeof loadAuthoritativeSpec>) {
  return specPaths(spec).map((p) => [
    p,
    p.split("/").filter(Boolean).map((seg) => (seg.startsWith("{") ? "*" : seg)),
  ] as const);
}
