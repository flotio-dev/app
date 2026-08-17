/**
 * FC-15 — Call-site migration (rule §4.1).
 *
 * The legacy `useApi().request(url, init)` shape must no longer exist in any
 * component/page; all call sites route through the typed client. Specifically:
 *  - zero `const { request } = useApi()` destructures in app/src (outside lib/api);
 *  - zero `.request(` calls on the hook's return;
 *  - zero `apiBaseUrl` identifier usage outside src/lib/api/** and the reworked
 *    adapter src/hooks/useApi.ts (which constructs the client from the env var).
 *
 * Red today: 21 components/pages destructure `{ request } = useApi()`.
 */
import { describe, expect, it } from "vitest";
import { SRC_ROOT, grepFiles, listTsFiles } from "./helpers/tsx";

const ALL = listTsFiles(SRC_ROOT);

// The reworked React adapter (hooks/useApi.ts) legitimately constructs the
// client from process.env.NEXT_PUBLIC_API_URL — carve it out.
const CALL_SITES = ALL.filter(
  (f) =>
    !/^lib\/api\//.test(f.replace(/\\/g, "/")) &&
    !/hooks[\\/]useApi\.ts$/.test(f)
);

describe("FC-15 call-site migration", () => {
  it("FC-15a: no `const { request } = useApi()` destructures remain in components/pages", () => {
    const hits = grepFiles(CALL_SITES, /const\s*\{\s*request\s*\}\s*=\s*useApi\(\)/);
    expect(
      hits,
      `FC-15: ${hits.length} legacy useApi().request destructure(s) remain — migrate call sites to the ` +
        `typed client functions (§4.2):\n  ${hits.map((h) => `${h.file}:${h.line}`).join("\n  ")}`
    ).toEqual([]);
  });

  it("FC-15b: no `.request(` calls on the hook's return", () => {
    const hits = grepFiles(CALL_SITES, /\.request\(/);
    expect(
      hits.map((h) => `${h.file}:${h.line}`),
      "legacy .request() calls must be removed (§4.1)"
    ).toEqual([]);
  });

  it("FC-15c: no `apiBaseUrl` usage outside src/lib/api/** (and the useApi adapter)", () => {
    const hits = grepFiles(CALL_SITES, /\bapiBaseUrl\b/);
    expect(
      hits,
      `FC-15: ${hits.length} \`apiBaseUrl\` usage(s) outside lib/api — call sites must not construct backend URLs ` +
        `(contract §4.1):\n  ${hits.map((h) => `${h.file}:${h.line}  ${h.text.slice(0, 100)}`).join("\n  ")}`
    ).toEqual([]);
  });
});
