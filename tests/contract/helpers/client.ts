/**
 * Loaders and fetch-mock utilities for the client unit tests (FC-10…FC-16).
 *
 * The client module (`app/src/lib/api/client.ts` / `types.ts`) does not exist in
 * the red phase, so every import goes through these loaders: the failure is
 * converted into a descriptive assertion error telling the Developer exactly
 * which module/export is missing (per specs/frontend-api-contract.md §4).
 */

export interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  bodyText: string | null;
}

/** Deterministic fake fetch: records every call and serves canned responses. */
export function makeFetchMock(
  handler: (url: string, init: RequestInit) => Response | Promise<Response>,
  log: CapturedRequest[] = []
): typeof fetch {
  return async (input: unknown, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method ?? "GET").toUpperCase();
    const headers: Record<string, string> = {};
    const h = (init?.headers ?? {}) as Record<string, string>;
    for (const k of Object.keys(h)) headers[k.toLowerCase()] = String(h[k]);
    const bodyText =
      typeof init?.body === "string"
        ? init.body
        : init?.body
          ? JSON.stringify(init.body)
          : null;
    log.push({ url, method, headers, bodyText });
    return handler(url, init ?? {});
  };
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function textResponse(body: string, status = 200): Response {
  return new Response(body, { status });
}

/** Import a module, converting resolution failures into a descriptive red reason. */
export async function loadModule(
  spec: string,
  missingHint: string
): Promise<Record<string, unknown>> {
  try {
    return await import(spec);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `Module not implemented yet: ${spec} — ${missingHint} (resolver said: ${msg})`
    );
  }
}

export async function loadClient(): Promise<Record<string, unknown>> {
  return loadModule(
    "@/lib/api/client",
    "Developer must create app/src/lib/api/client.ts exporting createApiClient (contract §4.1/§4.5)."
  );
}

export async function loadTypes(): Promise<Record<string, unknown>> {
  return loadModule(
    "@/lib/api/types",
    "Developer must create app/src/lib/api/types.ts exporting ApiError (contract §4.1/§4.4)."
  );
}
