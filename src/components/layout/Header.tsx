"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useCliModal } from "@/context/CliModalContext";
import { FiChevronRight, FiTerminal, FiPlus, FiCheckCircle } from "react-icons/fi";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  customBreadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export function Header({ customBreadcrumbs, actions }: HeaderProps) {
  const pathname = usePathname();
  const { client } = useApi();
  const { openCli, setProjectId } = useCliModal();
  const [projectName, setProjectName] = useState<string>("");

  // Extract project id
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectMatch ? projectMatch[1] : null;

  // Extract build id
  const buildMatch = pathname.match(/\/builds\/([^/]+)/);
  const buildId = buildMatch ? buildMatch[1] : null;

  const isConfiguration = pathname.includes("/configuration");
  const isBuilds = pathname.includes("/builds");

  useEffect(() => {
    if (projectId) {
      let mounted = true;
      const fetchProject = async () => {
        try {
          const res = await client.projects.get(Number(projectId));
          if (mounted && res.project?.name) {
            setProjectName(res.project.name);
          }
        } catch {
          // ignore
        }
      };
      fetchProject();
      return () => {
        mounted = false;
      };
    }
  }, [projectId, client]);

  // Default breadcrumb builder
  const buildBreadcrumbs = () => {
    if (customBreadcrumbs) return customBreadcrumbs;

    const crumbs: Array<{ label: string; href?: string }> = [
      { label: "Flotio", href: "/dashboard" },
    ];

    if (pathname.startsWith("/projects") || projectId) {
      crumbs.push({ label: "Projects", href: "/projects" });

      if (projectId) {
        crumbs.push({
          label: projectName || `Project #${projectId}`,
          href: `/projects/${projectId}`,
        });

        if (isBuilds && buildId) {
          crumbs.push({
            label: "Builds",
            href: `/projects/${projectId}/builds`,
          });
          crumbs.push({
            label: `Build #${buildId}`,
          });
        } else if (isBuilds) {
          crumbs.push({
            label: "Builds",
          });
        } else if (isConfiguration) {
          crumbs.push({
            label: "Configuration",
          });
        }
      }
    } else if (pathname.startsWith("/preferences")) {
      crumbs.push({ label: "Preferences" });
    } else if (pathname.startsWith("/new-project")) {
      crumbs.push({ label: "New Project" });
    } else {
      crumbs.push({ label: "Dashboard" });
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <header className="h-16 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-400">
        {breadcrumbs.map((crumb, idx) => {
          const isLast = idx === breadcrumbs.length - 1;
          return (
            <React.Fragment key={crumb.label + idx}>
              {idx > 0 && <FiChevronRight className="h-3 w-3 text-zinc-600 shrink-0" />}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="hover:text-zinc-200 transition-colors font-medium hover:underline underline-offset-4"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? "font-semibold text-zinc-100" : ""}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Global CLI Quick Button */}
        <button
          type="button"
          onClick={() => {
            if (projectId) setProjectId(projectId);
            openCli();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all cursor-pointer shadow-xs"
        >
          <FiTerminal className="h-3.5 w-3.5 text-cyan-400" />
          <span>CLI</span>
        </button>

        {/* Status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-zinc-500 pl-2 border-l border-zinc-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>API Connected</span>
        </div>
      </div>
    </header>
  );
}
