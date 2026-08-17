/**
 * FC-5 — Audit findings resolved (matrix §2.2 DEPRECATED rows).
 *
 * The four Phase 2 defects must be closed in app/src:
 *  (a) N-3/C-2/C-3 — POST /project bodies (NewProjectForm.tsx, CliTerminal.tsx)
 *      carry ONLY {name, config} at top level; git/build fields live in config.
 *  (b) U-1 — ProfileSettings.tsx no longer reads github_id/github_username from
 *      the GET /auth/@me response (UserResponse has no such fields).
 *  (c) P-1 — ListingProjects.tsx reads git fields from project.config, not from
 *      top-level p.git_repo / p.git_username.
 *  (d) P-11 — BuildHeader.tsx does not read data.project?.name from the config
 *      endpoint (ProjectConfigResponse = {config}).
 *
 * Red today: all four defects present.
 */
import { describe, expect, it } from "vitest";
import {
  APP_ROOT,
  SRC_ROOT,
  findPostProjectBodies,
  grepFiles,
  listTsFiles,
} from "./helpers/tsx";

const ALL = listTsFiles(SRC_ROOT);

describe("FC-5 audit findings resolved", () => {
  it("FC-5a: POST /project bodies contain only {name, config} (N-3, C-2, C-3)", () => {
    const files = ALL.filter((f) =>
      /newProject[\\/]NewProjectForm\.tsx$|cli[\\/]CliTerminal\.tsx$/.test(f)
    );
    const bodies = findPostProjectBodies(files);
    expect(bodies.length, "expected POST /project call sites in NewProjectForm/CliTerminal").toBeGreaterThan(0);
    const offenders: string[] = [];
    for (const b of bodies) {
      const extra = b.keys.filter((k) => k !== "name" && k !== "config");
      if (extra.length > 0) {
        offenders.push(
          `${b.file}: POST /project body has out-of-contract top-level keys [${extra.join(", ")}] — ` +
            `ProjectCreateRequest = {name, config} only; git/build fields must live inside config`
        );
      }
    }
    expect(offenders, `DEPRECATED N-3/C-2/C-3 not fixed:\n${offenders.join("\n")}`).toEqual([]);
  });

  it("FC-5b: ProfileSettings.tsx does not read github_id/github_username from GET /auth/@me (U-1)", () => {
    const files = ALL.filter((f) => /preferences[\\/]ProfileSettings\.tsx$/.test(f));
    const hits = grepFiles(files, /data\.github_id\b|data\.github_username\b/);
    expect(
      hits,
      `U-1 not fixed — ProfileSettings.tsx still reads @me response fields absent from UserResponse ` +
        `(${hits.length} hit(s): ${hits.map((h) => `${h.file}:${h.line}`).join(", ")})`
    ).toEqual([]);
  });

  it("FC-5c: ListingProjects.tsx reads git fields from project.config (P-1)", () => {
    const files = ALL.filter((f) => /projects[\\/]ListingProjects\.tsx$/.test(f));
    // dotted access to a top-level git field (p.git_repo / p.git_username) is
    // forbidden; config.git_repo / config?.git_username are the allowed reads.
    const hits = grepFiles(
      files,
      /(?:^|[^.\w])([A-Za-z_$][\w$]*)\.git_(?:repo|username)\b/
    ).filter((h) => !/\.config\.git_/.test(h.text) && !/config\?\.git_/.test(h.text));
    expect(
      hits,
      `P-1 not fixed — ListingProjects.tsx reads top-level git fields (${hits.length} hit(s): ` +
        `${hits.map((h) => `${h.file}:${h.line} ${h.text}`).join(" | ")}) — read p.config?.git_repo / p.config?.git_username`
    ).toEqual([]);
  });

  it("FC-5d: BuildHeader.tsx does not read data.project?.name from the config endpoint (P-11)", () => {
    const files = ALL.filter((f) => /builds[\\/]BuildHeader\.tsx$/.test(f));
    const hits = grepFiles(files, /data\.project\b/);
    expect(
      hits,
      `P-11 not fixed — BuildHeader.tsx still reads data.project?.name (${hits.length} hit(s): ` +
        `${hits.map((h) => `${h.file}:${h.line}`).join(", ")}) — ProjectConfigResponse has no \`project\` key; ` +
        `read data.config?.project_path or call projects.get(id)`
    ).toEqual([]);
  });
});
