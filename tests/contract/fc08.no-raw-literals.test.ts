/**
 * FC-8 — No raw endpoint literals outside the client layer (D2-4).
 *
 * Grep over app/src (excluding src/lib/api/** and src/api/generated/**) finds
 * ZERO `${NEXT_PUBLIC_API_URL}`/`${apiBaseUrl}`-prefixed endpoint strings. The
 * §4.6 frontend-internal routes (/api/auth/session, /api/auth/logout) are not
 * base-prefixed and are permitted; app/src/app/api/auth/logout/route.ts must
 * contain no `${apiBaseUrl}` literal (it uses auth.revokeSession).
 *
 * Red today: ~50 base-prefixed literals remain in components/pages/hooks/context.
 */
import { describe, expect, it } from "vitest";
import { SRC_ROOT, extractEndpointLiterals, listTsFiles } from "./helpers/tsx";

describe("FC-8 no raw literals outside the client", () => {
  const files = listTsFiles(SRC_ROOT, [
    /^lib\/api\//, // client layer — the only place backend literals may live
    /^api\/generated\//, // generated schema — exempt
  ]);
  const literals = extractEndpointLiterals(files);
  const backend = literals.filter((l) => !l.internal);

  it("FC-8a: zero base-prefixed backend endpoint literals outside src/lib/api/**", () => {
    const offenders = backend.map(
      (l) => `${l.method} ${l.rawTemplate} (${l.file})`
    );
    expect(
      offenders,
      `FC-8: ${offenders.length} endpoint literal(s) found outside lib/api — route them through the typed client ` +
        `(§4):\n  ${offenders.join("\n  ")}`
    ).toEqual([]);
  });

  it("FC-8b: app/src/app/api/auth/logout/route.ts contains no ${apiBaseUrl} literal", () => {
    const routeFiles = files.filter((f) =>
      /api[\\/]auth[\\/]logout[\\/]route\.ts$/.test(f)
    );
    expect(routeFiles.length, "logout route handler missing").toBe(1);
    const hits = extractEndpointLiterals(routeFiles).filter(
      (l) => !l.internal && l.rawTemplate.includes("/auth/logout")
    );
    expect(
      hits.map((h) => `${h.file}: ${h.rawTemplate}`),
      "logout/route.ts must call the client's auth.revokeSession(refreshToken) instead of a raw `${apiBaseUrl}` literal (§4.6)"
    ).toEqual([]);
  });
});
