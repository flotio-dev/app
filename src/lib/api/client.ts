/**
 * Flotio frontend typed API client (contract specs/frontend-api-contract.md §4).
 *
 * Framework-agnostic transport core:
 *  - base URL normalization + typed configuration error (FC-12)
 *  - Bearer injection for protected ops only (FC-11)
 *  - 401 refresh-retry with single-flight rotation (FC-4 / FC-16), re-implemented
 *    as the pure, injectable `refreshAndRetry` exported for unit tests
 *  - typed error normalization on the APIErrorResponse envelope (FC-10)
 *  - envelope unwrapping for the github family (§4.3)
 *
 * This module MUST NOT reference `window`/`location` (unit tests run in Node);
 * the React adapter (`src/hooks/useApi.ts`) owns redirects and auth state.
 */
import type { components } from "@/lib/api/schema";
import {
  ApiError,
  buildQuery,
  unwrapDetails,
} from "./types";
import type {
  ApiClient,
  ApiOperation,
  OperationBody,
  OperationQuery,
  SuccessPayload,
} from "./types";

export interface CreateApiClientOptions {
  baseUrl: string;
  getAccessToken: () => string | null;
  onTokensRefreshed: (accessToken: string, refreshToken?: string) => void | Promise<void>;
  onSessionExpired: () => void;
  fetchImpl?: typeof fetch;
}

export interface RefreshAndRetryOptions {
  baseUrl: string;
  getAccessToken: () => string | null;
  onTokensRefreshed: (accessToken: string, refreshToken?: string) => void | Promise<void>;
  onSessionExpired: () => void;
  fetchImpl: typeof fetch;
  /** Re-issues the original request with the given (rotated) access token. */
  retry: (accessToken: string) => Promise<Response>;
}

/** Frontend-internal routes (contract §4.6) used by the rotation flow. */
const SESSION_ENDPOINT = "/api/auth/session";
const LOGOUT_ENDPOINT = "/api/auth/logout";

/** Backend ops that must never carry an Authorization header (contract §4.5). */
const PUBLIC_PATHS = new Set([
  "/auth/register",
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/healthz",
]);

type ApiErrorResponseBody = components["schemas"]["APIErrorResponse"];

const MAX_MESSAGE_LENGTH = 512;

/** Parse a non-ok Response into a typed ApiError (contract §4.4 / FC-10). */
async function toApiError(res: Response): Promise<ApiError> {
  const status = res.status;
  const text = await res.text().catch(() => "");

  let raw: unknown = null;
  try {
    raw = text ? JSON.parse(text) : null;
  } catch {
    // Non-JSON body: code = status, message = response text.
    return new ApiError(status, status, text.slice(0, MAX_MESSAGE_LENGTH));
  }

  const body = raw as Partial<ApiErrorResponseBody> | null;
  if (
    body &&
    typeof body === "object" &&
    typeof body.code === "number" &&
    typeof body.message === "string"
  ) {
    // Valid APIErrorResponse envelope.
    return new ApiError(status, body.code, body.message, raw);
  }

  // Legacy `{error: "..."}` body (pre-Phase-1 backend): surfaced via message,
  // never parsed as the envelope (code stays = status).
  if (
    body &&
    typeof body === "object" &&
    typeof (body as { error?: unknown }).error === "string"
  ) {
    return new ApiError(status, status, (body as { error: string }).error, raw);
  }

  // JSON that is neither an envelope nor a legacy error: surface a truncated
  // serialization so callers always get a usable message.
  const fallback = typeof raw === "string" ? raw : JSON.stringify(raw);
  return new ApiError(status, status, (fallback ?? `HTTP ${status}`).slice(0, MAX_MESSAGE_LENGTH), raw);
}

interface ClientState {
  baseUrl: string;
  getAccessToken: () => string | null;
  onTokensRefreshed: (accessToken: string, refreshToken?: string) => void | Promise<void>;
  onSessionExpired: () => void;
  fetchImpl: typeof fetch;
}

/**
 * Single-flight gate: concurrent 401s share exactly one in-flight rotation
 * (contract §4.5.5 / FC-16d).
 */
let pendingRefresh: Promise<string> | null = null;

async function handleSessionExpired(
  state: Pick<ClientState, "onSessionExpired" | "fetchImpl">
): Promise<never> {
  state.onSessionExpired();
  try {
    const { fetchImpl } = state;
    await fetchImpl(LOGOUT_ENDPOINT, { method: "POST" });
  } catch {
    // Logout failure must not mask the session-expired error.
  }
  throw new ApiError(401, 401, "Session expired");
}

/**
 * Perform one rotation: refresh → persist rotated refresh token → resync @me →
 * onTokensRefreshed → return the new access token (contract §4.5.3 / FC-16b).
 */
async function rotateOnce(state: ClientState): Promise<string> {
  const { fetchImpl } = state;
  const refreshRes = await fetchImpl(`${state.baseUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!refreshRes.ok) {
    return handleSessionExpired(state);
  }

  let data: { access_token?: unknown; refresh_token?: unknown } = {};
  try {
    data = (await refreshRes.json()) as { access_token?: unknown; refresh_token?: unknown };
  } catch {
    return handleSessionExpired(state);
  }

  const accessToken = typeof data.access_token === "string" ? data.access_token : "";
  if (!accessToken) {
    return handleSessionExpired(state);
  }

  const refreshToken =
    typeof data.refresh_token === "string" ? data.refresh_token : undefined;

  // Persist the rotated refresh token BEFORE the @me resync and BEFORE the retry.
  if (refreshToken) {
    try {
      await fetchImpl(SESSION_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch {
      // Session persistence failure is not fatal for the rotation itself.
    }
  }

  // Re-sync the user with the new access token.
  const meRes = await fetchImpl(`${state.baseUrl}/auth/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!meRes.ok) {
    return handleSessionExpired(state);
  }

  await state.onTokensRefreshed(accessToken, refreshToken);
  return accessToken;
}

/**
 * 401 rotation (contract §4.5, exported for unit tests — FC-4 / FC-16).
 *
 * Sequence: POST {baseUrl}/auth/refresh (cookie-first, no Bearer) → persist the
 * rotated refresh token via POST /api/auth/session → resync GET /auth/@me with
 * the new token → onTokensRefreshed(accessToken, refreshToken) → retry the
 * original request exactly ONCE with the new token. On refresh failure:
 * onSessionExpired() + POST /api/auth/logout + reject ApiError(401,
 * "Session expired") with no retry. Concurrent 401s share one rotation.
 */
export async function refreshAndRetry(options: RefreshAndRetryOptions): Promise<Response> {
  if (!pendingRefresh) {
    const state: ClientState = {
      baseUrl: options.baseUrl,
      getAccessToken: options.getAccessToken,
      onTokensRefreshed: options.onTokensRefreshed,
      onSessionExpired: options.onSessionExpired,
      fetchImpl: options.fetchImpl,
    };
    pendingRefresh = rotateOnce(state).finally(() => {
      pendingRefresh = null;
    });
  }
  const newToken = await pendingRefresh;
  return options.retry(newToken);
}

interface CoreRequestOptions<Op extends ApiOperation> {
  method: "GET" | "POST" | "PUT" | "DELETE";
  /** Path after path-parameter substitution, e.g. `/project/5/builds`. */
  path: string;
  query?: OperationQuery<Op>;
  body?: OperationBody<Op>;
  /** Defaults to true; public ops pass false (FC-11). */
  auth?: boolean;
}

async function coreRequest<Op extends ApiOperation>(
  state: ClientState,
  options: CoreRequestOptions<Op>
): Promise<SuccessPayload<Op>> {
  const { method, path, body } = options;
  const url = `${state.baseUrl}${path}${buildQuery(options.query as Record<string, string | number | boolean | undefined> | undefined)}`;
  const isPublic = PUBLIC_PATHS.has(path);
  const auth = options.auth !== false && !isPublic;

  const { fetchImpl } = state;
  const doFetch = (token: string | null): Promise<Response> => {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth && token) headers["Authorization"] = `Bearer ${token}`;
    return fetchImpl(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
  };

  let res = await doFetch(state.getAccessToken());

  if (res.status === 401 && auth) {
    res = await refreshAndRetry({
      baseUrl: state.baseUrl,
      getAccessToken: state.getAccessToken,
      onTokensRefreshed: state.onTokensRefreshed,
      onSessionExpired: state.onSessionExpired,
      fetchImpl: state.fetchImpl,
      retry: doFetch,
    });
  }

  if (!res.ok) {
    throw await toApiError(res);
  }

  // Success (any 2xx, §5.4): return the typed JSON payload.
  return (await res.json()) as SuccessPayload<Op>;
}

/** Encode a numeric path segment (ids are integers per spec; §4.6). */
function seg(value: number | string): string {
  return encodeURIComponent(String(value));
}

/**
 * Construct the typed ApiClient (contract §4.5 / FC-12).
 *
 * @throws Error("NEXT_PUBLIC_API_URL is not configured") when baseUrl is missing/empty.
 */
export function createApiClient(options: CreateApiClientOptions): ApiClient {
  const { baseUrl, getAccessToken, onTokensRefreshed, onSessionExpired } = options;
  const fetchImpl = options.fetchImpl ?? fetch;

  if (!baseUrl || baseUrl.trim() === "") {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }
  const normalizedBase = baseUrl.replace(/\/+$/, "");

  const state: ClientState = {
    baseUrl: normalizedBase,
    getAccessToken,
    onTokensRefreshed,
    onSessionExpired,
    fetchImpl,
  };

  return {
    auth: {
      login: (email, password) =>
        coreRequest<"LoginHandler">(state, {
          method: "POST",
          path: "/auth/login",
          body: { email, password },
          auth: false,
        }),
      register: (email, password, username) =>
        coreRequest<"RegisterHandler">(state, {
          method: "POST",
          path: "/auth/register",
          body: { email, password, username },
          auth: false,
        }),
      refresh: (refreshToken) =>
        coreRequest<"RefreshTokenHandler">(state, {
          method: "POST",
          path: "/auth/refresh",
          // Cookie-first (A-1): the httpOnly cookie carries the refresh token;
          // an explicit body is optional for token-based flows.
          body: refreshToken !== undefined ? { refresh_token: refreshToken } : undefined,
          auth: false,
        }),
      getMe: () =>
        coreRequest<"MeGetHandler">(state, {
          method: "GET",
          path: "/auth/@me",
        }),
      updateMe: (req) =>
        coreRequest<"MePutHandler">(state, {
          method: "PUT",
          path: "/auth/@me",
          body: req,
        }),
      revokeSession: (refreshToken) =>
        coreRequest<"LogoutHandler">(state, {
          method: "POST",
          path: "/auth/logout",
          body: { refresh_token: refreshToken },
          auth: false,
        }),
    },
    projects: {
      list: () =>
        coreRequest<"ProjectsGetHandler">(state, { method: "GET", path: "/project" }),
      get: (id) =>
        coreRequest<"ProjectGetHandler">(state, { method: "GET", path: `/project/${seg(id)}` }),
      create: (req) =>
        coreRequest<"ProjectCreateHandler">(state, {
          method: "POST",
          path: "/project",
          body: req,
        }),
      update: (id, req) =>
        coreRequest<"ProjectPutHandler">(state, {
          method: "PUT",
          path: `/project/${seg(id)}`,
          body: req,
        }),
      remove: (id) =>
        coreRequest<"ProjectDeleteHandler">(state, { method: "DELETE", path: `/project/${seg(id)}` }),
      getConfig: (id) =>
        coreRequest<"ConfigGetHandler">(state, { method: "GET", path: `/project/${seg(id)}/config` }),
      updateConfig: (id, patch) =>
        coreRequest<"ConfigPostHandler">(state, {
          method: "POST",
          path: `/project/${seg(id)}/config`,
          body: patch,
        }),
      deleteConfig: (id) =>
        coreRequest<"ConfigDeleteHandler">(state, { method: "DELETE", path: `/project/${seg(id)}/config` }),
    },
    envs: {
      list: (projectId) =>
        coreRequest<"EnvGetHandler">(state, {
          method: "GET",
          path: "/env",
          query: projectId !== undefined ? { project_id: projectId } : undefined,
        }),
      create: (req) =>
        coreRequest<"EnvPostHandler">(state, { method: "POST", path: "/env", body: req }),
      update: (envId, req) =>
        coreRequest<"EnvPutByIdHandler">(state, {
          method: "PUT",
          path: `/env/${seg(envId)}`,
          body: req,
        }),
      remove: (envId) =>
        coreRequest<"EnvDeleteByIdHandler">(state, { method: "DELETE", path: `/env/${seg(envId)}` }),
    },
    keystores: {
      list: () =>
        coreRequest<"KeystoreGetHandler">(state, { method: "GET", path: "/keystore" }),
      create: (req) =>
        coreRequest<"KeystorePostHandler">(state, { method: "POST", path: "/keystore", body: req }),
      remove: (keystoreId) =>
        coreRequest<"KeystoreDeleteHandler">(state, { method: "DELETE", path: `/keystore/${seg(keystoreId)}` }),
    },
    googlePlayCredentials: {
      list: () =>
        coreRequest<"GooglePlayCredentialsGetHandler">(state, { method: "GET", path: "/google-play-credentials" }),
      create: (req) =>
        coreRequest<"GooglePlayCredentialsPostHandler">(state, {
          method: "POST",
          path: "/google-play-credentials",
          body: req,
        }),
      remove: (credentialsId) =>
        coreRequest<"GooglePlayCredentialsDeleteHandler">(state, {
          method: "DELETE",
          path: `/google-play-credentials/${seg(credentialsId)}`,
        }),
    },
    builds: {
      list: (projectId) =>
        coreRequest<"BuildsListHandler">(state, { method: "GET", path: `/project/${seg(projectId)}/builds` }),
      start: (projectId, req) =>
        coreRequest<"ProjectBuildHandler">(state, {
          method: "POST",
          path: `/project/${seg(projectId)}/build`,
          body: req,
        }),
      remove: (projectId, buildId) =>
        coreRequest<"BuildDeleteHandler">(state, {
          method: "DELETE",
          path: `/project/${seg(projectId)}/build/${seg(buildId)}`,
        }),
      cancel: (projectId, buildId) =>
        coreRequest<"BuildCancelHandler">(state, {
          method: "PUT",
          path: `/project/${seg(projectId)}/build/${seg(buildId)}/cancel`,
        }),
      logs: (projectId, buildId) =>
        coreRequest<"BuildLogsHandler">(state, {
          method: "GET",
          path: `/project/${seg(projectId)}/build/${seg(buildId)}/logs`,
        }),
      syncLogs: (projectId, buildId, { connectionId, lastLine }) =>
        coreRequest<"BuildLogsSyncHandler">(state, {
          method: "GET",
          path: `/project/${seg(projectId)}/build/${seg(buildId)}/logs/sync`,
          query: { connectionId, lastLine },
        }),
      download: (projectId, buildId) =>
        coreRequest<"BuildDownloadHandler">(state, {
          method: "GET",
          path: `/project/${seg(projectId)}/build/${seg(buildId)}/download`,
        }),
      cachePurge: (projectId, params) =>
        coreRequest<"CachePurgeHandler">(state, {
          method: "DELETE",
          path: `/project/${seg(projectId)}/cache`,
          query: params ?? undefined,
        }),
      cacheMetrics: (projectId, params) =>
        coreRequest<"CacheMetricsHandler">(state, {
          method: "GET",
          path: `/project/${seg(projectId)}/cache/metrics`,
          query: params ?? undefined,
        }),
      cacheEntries: (projectId, params) =>
        coreRequest<"CacheEntriesHandler">(state, {
          method: "GET",
          path: `/project/${seg(projectId)}/cache/entries`,
          query: params,
        }),
    },
    github: {
      repos: async (params?: { installation_id?: number; owner?: string; flutter_only?: boolean }) => {
        const body = await coreRequest<"HandleGithubGetRepositories">(state, {
          method: "GET",
          path: "/github/repos",
          query: params as Record<string, unknown> | undefined,
        });
        return unwrapDetails<GithubRepositoriesPayload>(body);
      },
      checkInstallation: async () => {
        const body = await coreRequest<"HandleGithubCheckInstallation">(state, {
          method: "GET",
          path: "/github/installations",
        });
        return unwrapDetails<GithubInstallationPayload>(body);
      },
      listInstallations: async () => {
        const body = await coreRequest<"HandleGithubCheckInstallation">(state, {
          method: "GET",
          path: "/github/installations",
          query: { all: true },
        });
        return unwrapDetails<{ installations: GithubInstallationPayload[] }>(body) as { installations: GithubInstallationPayload[] };
      },
      postInstallation: async (installationId) => {
        const body = await coreRequest<"HandleGithubPostInstallation">(state, {
          method: "POST",
          path: "/github/post-installation",
          body: { installation_id: installationId },
        });
        return unwrapDetails<PostInstallationPayload>(body);
      },
      disconnect: async (installationId?: number) => {
        const body = await coreRequest<"HandleDisconnectGithub">(state, {
          method: "DELETE",
          path: "/github/disconnect",
          query: installationId ? { installation_id: installationId } : undefined,
        });
        return unwrapDetails<GithubDeletePayload>(body);
      },
      repo: async (params: { owner: string; repo: string }) => {
        const body = await coreRequest<"HandleGithubRepoTree">(state, {
          method: "GET",
          path: "/github/repo",
          query: params,
        });
        return unwrapDetails<GithubTreePayload>(body);
      },
    },
    flutter: {
      versions: () =>
        coreRequest<"VersionsGetHandler">(state, { method: "GET", path: "/flutter/versions" }),
    },
  };
}

/* Envelope payload aliases for the github family (unwrap `details`). */

type GithubRepositoriesEnvelope =
  components["schemas"]["github_com_flotio-dev_core-api_internal_models.APIResponse-github_com_flotio-dev_core-api_internal_modules_github_model_GithubRepositoriesResponse"];
type GithubRepositoriesPayload = NonNullable<GithubRepositoriesEnvelope["details"]>;

type GithubInstallationEnvelope =
  components["schemas"]["github_com_flotio-dev_core-api_internal_models.APIResponse-github_com_flotio-dev_core-api_internal_modules_github_model_GithubInstallationResponse"];
type GithubInstallationPayload = NonNullable<GithubInstallationEnvelope["details"]>;

type PostInstallationEnvelope =
  components["schemas"]["github_com_flotio-dev_core-api_internal_models.APIResponse-github_com_flotio-dev_core-api_internal_modules_github_model_PostInstallationResponse"];
type PostInstallationPayload = NonNullable<PostInstallationEnvelope["details"]>;

type GithubDeleteEnvelope =
  components["schemas"]["github_com_flotio-dev_core-api_internal_models.APIResponse-github_com_flotio-dev_core-api_internal_modules_github_model_DeleteResponse"];
type GithubDeletePayload = NonNullable<GithubDeleteEnvelope["details"]>;

type GithubTreeEnvelope =
  components["schemas"]["github_com_flotio-dev_core-api_internal_models.APIResponse-github_com_flotio-dev_core-api_internal_modules_github_model_GithubTreeResponse"];
type GithubTreePayload = NonNullable<GithubTreeEnvelope["details"]>;
