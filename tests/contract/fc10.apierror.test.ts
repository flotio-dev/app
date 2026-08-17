/**
 * FC-10 — Typed error envelope (contract §4.4, acceptance FC-10).
 *
 * Required Developer surface (pinned):
 *   @/lib/api/types → `class ApiError extends Error`
 *     constructor(status: number, code: number, message: string, raw?: unknown)
 *     fields: status: number (HTTP), code: number (envelope code, falls back to
 *     status), message: string, raw?: unknown
 *   @/lib/api/client → `createApiClient(options)`; a non-2xx response throws
 *     ApiError built from the APIErrorResponse envelope.
 *
 * Red today: @/lib/api/types and @/lib/api/client do not exist.
 */
import { describe, expect, it } from "vitest";
import type { CapturedRequest } from "./helpers/client";
import { jsonResponse, loadClient, loadTypes, makeFetchMock, textResponse } from "./helpers/client";

interface ApiErrorLike extends Error {
  status: number;
  code: number;
  message: string;
  raw?: unknown;
}

describe("FC-10 typed error envelope", () => {
  it("FC-10a: ApiError class shape (status/code/message/raw)", async () => {
    const types = await loadTypes();
    const ApiError = types.ApiError as unknown as new (
      status: number,
      code: number,
      message: string,
      raw?: unknown
    ) => ApiErrorLike;
    expect(typeof ApiError, "ApiError must be a class/constructor").toBe("function");

    const err = new ApiError(404, 1001, "not found");
    expect(err).toBeInstanceOf(Error);
    expect(err.status, "status must be the HTTP status (number)").toBe(404);
    expect(err.code).toBe(1001);
    expect(err.message).toBe("not found");
    expect(err.name).toBe("ApiError");

    const err2 = new ApiError(500, 500, "boom", { error: "boom" });
    expect(err2.raw).toEqual({ error: "boom" });
  });

  it("FC-10b: 404 + valid APIErrorResponse body → ApiError(status=404, code=envelope.code, message=envelope.message)", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const fetchImpl = makeFetchMock(
      (url) =>
        url.endsWith("/auth/@me")
          ? jsonResponse({ status: "error", code: 10404, message: "User not found" }, 404)
          : jsonResponse({}),
      log
    );
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => "tok",
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl,
    }) as { auth: { getMe: () => Promise<unknown> } };

    const err = await client.auth.getMe().then(
      () => null,
      (e: unknown) => e
    ) as ApiErrorLike;
    expect(err).toBeInstanceOf(Error);
    expect(err.status).toBe(404);
    expect(err.code).toBe(10404);
    expect(err.message).toBe("User not found");
  });

  it("FC-10c: non-JSON body → code = status, message = response text", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const fetchImpl = makeFetchMock(
      (url) => (url.endsWith("/auth/@me") ? textResponse("Internal Server Error", 500) : jsonResponse({})),
      log
    );
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => "tok",
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl,
    }) as { auth: { getMe: () => Promise<unknown> } };

    const err = await client.auth.getMe().then(
      () => null,
      (e: unknown) => e
    ) as ApiErrorLike;
    expect(err.status).toBe(500);
    expect(err.code, "non-JSON body: code must fall back to status").toBe(500);
    expect(err.message).toBe("Internal Server Error");
  });

  it("FC-10d: legacy {error: '...'} body is surfaced via message but never parsed as the envelope (code = status)", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const fetchImpl = makeFetchMock(
      (url) => (url.endsWith("/auth/@me") ? jsonResponse({ error: "legacy failure" }, 400) : jsonResponse({})),
      log
    );
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => "tok",
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl,
    }) as { auth: { getMe: () => Promise<unknown> } };

    const err = await client.auth.getMe().then(
      () => null,
      (e: unknown) => e
    ) as ApiErrorLike;
    expect(err.status).toBe(400);
    expect(err.message).toBe("legacy failure");
    expect(err.code, "legacy {error} body must not set code (stays = status)").toBe(400);
  });
});
