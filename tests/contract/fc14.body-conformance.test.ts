/**
 * FC-14 — Mutation bodies serialize exactly the schema field sets (contract §5.6,
 * acceptance FC-14). Object.keys equality against the spec definitions.
 *
 * Required Developer surface (pinned):
 *   client.projects.create({name, config})                    → {name, config}
 *   client.builds.start(projectId, req)                       → {build_mode, build_target, flutter_channel, git_branch, platform}
 *   client.envs.create(req) / client.envs.update(id, req)     → {is_base64, key, path, project_id, type, value}
 *   client.keystores.create(req)                              → {key_alias, key_password, keystore_file, name, store_password}
 *   client.github.postInstallation(id)                        → {installation_id}
 *   client.auth.updateMe(req)                                 → {email, github_id, github_username, username}
 *   client.auth.revokeSession(refreshToken)                   → {refresh_token}
 *
 * Red today: @/lib/api/client does not exist.
 */
import { describe, expect, it } from "vitest";
import type { CapturedRequest } from "./helpers/client";
import { jsonResponse, loadClient, makeFetchMock } from "./helpers/client";
import { definitionFields, loadAuthoritativeSpec } from "./helpers/spec";

type AnyClient = Record<string, any>;

/** Body field sets derived from the swagger definitions themselves. */
function expectedFields(suffix: string): string[] {
  const fields = definitionFields(loadAuthoritativeSpec(), suffix);
  if (!fields) throw new Error(`definition ${suffix} not found in spec`);
  return fields;
}

/** Shape-correct 2xx responses so the client never throws before we inspect the captured body. */
function respondTo(url: string, method: string): Response {
  if (url.endsWith("/auth/@me")) {
    return method === "GET"
      ? jsonResponse({ id: 1, email: "e", username: "u", created: "c" })
      : jsonResponse({ status: "ok" }); // PUT /auth/@me → StatusResponse
  }
  if (url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh")) {
    return jsonResponse({ access_token: "at", refresh_token: "rt", expires_in: 3600 });
  }
  if (url.endsWith("/auth/logout")) return jsonResponse({ status: "ok" });
  if (url.endsWith("/project")) return jsonResponse({ project: { id: 1, name: "p", config: {} } });
  if (url.includes("/build") && method === "POST" && !url.endsWith("/cancel")) {
    return jsonResponse({ build: { id: 1 } });
  }
  if (url.endsWith("/env")) return jsonResponse({ env: { id: 1 } }, 201);
  if (url.endsWith("/keystore")) return jsonResponse({ keystore: { id: 1 } }, 201);
  if (url.endsWith("/github/post-installation")) {
    return jsonResponse({ status: "ok", code: 200, message: "ok", details: { installation_id: 7 } });
  }
  return jsonResponse({ status: "ok", code: 200, message: "ok" });
}

async function createClientFor(log: CapturedRequest[]): Promise<AnyClient> {
  const { createApiClient } = await loadClient();
  return createApiClient({
    baseUrl: "http://h",
    getAccessToken: () => "tok",
    onTokensRefreshed: () => {},
    onSessionExpired: () => {},
    fetchImpl: makeFetchMock((url, init) => respondTo(url, (init?.method ?? "GET").toUpperCase()), log),
  }) as AnyClient;
}

const cases: Array<{ name: string; run: (c: AnyClient) => Promise<unknown>; expected: string[] }> = [
  {
    name: "projects.create",
    run: (c) => c.projects.create({ name: "p", config: { git_repo: "r", project_path: "." } }),
    expected: expectedFields("project_handler.ProjectCreateRequest"),
  },
  {
    name: "builds.start",
    run: (c) =>
      c.builds.start(1, {
        build_mode: "debug",
        build_target: "apk",
        flutter_channel: "stable",
        git_branch: "main",
        platform: "android",
      }),
    expected: expectedFields("build_model.BuildRequest"),
  },
  {
    name: "envs.create",
    run: (c) =>
      c.envs.create({ key: "K", value: "V", type: "string", path: ".", is_base64: false, project_id: 1 }),
    expected: expectedFields("project_handler.EnvCreateRequest"),
  },
  {
    name: "envs.update",
    run: (c) =>
      c.envs.update(5, { key: "K", value: "V", type: "string", path: ".", is_base64: false, project_id: 1 }),
    expected: expectedFields("project_handler.EnvUpdateRequest"),
  },
  {
    name: "keystores.create",
    run: (c) =>
      c.keystores.create({
        name: "n",
        keystore_file: "f",
        store_password: "s",
        key_alias: "a",
        key_password: "p",
      }),
    expected: expectedFields("project_handler.KeystoreCreateRequest"),
  },
  {
    name: "github.postInstallation",
    run: (c) => c.github.postInstallation(7),
    expected: expectedFields("github_model.PostInstallationRequest"),
  },
  {
    name: "auth.updateMe",
    run: (c) => c.auth.updateMe({ username: "u", email: "e", github_id: "g", github_username: "gu" }),
    expected: expectedFields("user_model.UpdateUserRequest"),
  },
  {
    name: "auth.revokeSession",
    run: (c) => c.auth.revokeSession("rt"),
    expected: expectedFields("user_model.RefreshTokenRequest"),
  },
];

describe("FC-14 body conformance", () => {
  it("FC-14 (ground truth): ProjectCreateRequest = {name, config} (schema pin)", () => {
    expect(expectedFields("project_handler.ProjectCreateRequest")).toEqual(["config", "name"]);
  });

  for (const c of cases) {
    it(`FC-14: ${c.name} serializes exactly {${c.expected.join(", ")}}`, async () => {
      const log: CapturedRequest[] = [];
      const client = await createClientFor(log);
      await c.run(client);
      const bodyCall = log[log.length - 1];
      expect(bodyCall.bodyText, `${c.name} sent no JSON body`).not.toBeNull();
      const keys = Object.keys(JSON.parse(bodyCall.bodyText!)).sort();
      expect(
        keys,
        `${c.name} body keys mismatch — no invented top-level keys (§5.6)`
      ).toEqual([...c.expected].sort());
    });
  }
});
