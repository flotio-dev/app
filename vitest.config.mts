/**
 * Phase 2 contract test config (.mts = native ESM — no bundler configLoader).
 *
 * Deliberately ZERO imports: vitest loads this file natively, and importing
 * `vitest/config`/`node:url` would make Vite resolve them through pnpm symlinks,
 * which triggers Vite's Windows realpath shim → `exec("net use")` → piped-stdio
 * spawn → sandbox EPERM. No imports = nothing to resolve at config load.
 *
 * `preserveSymlinks: true` makes Vite skip `safeRealpathSync` (the code path that
 * ran that exec) during module resolution — required under the sandbox.
 *
 * Tests run in the threads pool (set by the `test` script) — the default `forks`
 * pool spawns child processes, which the sandbox denies.
 */
export default {
  resolve: {
    preserveSymlinks: true,
    alias: {
      // `@/*` → `app/src/*` (matches tsconfig paths). process.cwd() is the app
      // dir when invoked via `pnpm test` from app/.
      "@": process.cwd().replace(/\\/g, "/") + "/src",
    },
  },
  test: {
    include: ["tests/contract/**/*.test.ts"],
    environment: "node",
  },
};
