/**
 * Flotio frontend typed-client surface (contract specs/frontend-api-contract.md §4).
 *
 * - `ApiError` — typed error envelope (FC-10).
 * - Schema aliases — short names for the long Go package-qualified generated
 *   component keys; call sites import from `@/lib/api/types` only.
 * - Transport helpers — success-code lookup and operation-derived payload/body
 *   types used by `client.ts`.
 *
 * All response/request shapes originate from `@/api/generated/schema` (the
 * vendored + regenerated OpenAPI types); nothing here duplicates wire shapes.
 */
import type { components, operations } from "@/api/generated/schema";

/* ------------------------------------------------------------------ */
/* ApiError                                                             */
/* ------------------------------------------------------------------ */

/**
 * Thrown for every non-2xx response (contract §4.4 / FC-10).
 * - `status` — HTTP status (number).
 * - `code`   — envelope `code` from APIErrorResponse; falls back to `status`
 *   when the body is not a valid envelope (non-JSON or legacy `{error}`).
 * - `message` — envelope `message`, or the response body text (≤ 512 chars).
 * - `raw`    — the parsed body for debugging; never used to type data.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: number;
  readonly raw?: unknown;

  constructor(status: number, code: number, message: string, raw?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.raw = raw;
  }
}

/* ------------------------------------------------------------------ */
/* Schema aliases (§4.3 — short names for generated component keys)     */
/* ------------------------------------------------------------------ */

type Schema = components["schemas"];

// auth / user
export type AuthResponse = Schema["github_com_flotio-dev_core-api_internal_modules_user_model.AuthResponse"];
export type LoginRequest = Schema["github_com_flotio-dev_core-api_internal_modules_user_model.LoginRequest"];
export type RegisterRequest = Schema["github_com_flotio-dev_core-api_internal_modules_user_model.RegisterRequest"];
export type RefreshTokenRequest = Schema["github_com_flotio-dev_core-api_internal_modules_user_model.RefreshTokenRequest"];
export type StatusResponse = Schema["github_com_flotio-dev_core-api_internal_modules_user_model.StatusResponse"];
export type UpdateUserRequest = Schema["github_com_flotio-dev_core-api_internal_modules_user_model.UpdateUserRequest"];
export type UserResponse = Schema["github_com_flotio-dev_core-api_internal_modules_user_model.UserResponse"];

// projects
export type ProjectConfig = Schema["github_com_flotio-dev_core-api_internal_common_database.ProjectConfig"];
export type Project = Schema["internal_modules_project_handler.Project"];
export type ProjectResponse = Schema["internal_modules_project_handler.ProjectResponse"];
export type ProjectsResponse = Schema["internal_modules_project_handler.ProjectsResponse"];
export type ProjectCreateRequest = Schema["internal_modules_project_handler.ProjectCreateRequest"];
export type ProjectUpdateRequest = Schema["internal_modules_project_handler.ProjectUpdateRequest"];
export type ProjectConfigResponse = Schema["internal_modules_project_handler.ProjectConfigResponse"];

// env
export type EnvDTO = Schema["internal_modules_project_handler.EnvDTO"];
export type EnvCreateRequest = Schema["internal_modules_project_handler.EnvCreateRequest"];
export type EnvUpdateRequest = Schema["internal_modules_project_handler.EnvUpdateRequest"];
export type EnvListResponse = Schema["internal_modules_project_handler.EnvListResponse"];
export type EnvResponse = Schema["internal_modules_project_handler.EnvResponse"];

// keystores
export type KeystoreDTO = Schema["internal_modules_project_handler.KeystoreDTO"];
export type KeystoreCreateRequest = Schema["internal_modules_project_handler.KeystoreCreateRequest"];
export type KeystoreListResponse = Schema["internal_modules_project_handler.KeystoreListResponse"];
export type KeystoreResponse = Schema["internal_modules_project_handler.KeystoreResponse"];

// builds
export type BuildDTO = Schema["github_com_flotio-dev_core-api_internal_modules_build_model.BuildDTO"];
export type BuildRequest = Schema["github_com_flotio-dev_core-api_internal_modules_build_model.BuildRequest"];
export type BuildResponse = Schema["github_com_flotio-dev_core-api_internal_modules_build_model.BuildResponse"];
export type BuildsResponse = Schema["github_com_flotio-dev_core-api_internal_modules_build_model.BuildsResponse"];
export type LogsResponse = Schema["github_com_flotio-dev_core-api_internal_modules_build_model.LogsResponse"];
export type BuildLogsSyncResponse = Schema["internal_modules_build_handler.BuildLogsSyncResponse"];
export type BuildDownloadResponse = Schema["internal_modules_build_handler.BuildDownloadResponse"];
export type CachePurgeResponse = Schema["github_com_flotio-dev_core-api_internal_modules_build_model.CachePurgeResponse"];
export type CacheMetricsResponse = Schema["github_com_flotio-dev_core-api_internal_modules_build_model.CacheMetricsResponse"];
export type CacheEntriesResponse = Schema["github_com_flotio-dev_core-api_internal_modules_build_model.CacheEntriesResponse"];
export type DeleteResponse = Schema["github_com_flotio-dev_core-api_internal_modules_build_model.DeleteResponse"];

// flutter
export type FlutterVersion = Schema["internal_modules_project_handler.FlutterVersion"];
export type FlutterVersionsResponse = Schema["internal_modules_project_handler.FlutterVersionsResponse"];

// github
export type GithubRepository = Schema["github_com_flotio-dev_core-api_internal_modules_github_model.GithubRepository"];
export type GithubRepositoriesResponse =
  Schema["github_com_flotio-dev_core-api_internal_modules_github_model.GithubRepositoriesResponse"];
export type GithubInstallationResponse =
  Schema["github_com_flotio-dev_core-api_internal_modules_github_model.GithubInstallationResponse"];
export type PostInstallationRequest = Schema["github_com_flotio-dev_core-api_internal_modules_github_model.PostInstallationRequest"];
export type PostInstallationResponse =
  Schema["github_com_flotio-dev_core-api_internal_modules_github_model.PostInstallationResponse"];
export type GithubTreeResponse = Schema["github_com_flotio-dev_core-api_internal_modules_github_model.GithubTreeResponse"];
export type GithubRepoTreeItem = Schema["github_com_flotio-dev_core-api_internal_modules_github_model.GithubRepoTreeItem"];

// envelopes
export type APIErrorResponse = Schema["APIErrorResponse"];
export type APIResponse = Schema["APIResponse"];

/* ------------------------------------------------------------------ */
/* Transport helpers (§4.3)                                             */
/* ------------------------------------------------------------------ */

/** All generated operations, keyed by operationId. */
export type ApiOperation = keyof operations;

/** The declared 2xx status of an operation (200, or 201 for POST /env | /keystore). */
export type SuccessStatus<Op extends ApiOperation> = Extract<
  keyof operations[Op]["responses"],
  "200" | "201" | "202" | "204"
>;

/** JSON body of a specific response code (never when the op lacks that code). */
type ResponseBody<Op extends ApiOperation, Code extends string> = Code extends keyof operations[Op]["responses"]
  ? operations[Op]["responses"][Code] extends { content: { "application/json": infer Payload } }
    ? Payload
    : never
  : never;

/** Payload of the operation's 2xx JSON response. */
export type SuccessPayload<Op extends ApiOperation> =
  | ResponseBody<Op, "200">
  | ResponseBody<Op, "201">
  | ResponseBody<Op, "202">
  | ResponseBody<Op, "204">;

/** Request-body payload of the operation (never when the op has no body). */
export type OperationBody<Op extends ApiOperation> =
  operations[Op]["requestBody"] extends { content: { "application/json": infer Body } }
    ? Body
    : never;

/** Query-parameter payload of the operation. */
export type OperationQuery<Op extends ApiOperation> =
  operations[Op]["parameters"]["query"] extends infer Query ? Query : never;

/** Serialize a query object to a `?k=v&…` suffix (integers stay unquoted, FC-13). */
export function buildQuery(
  params?: Record<string, string | number | boolean | undefined> | null
): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : "";
}

/**
 * Guard helper for envelope unwrapping (contract §4.3): returns the `details`
 * payload of an `APIResponse[T]` body, falling back to the bare body when the
 * backend answers without the envelope. Never invents requiredness.
 */
export function unwrapDetails<T>(body: unknown): T {
  if (body && typeof body === "object" && "details" in body) {
    const details = (body as { details?: unknown }).details;
    if (details !== undefined) return details as T;
  }
  return body as T;
}

/* ------------------------------------------------------------------ */
/* ApiClient interface (§4.1 / §4.2)                                    */
/* ------------------------------------------------------------------ */

export interface ApiClient {
  auth: {
    login(email: string, password: string): Promise<AuthResponse>;
    register(email: string, password: string, username: string): Promise<AuthResponse>;
    /** Cookie-first (A-1); an optional RefreshTokenRequest body is accepted for token-based flows. */
    refresh(refreshToken?: string): Promise<AuthResponse>;
    getMe(): Promise<UserResponse>;
    updateMe(req: UpdateUserRequest): Promise<StatusResponse>;
    /** Server-safe (no Bearer) backend logout — used by app/api/auth/logout/route.ts (A-11). */
    revokeSession(refreshToken: string): Promise<StatusResponse>;
  };
  projects: {
    list(): Promise<ProjectsResponse>;
    get(id: number): Promise<ProjectResponse>;
    create(req: ProjectCreateRequest): Promise<ProjectResponse>;
    update(id: number, req: ProjectUpdateRequest): Promise<ProjectResponse>;
    remove(id: number): Promise<DeleteResponse>;
    getConfig(id: number): Promise<ProjectConfigResponse>;
    updateConfig(id: number, patch: Partial<ProjectConfig>): Promise<ProjectConfigResponse>;
    deleteConfig(id: number): Promise<DeleteResponse>;
  };
  envs: {
    /** `project_id` is sent as an integer when provided (FC-13). */
    list(projectId?: number): Promise<EnvListResponse>;
    create(req: EnvCreateRequest): Promise<EnvResponse>;
    update(envId: number, req: EnvUpdateRequest): Promise<EnvResponse>;
    remove(envId: number): Promise<DeleteResponse>;
  };
  keystores: {
    list(): Promise<KeystoreListResponse>;
    create(req: KeystoreCreateRequest): Promise<KeystoreResponse>;
    remove(keystoreId: number): Promise<DeleteResponse>;
  };
  builds: {
    list(projectId: number): Promise<BuildsResponse>;
    start(projectId: number, req: BuildRequest): Promise<BuildResponse>;
    remove(projectId: number, buildId: number): Promise<DeleteResponse>;
    cancel(projectId: number, buildId: number): Promise<BuildResponse>;
    logs(projectId: number, buildId: number): Promise<LogsResponse>;
    /** `lastLine` is sent as an integer (FC-13). */
    syncLogs(
      projectId: number,
      buildId: number,
      params: { connectionId: string; lastLine: number }
    ): Promise<BuildLogsSyncResponse>;
    download(projectId: number, buildId: number): Promise<BuildDownloadResponse>;
    cachePurge(projectId: number, params?: { branch?: string; fingerprint?: string }): Promise<CachePurgeResponse>;
    cacheMetrics(projectId: number, params?: { branch?: string; fingerprint?: string }): Promise<CacheMetricsResponse>;
    cacheEntries(projectId: number, params: { branch: string }): Promise<CacheEntriesResponse>;
  };
  github: {
    /** Enveloped: returns `details.repositories`. */
    repos(): Promise<GithubRepositoriesResponse>;
    /** Enveloped: returns `details` (GithubInstallationResponse). */
    checkInstallation(): Promise<GithubInstallationResponse>;
    /** Enveloped: returns `details` (PostInstallationResponse). */
    postInstallation(installationId: number): Promise<PostInstallationResponse>;
    /** Enveloped: returns `details` (DeleteResponse). */
    disconnect(): Promise<DeleteResponse>;
  };
  flutter: {
    versions(): Promise<FlutterVersionsResponse>;
  };
}
