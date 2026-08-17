/**
 * Ground-truth loader for the Phase 2 contract tests.
 *
 * Source of truth: core-api/docs/api/swagger.json (authoritative backend spec —
 * 39 paths / 50 operations per specs/frontend-api-contract.md). When the Phase 2
 * vendored copy (app/openapi/swagger.json) exists it is used instead (FC-7 keeps
 * them byte-identical), so this loader is stable across red → green.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const CORE_SPEC_URL = new URL(
  "../../../../core-api/docs/api/swagger.json",
  import.meta.url
);
const VENDORED_SPEC_URL = new URL(
  "../../../openapi/swagger.json",
  import.meta.url
);

export interface SpecOperation {
  /** HTTP method, uppercase: GET/POST/PUT/DELETE */
  method: string;
  /** Spec path template, e.g. "/project/{id}/builds" */
  path: string;
  operationId: string;
  /** true when the operation declares a non-empty `security` list */
  protected: boolean;
}

export interface SwaggerDoc {
  paths: Record<
    string,
    Partial<
      Record<
        "get" | "post" | "put" | "delete" | "patch",
        { operationId?: string; security?: unknown[] }
      >
    >
  >;
  definitions: Record<string, { properties?: Record<string, unknown> }>;
}

const HTTP_METHODS = ["get", "post", "put", "delete", "patch"] as const;

function loadSpec(fileUrl: URL): SwaggerDoc {
  const text = readFileSync(fileURLToPath(fileUrl), "utf8");
  return JSON.parse(text) as SwaggerDoc;
}

/** Prefer the vendored copy once Phase 2 artifacts exist; else the backend spec. */
export function loadAuthoritativeSpec(): SwaggerDoc {
  try {
    return loadSpec(VENDORED_SPEC_URL);
  } catch {
    return loadSpec(CORE_SPEC_URL);
  }
}

export function specOperations(
  spec: SwaggerDoc = loadAuthoritativeSpec()
): SpecOperation[] {
  const ops: SpecOperation[] = [];
  for (const [path, methods] of Object.entries(spec.paths)) {
    for (const method of HTTP_METHODS) {
      const op = methods[method];
      if (!op) continue;
      ops.push({
        method: method.toUpperCase(),
        path,
        operationId: op.operationId ?? `${method.toUpperCase()} ${path}`,
        protected: Array.isArray(op.security) && op.security.length > 0,
      });
    }
  }
  return ops.sort((a, b) => a.operationId.localeCompare(b.operationId));
}

export function specPaths(spec: SwaggerDoc = loadAuthoritativeSpec()): string[] {
  return Object.keys(spec.paths).sort();
}

export function specOperationIds(
  spec: SwaggerDoc = loadAuthoritativeSpec()
): string[] {
  return specOperations(spec).map((o) => o.operationId).sort();
}

/** Public (no Authorization header) operationIds per contract §4.5. */
export const PUBLIC_OPERATION_IDS = [
  "LoginHandler",
  "RegisterHandler",
  "RefreshTokenHandler",
  "LogoutHandler",
  "HealthzHandler",
];

/** Field names of a named swagger definition (e.g. ProjectCreateRequest). */
export function definitionFields(
  spec: SwaggerDoc,
  suffix: string
): string[] | null {
  const name = Object.keys(spec.definitions).find((n) => n.endsWith(suffix));
  if (!name) return null;
  const props = spec.definitions[name].properties;
  return props ? Object.keys(props).sort() : [];
}
