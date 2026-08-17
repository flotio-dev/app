/**
 * FC-12 — Base-URL normalization and configuration error (contract §4.6, FC-12).
 *
 * Required Developer surface (pinned):
 *   createApiClient({ baseUrl, ... }) strips trailing slashes once at
 *   construction; built URLs never contain `//`. A missing/empty baseUrl throws
 *   the typed error "NEXT_PUBLIC_API_URL is not configured" at construction.
 *
 * Red today: @/lib/api/client does not exist.
 */
import { describe, expect, it } from "vitest";
import type { CapturedRequest } from "./helpers/client";
import { jsonResponse, loadClient, makeFetchMock } from "./helpers/client";

type AnyClient = Record<string, any>;

describe("FC-12 base-URL contract", () => {
  it("FC-12a: trailing slashes are stripped — no `//` in built URLs", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const client = createApiClient({
      baseUrl: "http://host:8080///",
      getAccessToken: () => null,
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl: makeFetchMock(() => jsonResponse({}), log),
    }) as AnyClient;

    await client.auth.login("a@b.c", "pw");
    expect(log.length).toBe(1);
    expect(log[0].url).toBe("http://host:8080/auth/login");
    expect(log[0].url.replace(/^[a-z]+:\/\//i, "")).not.toContain("//");
  });

  it("FC-12b: missing/empty NEXT_PUBLIC_API_URL throws the typed configuration error", async () => {
    const { createApiClient } = await loadClient();
    const opts = {
      getAccessToken: () => null,
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl: makeFetchMock(() => jsonResponse({})),
    };

    expect(() => createApiClient({ ...opts, baseUrl: "" })).toThrow(
      "NEXT_PUBLIC_API_URL is not configured"
    );
    expect(() =>
      createApiClient({ ...opts, baseUrl: undefined as unknown as string })
    ).toThrow("NEXT_PUBLIC_API_URL is not configured");
  });
});
