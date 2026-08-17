/**
 * FC-11 — Auth header injection (contract §4.5, acceptance FC-11).
 *
 * Required Developer surface (pinned):
 *   @/lib/api/client → createApiClient({ baseUrl, getAccessToken,
 *     onTokensRefreshed, onSessionExpired, fetchImpl? }) returning an ApiClient
 *     with families auth / projects / envs / keystores / builds / github / flutter.
 *     Protected ops MUST send `Authorization: Bearer <token>`; the public ops
 *     login/register/refresh/revokeSession MUST NOT.
 *
 * Red today: @/lib/api/client does not exist.
 */
import { describe, expect, it } from "vitest";
import type { CapturedRequest } from "./helpers/client";
import { jsonResponse, loadClient, makeFetchMock } from "./helpers/client";

type AnyClient = Record<string, any>;

const USER = { id: 1, email: "a@b.c", username: "u", created: "2024-01-01" };
const AUTH = { access_token: "at", refresh_token: "rt", expires_in: 3600 };

function mockFor(log: CapturedRequest[]) {
  return makeFetchMock(
    (url) => {
      if (url.endsWith("/auth/@me")) return jsonResponse(USER);
      if (
        url.includes("/auth/login") ||
        url.includes("/auth/register") ||
        url.includes("/auth/refresh")
      ) {
        return jsonResponse(AUTH);
      }
      if (url.endsWith("/project")) return jsonResponse({ projects: [] });
      return jsonResponse({ status: "ok", code: 200, message: "ok" });
    },
    log
  );
}

describe("FC-11 auth header injection", () => {
  it("FC-11a: protected op sends Authorization: Bearer <token>", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => "secret-token",
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl: mockFor(log),
    }) as AnyClient;

    await client.auth.getMe();
    const call = log[log.length - 1];
    expect(call.headers["authorization"], "protected op must send Bearer token").toBe(
      "Bearer secret-token"
    );

    await client.projects.list();
    const call2 = log[log.length - 1];
    expect(call2.headers["authorization"]).toBe("Bearer secret-token");
  });

  it("FC-11b: public ops login/register/refresh/revokeSession send NO Authorization header", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => "secret-token",
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl: mockFor(log),
    }) as AnyClient;

    await client.auth.login("a@b.c", "pw");
    await client.auth.register("a@b.c", "pw", "u");
    await client.auth.refresh();
    await client.auth.revokeSession("rt");

    expect(log.length).toBe(4);
    for (const call of log) {
      expect(
        call.headers["authorization"],
        `public op ${call.method} ${call.url} must not send an Authorization header`
      ).toBeUndefined();
    }
  });

  it("FC-11c: protected ops send the CURRENT token (getAccessToken re-read per request)", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    let token = "first";
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => token,
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl: mockFor(log),
    }) as AnyClient;

    await client.auth.getMe();
    token = "second";
    await client.auth.getMe();
    expect(log[0].headers["authorization"]).toBe("Bearer first");
    expect(log[1].headers["authorization"]).toBe("Bearer second");
  });
});
