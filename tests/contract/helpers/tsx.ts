/**
 * Source-scanning helpers for the Phase 2 contract tests (FC-1/FC-5/FC-8/FC-15).
 *
 * These deliberately operate on raw file text (no babel/ts AST dependency) so the
 * red suite runs with nothing but vitest installed.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

export const APP_ROOT = fileURLToPath(new URL("../../..", import.meta.url));
export const SRC_ROOT = fileURLToPath(new URL("../../../src", import.meta.url));

/** Recursively list .ts/.tsx files under root, applying exclusion regexes on relative paths. */
export function listTsFiles(root: string, excludes: RegExp[] = []): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (/\.tsx?$/.test(entry)) {
        const rel = relative(SRC_ROOT, full).replace(/\\/g, "/");
        if (excludes.some((re) => re.test(rel))) continue;
        out.push(full);
      }
    }
  };
  if (statSync(root).isDirectory()) walk(root);
  return out;
}

/**
 * Matches a backend endpoint literal: a `${process.env.NEXT_PUBLIC_API_URL}` or
 * `${apiBaseUrl}` expression inside a template literal (the closing `}` of the
 * expression is part of the match; the `/…` path follows immediately).
 */
const BASE_EXPR_RE =
  /(\$\{(?:process\.env\.)?NEXT_PUBLIC_API_URL\}|\$\{apiBaseUrl\})/g;

/** Bare frontend-internal route literals (§4.6 exceptions). */
const INTERNAL_ROUTE_RE = /["'`](\/api\/auth\/(?:session|logout))["'`]/g;

export interface EndpointLiteral {
  /** path relative to app/ for messages */
  file: string;
  /** normalized path template: `${…}` segments replaced by `*`, query stripped */
  pathTemplate: string;
  /** raw template content (query stripped), e.g. "/project/${projectId}/builds" */
  rawTemplate: string;
  /** query string incl. `?`, or "" */
  query: string;
  /** resolved HTTP method (GET when the call carries no method) */
  method: string;
  /** true for the §4.6 frontend-internal routes */
  internal: boolean;
}

/** String/comment aware helpers. */
function skipString(src: string, i: number): number {
  const quote = src[i];
  let j = i + 1;
  while (j < src.length) {
    if (src[j] === "\\") j += 2;
    else if (src[j] === quote) return j + 1;
    else j++;
  }
  return j;
}

/** From the index of `(`/`{`, returns the index just past the matching closer. */
export function matchingClose(
  src: string,
  openIdx: number,
  open: string,
  close: string
): number {
  let depth = 0;
  let i = openIdx;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipString(src, i);
      continue;
    }
    if (ch === "/" && src[i + 1] === "/") {
      i = src.indexOf("\n", i);
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end < 0 ? src.length : end + 2;
      continue;
    }
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return i + 1;
    }
    i++;
  }
  return -1;
}

/** Find the enclosing `request(`/`fetch(` call span for a literal index. */
function enclosingCall(src: string, literalIdx: number): [number, number] | null {
  const windowStart = Math.max(0, literalIdx - 400);
  const before = src.slice(windowStart, literalIdx);
  const req = before.lastIndexOf("request(");
  const fet = before.lastIndexOf("fetch(");
  const rel = Math.max(req, fet);
  if (rel < 0) return null;
  const callStart = windowStart + rel;
  // index of the '(' — "request(" has the paren at +7, "fetch(" at +5
  const keyword = src.slice(callStart, callStart + 8);
  const openParen = callStart + (keyword.startsWith("request(") ? 7 : 5);
  const close = matchingClose(src, openParen, "(", ")");
  return close < 0 ? null : [callStart, close];
}

/**
 * Extract every endpoint literal used in app/src.
 * Backend literals are base-prefixed template fragments; internal route literals
 * are the bare §4.6 strings. Methods are resolved from the enclosing call when
 * the call spans the literal (default GET).
 */
export function extractEndpointLiterals(files: string[]): EndpointLiteral[] {
  const out: EndpointLiteral[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const rel = relative(APP_ROOT, file).replace(/\\/g, "/");

    BASE_EXPR_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = BASE_EXPR_RE.exec(src))) {
      const after = src.slice(m.index + m[0].length);
      if (!after.startsWith("/")) continue; // base expr without a path
      const tplEnd = after.indexOf("`");
      if (tplEnd < 0) continue;
      const rawTemplate = after.slice(0, tplEnd);
      const queryIdx = rawTemplate.indexOf("?");
      const pathPart =
        queryIdx >= 0 ? rawTemplate.slice(0, queryIdx) : rawTemplate;
      const query = queryIdx >= 0 ? rawTemplate.slice(queryIdx) : "";
      if (!pathPart.startsWith("/")) continue;

      let method = "GET";
      const call = enclosingCall(src, m.index);
      if (call) {
        const span = src.slice(call[0], call[1]);
        const mm = span.match(/method\s*:\s*["']([A-Za-z]+)["']/);
        if (mm) method = mm[1].toUpperCase();
      }
      out.push({
        file: rel,
        pathTemplate: pathPart.replace(/\$\{[^}]*\}/g, "*"),
        rawTemplate: pathPart,
        query,
        method,
        internal: false,
      });
    }

    // Also extract coreRequest endpoints from lib/api/client.ts
    const coreReqRe = /coreRequest<[^>]+>\s*\(\s*state\s*,\s*\{/g;
    let cm: RegExpExecArray | null;
    while ((cm = coreReqRe.exec(src))) {
      const braceIdx = src.indexOf("{", cm.index);
      if (braceIdx < 0) continue;
      const closeIdx = matchingClose(src, braceIdx, "{", "}");
      if (closeIdx < 0) continue;
      const span = src.slice(braceIdx, closeIdx);
      const mm = span.match(/method\s*:\s*["']([A-Za-z]+)["']/);
      const pm = span.match(/path\s*:\s*(?:["']([^"']+)["']|`([^`]+)`)/);
      if (mm && pm) {
        const rawPath = pm[1] ?? pm[2];
        const queryIdx = rawPath.indexOf("?");
        const pathPart = queryIdx >= 0 ? rawPath.slice(0, queryIdx) : rawPath;
        const query = queryIdx >= 0 ? rawPath.slice(queryIdx) : "";
        out.push({
          file: rel,
          pathTemplate: pathPart.replace(/\$\{[^}]*\}/g, "*"),
          rawTemplate: pathPart,
          query,
          method: mm[1].toUpperCase(),
          internal: false,
        });
      }
    }

    INTERNAL_ROUTE_RE.lastIndex = 0;
    let im: RegExpExecArray | null;
    while ((im = INTERNAL_ROUTE_RE.exec(src))) {
      out.push({
        file: rel,
        pathTemplate: im[1],
        rawTemplate: im[1],
        query: "",
        method: "POST",
        internal: true,
      });
    }
  }
  return out;
}

/**
 * Top-level keys of the object/interface block starting at braceStart.
 * String/comment aware; shorthand properties (`name,`) are captured; a token
 * whose preceding significant (non-whitespace) char is `:` is a value and its
 * whole token is skipped.
 */
export function topLevelKeysOfObject(src: string, braceStart: number): string[] {
  const keys: string[] = [];
  let depth = 0;
  let i = braceStart;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      i = skipString(src, i);
      continue;
    }
    if (ch === "/" && src[i + 1] === "/") {
      const end = src.indexOf("\n", i);
      i = end < 0 ? n : end + 1;
      continue;
    }
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) break;
      i++;
      continue;
    }
    if (depth === 1) {
      // Skip VALUE tokens: `key: value,` — the token right after ':' is not a key.
      let j = i - 1;
      while (j > braceStart && /\s/.test(src[j])) j--;
      if (src[j] === ":") {
        const c0 = src[i];
        if (c0 === '"' || c0 === "'" || c0 === "`") {
          i = skipString(src, i);
          continue;
        }
        if (/[A-Za-z_$]/.test(c0)) {
          while (i < n && /[A-Za-z0-9_$]/.test(src[i])) i++;
          continue;
        }
        if (/[0-9]/.test(c0)) {
          while (i < n && /[0-9.eE+-]/.test(src[i])) i++;
          continue;
        }
        i++;
        continue;
      }
      const probe = src.slice(i, Math.min(n, i + 300));
      const km =
        /^\s*(?:"([^"]+)"|([A-Za-z_$][\w$]*))\s*(?::|(?=,|\n|\}))/.exec(probe);
      if (km) {
        keys.push(km[1] ?? km[2]);
        i += km[0].length;
        continue;
      }
    }
    i++;
  }
  return keys;
}

export interface PostProjectBody {
  file: string;
  keys: string[];
  rawTemplate: string;
}

/**
 * Find every POST /project call-site body in the given files and return the
 * top-level body keys (the N-3 / C-2 / C-3 contract check).
 */
export function findPostProjectBodies(files: string[]): PostProjectBody[] {
  const out: PostProjectBody[] = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const rel = relative(APP_ROOT, file).replace(/\\/g, "/");
    BASE_EXPR_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = BASE_EXPR_RE.exec(src))) {
      const after = src.slice(m.index + m[0].length);
      if (!after.startsWith("/")) continue;
      const tplEnd = after.indexOf("`");
      if (tplEnd < 0) continue;
      const rawTemplate = after.slice(0, tplEnd);
      const pathPart = rawTemplate.split("?")[0];
      if (pathPart !== "/project") continue;
      const call = enclosingCall(src, m.index);
      if (!call) continue;
      const span = src.slice(call[0], call[1]);
      if (!/method\s*:\s*["']POST["']/i.test(span)) continue;
      const jsIdx = span.indexOf("JSON.stringify(");
      if (jsIdx < 0) continue;
      const braceIdx = span.indexOf("{", jsIdx);
      if (braceIdx < 0) continue;
      const keys = topLevelKeysOfObject(src, call[0] + braceIdx);
      out.push({ file: rel, keys, rawTemplate: pathPart });
    }

    // Also match typed client calls `projects.create({`
    const clientCreateRe = /projects\.create\s*\(\s*\{/g;
    let ccm: RegExpExecArray | null;
    while ((ccm = clientCreateRe.exec(src))) {
      const braceIdx = src.indexOf("{", ccm.index);
      if (braceIdx >= 0) {
        const keys = topLevelKeysOfObject(src, braceIdx);
        out.push({ file: rel, keys, rawTemplate: "/project" });
      }
    }
  }
  return out;
}

/** Simple multi-pattern grep over the given files; returns {file, line, text} hits. */
export function grepFiles(
  files: string[],
  pattern: RegExp
): Array<{ file: string; line: number; text: string }> {
  const out: Array<{ file: string; line: number; text: string }> = [];
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    const rel = relative(APP_ROOT, file).replace(/\\/g, "/");
    const lines = src.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        pattern.lastIndex = 0;
        out.push({ file: rel, line: idx + 1, text: line.trim() });
      }
    });
    pattern.lastIndex = 0;
  }
  return out;
}
