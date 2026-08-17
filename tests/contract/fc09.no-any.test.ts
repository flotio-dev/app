/**
 * FC-9 — No `any` on API data (rule §5.2).
 *
 * Grep over app/src (excluding src/api/generated/schema.d.ts and tests) finds
 * zero occurrences of `as any`, `: any` and `as unknown as`. Every API response
 * variable must be typed from the generated schema.
 *
 * Red today: 30 occurrences across 15 files (SideMenu, CliTerminal, …).
 */
import { describe, expect, it } from "vitest";
import { SRC_ROOT, grepFiles, listTsFiles } from "./helpers/tsx";

const ANY_PATTERN = /\bas any\b|\b:\s*any\b|as unknown as/;

describe("FC-9 no any on API data", () => {
  const files = listTsFiles(SRC_ROOT, [/^api\/generated\//]);

  it("FC-9: zero `as any` / `: any` / `as unknown as` in app/src", () => {
    const hits = grepFiles(files, ANY_PATTERN);
    expect(
      hits,
      `FC-9: ${hits.length} \`any\` occurrence(s) in app/src — type API data from the generated schema ` +
        `(contract rule §5.2):\n  ${hits
          .map((h) => `${h.file}:${h.line}  ${h.text.slice(0, 110)}`)
          .join("\n  ")}`
    ).toEqual([]);
  });
});
