/**
 * FC-16 — Session-persistence sequencing / 401 refresh-retry (contract §4.5,
 * acceptance FC-4 + FC-16). Behavior locked: the existing refresh flow is
 * preserved, not redesigned.
 *
 * Required Developer surface (pinned):
 *   @/lib/api/client exports:
 *     - `createApiClient({ baseUrl, getAccessToken, onTokensRefreshed,
 *       onSessionExpired, fetchImpl? })`
 *     - `refreshAndRetry` — the pure, injectable rotation function (§4.5)
 *   Sequence on a 401 (FC-16):
 *     1. POST {baseUrl}/auth/refresh (cookie-first, no Bearer)
 *     2. POST /api/auth/session (persist rotated refresh token) BEFORE resync
 *     3. GET {baseUrl}/auth/@me resync with the NEW access token
 *     4. retry the original request exactly ONCE with the new token
 *   Refresh failure: onSessionExpired() + POST /api/auth/logout + reject with
 *   ApiError(401, "Session expired") and NO retry.
 *   Single-flight: concurrent 401s share ONE refresh.
 *
 * Red today: @/lib/api/client does not exist.
 */
import { describe, expect, it } from "vitest";
import type { CapturedRequest } from "./helpers/client";
import { jsonResponse, loadClient, makeFetchMock } from "./helpers/client";

type AnyClient = Record<string, any>;

const USER = { id: 1, email: "a@b.c", username: "u", created: "2024-01-01" };

interface FluentClient {
  client: AnyClient;
  log: CapturedRequest[];
  refreshCalls: () => number;
}

async function makeClient(
  onRefresh: (url: string, init: RequestInit) => Response | Promise<Response>,
  onMe: (callIndex: number, url: string, init: RequestInit) => Response | Promise<Response>
): Promise<FluentClient> {
  const { createApiClient } = await loadClient();
  const log: CapturedRequest[] = [];
  const meCount = { n: 0 };
  // Token store: onTokensRefreshed rotates the token the adapter hands out.
  let token = "old-token";
  const fetchImpl = makeFetchMock((url, init) => {
    if (url.endsWith("/auth/@me")) {
      meCount.n++;
      return onMe(meCount.n, url, init);
    }
    if (url.endsWith("/auth/refresh")) return onRefresh(url, init);
    if (url.endsWith("/api/auth/session")) return jsonResponse({ ok: true });
    if (url.endsWith("/api/auth/logout")) return jsonResponse({ ok: true });
    return jsonResponse({ status: "ok", code: 200, message: "ok" });
  }, log);
  const client = createApiClient({
    baseUrl: "http://h",
    getAccessToken: () => token,
    onTokensRefreshed: (accessToken: string) => {
      token = accessToken;
    },
    onSessionExpired: () => {},
    fetchImpl,
  }) as AnyClient;
  return {
    client,
    log,
    refreshCalls: () => log.filter((c) => c.url.endsWith("/auth/refresh")).length,
  };
}

describe("FC-16 401 refresh-retry sequencing", () => {
  it("FC-16a: refreshAndRetry is exported from @/lib/api/client (§4.5)", async () => {
    const mod = await loadClient();
    expect(typeof mod.refreshAndRetry, "client.ts must export refreshAndRetry").toBe("function");
  });

  it("FC-16b: 401 → one refresh → session persisted BEFORE @me resync → original retried once with new token", async () => {
    const { client, log, refreshCalls } = await makeClient(
      () => jsonResponse({ access_token: "new-at", refresh_token: "rotated-rt", expires_in: 3600 }),
      (n) =>
        n === 1
          ? jsonResponse({ status: "error", code: 401, message: "unauthorized" }, 401)
          : jsonResponse(USER)
    );

    const result = await client.auth.getMe();

    const meCalls = log.filter((c) => c.url.endsWith("/auth/@me"));
    expect(refreshCalls()).toBe(1);
    expect(meCalls.length, "original + resync + retry = 3 @me calls").toBe(3);

    const iSession = log.findIndex((c) => c.url.endsWith("/api/auth/session"));
    const iRefresh = log.findIndex((c) => c.url.endsWith("/auth/refresh"));
    expect(iRefresh).toBeGreaterThanOrEqual(0);
    expect(iSession, "rotated refresh token must be persisted via POST /api/auth/session").toBeGreaterThan(iRefresh);

    // session persisted BEFORE the @me resync (meCalls[1]) and BEFORE the retry (meCalls[2])
    expect(log.indexOf(meCalls[1])).toBeGreaterThan(iSession);
    expect(log.indexOf(meCalls[2])).toBeGreaterThan(iSession);

    // refresh is a public op: no Authorization header
    expect(log[iRefresh].headers["authorization"]).toBeUndefined();
    // resync and retry carry the NEW access token
    expect(meCalls[1].headers["authorization"]).toBe("Bearer new-at");
    expect(meCalls[2].headers["authorization"]).toBe("Bearer new-at");
    // session body contains the rotated refresh token
    expect(JSON.parse(log[iSession].bodyText ?? "{}")).toMatchObject({
      refresh_token: "rotated-rt",
    });
    // the original request's result is returned to the caller
    expect(result).toMatchObject({ id: 1 });
  });

  it("FC-16c: refresh failure → onSessionExpired, POST /api/auth/logout, reject ApiError(401,'Session expired'), no retry", async () => {
    let expired = 0;
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const fetchImpl = makeFetchMock((url) => {
      if (url.endsWith("/auth/@me"))
        return jsonResponse({ status: "error", code: 401, message: "unauthorized" }, 401);
      if (url.endsWith("/auth/refresh"))
        return jsonResponse({ status: "error", code: 401, message: "unauthorized" }, 401);
      if (url.endsWith("/api/auth/session")) return jsonResponse({ ok: true });
      if (url.endsWith("/api/auth/logout")) return jsonResponse({ ok: true });
      return jsonResponse({});
    }, log);
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => "old-token",
      onTokensRefreshed: () => {},
      onSessionExpired: () => {
        expired++;
      },
      fetchImpl,
    }) as AnyClient;

    const err = await client.auth.getMe().then(
      () => null,
      (e: unknown) => e
    ) as Error & { status?: number };

    expect(expired, "onSessionExpired must fire exactly once").toBe(1);
    expect(err.message).toBe("Session expired");
    expect(err.status).toBe(401);
    const meCalls = log.filter((c) => c.url.endsWith("/auth/@me"));
    expect(meCalls.length, "original request must NOT be retried after refresh failure").toBe(1);
    const logout = log.find((c) => c.url.endsWith("/api/auth/logout"));
    expect(
      logout,
      "refresh failure must fire the internal POST /api/auth/logout (§4.5.4)"
    ).toBeTruthy();
    expect(logout!.method).toBe("POST");
  });

  it("FC-16d: two concurrent 401s trigger exactly ONE refresh (single-flight)", async () => {
    const { client, refreshCalls } = await makeClient(
      () => jsonResponse({ access_token: "new-at", refresh_token: "rotated-rt", expires_in: 3600 }),
      (n) =>
        n <= 2
          ? jsonResponse({ status: "error", code: 401, message: "unauthorized" }, 401)
          : jsonResponse(USER)
    );

    const [a, b] = await Promise.all([client.auth.getMe(), client.auth.getMe()]);
    expect(refreshCalls(), "parallel 401s MUST NOT trigger parallel refreshes").toBe(1);
    expect(a).toMatchObject({ id: 1 });
    expect(b).toMatchObject({ id: 1 });
  });
});
