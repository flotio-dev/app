# Phase 2 contract suite — `app/tests/contract/`

Red test suite for `specs/frontend-api-contract.md` (FC-1 … FC-16), owned by the
Tester. The Developer implements until green. Do **not** modify `core-api/`,
`specs/`, or the app's `src/` from here.

## Run

```powershell
cd app
pnpm test            # = vitest run --pool=threads
pnpm exec tsc --noEmit   # FC-3 baseline guard (must stay exit 0)
```

## Layout

| File | Covers |
|---|---|
| `fc01.endpoint-resolution.test.ts` | FC-1 — literal→spec-path resolution (regression guard, green today) |
| `fc02.generated-schema.test.ts` | FC-2 — schema.d.ts covers 50 opIds / 39 paths |
| `fc03.typecheck-baseline.test.ts` | FC-3 — `tsc --noEmit` exit 0 guard |
| `fc05.audit-findings.test.ts` | FC-5 — the four DEPRECATED defects (a)–(d) |
| `fc06.fc07.pipeline-artifacts.test.ts` | FC-6/FC-7 — api:types script, vendored spec byte-sync |
| `fc08.no-raw-literals.test.ts` | FC-8 — zero literals outside `src/lib/api/**` |
| `fc09.no-any.test.ts` | FC-9 — zero `as any` / `: any` / `as unknown as` |
| `fc10.apierror.test.ts` | FC-10 — ApiError envelope (class + normalization) |
| `fc11.auth-header.test.ts` | FC-11 — Bearer only on protected ops |
| `fc12.base-url.test.ts` | FC-12 — trailing-slash strip + typed config error |
| `fc13.query-coercion.test.ts` | FC-13 — `project_id` / `lastLine` sent as integers |
| `fc14.body-conformance.test.ts` | FC-14 — mutation bodies = schema field sets exactly |
| `fc15.call-site-migration.test.ts` | FC-15 — legacy `useApi().request` gone |
| `fc16.refresh-retry.test.ts` | FC-16/FC-4 — refresh-retry sequencing + single-flight |
| `helpers/spec.ts` | ground truth loader (swagger 39 paths / 50 ops) |
| `helpers/tsx.ts` | raw-text scanners (literals, object keys, grep) |
| `helpers/client.ts` | lazy client-module loaders + fetch mock |

## Required Developer surface (pinned export names)

All client imports go through `@/lib/api/...` (alias `@` → `src/`).

- `@/lib/api/client.ts` → `createApiClient(options)` and `refreshAndRetry`
  - `options = { baseUrl, getAccessToken: () => string|null,
    onTokensRefreshed: (accessToken, refreshToken?) => void|Promise<void>,
    onSessionExpired: () => void, fetchImpl?: typeof fetch }`
  - returns `ApiClient` with families `auth, projects, envs, keystores, builds,
    github, flutter` (functions per §4.2).
  - missing/empty `baseUrl` throws `"NEXT_PUBLIC_API_URL is not configured"` at
    construction (FC-12).
- `@/lib/api/types.ts` → `ApiError extends Error`
  - constructor `(status: number, code: number, message: string, raw?: unknown)`
  - `status` = HTTP status (**number** — contract §4.4; the mission brief's
    `status: string` is treated as a typo), `code` = envelope code (falls back to
    status), `message` = envelope message / body text (≤512 chars), `raw?`.
- `@/lib/api/schema.ts` → `export type * from "@/api/generated/schema"`.
- Client module must not hard-reference `window`/`location` (unit tests run in
  Node; the `/auth/login` redirect belongs to the React adapter).

## Notes (Windows sandbox workarounds — do not revert)

- **tsconfig**: `app/tests` is excluded from `app/tsconfig.json` so the red suite
  cannot break the FC-3 tsc baseline. Tests are transpiled by esbuild, not
  type-checked.
- **Config**: `vitest.config.mts` (native ESM) with **zero imports** and
  `resolve.preserveSymlinks: true`. Importing `vitest/config` makes Vite resolve
  through pnpm symlinks, which triggers Vite's Windows realpath shim
  (`optimizeSafeRealPathSync` → `exec("net use")`) — a piped-stdio spawn the
  sandbox denies with EPERM. Zero imports + `preserveSymlinks` avoid that code
  path entirely. `@` alias is built from `process.cwd()` (no imports needed).
- **Pool**: `pnpm test` uses `--pool=threads` — vitest 4's default `forks` pool
  spawns child processes, which the sandbox denies.
- **No spawning**: the suite never spawns `pnpm`/`npx`. FC-3 runs `tsc` via
  `execFileSync(node, [tsc.js])` with `stdio: "inherit"` (piped stdio would EPERM).
  FC-6's run-twice `git diff --exit-code` determinism check is executed by the
  orchestrator in the validation phase.
- `core-api/docs/api/swagger.json` is the authoritative ground truth; once the
  vendored `app/openapi/swagger.json` exists it is used instead (byte-identical
  per FC-7).
