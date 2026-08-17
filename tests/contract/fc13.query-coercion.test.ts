/**
 * FC-13 — Query coercion: integer params stay integers (contract §5.5, FC-13).
 *
 * Required Developer surface (pinned):
 *   client.envs.list(projectId?: number)        → GET /env?project_id=<int>
 *   client.builds.syncLogs(projectId, buildId, { connectionId: string,
 *     lastLine: number })                       → GET …/logs/sync?connectionId=…&lastLine=<int>
 * The client must build query params from number-typed schema values (no
 * stringified/quoted values).
 *
 * Red today: @/lib/api/client does not exist.
 */
import { describe, expect, it } from "vitest";
import type { CapturedRequest } from "./helpers/client";
import { jsonResponse, loadClient, makeFetchMock } from "./helpers/client";

type AnyClient = Record<string, any>;

describe("FC-13 query coercion", () => {
  it("FC-13a: envs.list(7) requests /env?project_id=7 (integer, not quoted)", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => "tok",
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl: makeFetchMock(() => jsonResponse({ envs: [] }), log),
    }) as AnyClient;

    await client.envs.list(7);
    const url = log[0].url;
    expect(url).toContain("/env");
    expect(url, "project_id must be serialized as the integer 7").toContain("project_id=7");
    expect(url, "project_id must NOT be a quoted string").not.toMatch(/project_id=%22|project_id="|project_id='|project_id=\$\{/);
  });

  it("FC-13b: envs.list() with no argument sends no project_id param", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => "tok",
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl: makeFetchMock(() => jsonResponse({ envs: [] }), log),
    }) as AnyClient;

    await client.envs.list();
    expect(log[0].url).toContain("/env");
    expect(log[0].url).not.toContain("project_id");
  });

  it("FC-13c: builds.syncLogs(1, 2, {connectionId:'abc', lastLine:42}) sends connectionId=abc&lastLine=42", async () => {
    const { createApiClient } = await loadClient();
    const log: CapturedRequest[] = [];
    const client = createApiClient({
      baseUrl: "http://h",
      getAccessToken: () => "tok",
      onTokensRefreshed: () => {},
      onSessionExpired: () => {},
      fetchImpl: makeFetchMock(
        () => jsonResponse({ logs: [], status: "ok", last_line: 42, has_more: false }),
        log
      ),
    }) as AnyClient;

    await client.builds.syncLogs(1, 2, { connectionId: "abc", lastLine: 42 });
    const url = log[0].url;
    expect(url).toContain("/project/1/build/2/logs/sync");
    expect(url).toContain("connectionId=abc");
    expect(url, "lastLine must be serialized as the integer 42").toContain("lastLine=42");
    expect(url).not.toMatch(/lastLine=%22|lastLine="|lastLine='/);
  });
});
