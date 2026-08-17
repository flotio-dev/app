"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";
import { useApi, clearLocalSession } from "@/hooks/useApi";
import { useCliModal } from "@/context/CliModalContext";
import type { Project } from "@/lib/api/types";

// Icons
import {
  FiGrid,
  FiFolder,
  FiSliders,
  FiTerminal,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiPlus,
  FiPlay,
  FiCpu,
  FiCode,
} from "react-icons/fi";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  const { client } = useApi();
  const { openCli, setProjectId: setCliProjectId } = useCliModal();

  const [projects, setProjects] = useState<Project[]>([]);
  const [recentOpen, setRecentOpen] = useState(true);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Extract active project id from path
  const projectIdMatch = pathname.match(/\/projects\/([^/]+)/);
  const activeProjectId = projectIdMatch ? projectIdMatch[1] : null;

  // Load projects
  useEffect(() => {
    let mounted = true;
    const fetchProjects = async () => {
      try {
        const res = await client.projects.list();
        if (mounted && res.projects) {
          setProjects(res.projects);
          // Auto-expand current active project in sidebar
          if (activeProjectId) {
            setExpandedProjects((prev) => ({ ...prev, [activeProjectId]: true }));
          }
        }
      } catch (e) {
        // ignore
      }
    };
    fetchProjects();
    return () => {
      mounted = false;
    };
  }, [client, activeProjectId]);

  const handleLogout = async () => {
    try {
      await clearLocalSession();
    } catch {
      // ignore
    }
    clearAuth();
    router.push("/auth/login");
  };

  const navItems = [
    { label: "Overview", href: "/dashboard", icon: <FiGrid className="h-4 w-4" /> },
    { label: "Projects", href: "/projects", icon: <FiFolder className="h-4 w-4" /> },
    { label: "Preferences", href: "/preferences", icon: <FiSliders className="h-4 w-4" /> },
  ];

  const isNavActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    if (href === "/projects") {
      return pathname === "/projects" || pathname.startsWith("/projects/");
    }
    return pathname.startsWith(href);
  };

  const toggleProjectExpand = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedProjects((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "FL";

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-800/80 bg-zinc-950 flex flex-col justify-between z-30 select-none">
      {/* Top section */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-zinc-800/60">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-black font-bold text-sm shadow-md group-hover:opacity-90 transition-opacity">
              F
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold tracking-tight text-zinc-100 text-base">Flotio</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                CI/CD
              </span>
            </div>
          </Link>
        </div>

        {/* Main Navigation */}
        <div className="p-3 space-y-1">
          {navItems.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-800/90 text-white font-semibold shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <span className={active ? "text-cyan-400" : "text-zinc-400"}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* CLI Terminal Launcher */}
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => {
              if (activeProjectId) setCliProjectId(activeProjectId);
              openCli();
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 bg-zinc-900/60 border border-zinc-800/80 hover:text-zinc-200 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <FiTerminal className="h-3.5 w-3.5 text-cyan-400" />
              <span>Flotio CLI</span>
            </div>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
              CLI
            </kbd>
          </button>
        </div>

        {/* Divider */}
        <div className="px-3 py-1">
          <div className="h-px bg-zinc-800/60" />
        </div>

        {/* Recent Projects Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setRecentOpen(!recentOpen)}
              className="flex items-center gap-1.5 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {recentOpen ? (
                <FiChevronDown className="h-3 w-3" />
              ) : (
                <FiChevronRight className="h-3 w-3" />
              )}
              <span>Recent Projects</span>
            </button>
            <Link
              href="/new-project"
              title="New Project"
              className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOpen && (
            <div className="space-y-0.5 pt-1">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-zinc-600">
                  No projects yet.
                </div>
              ) : (
                projects.slice(0, 6).map((proj) => {
                  const pId = String(proj.id);
                  const isCurrent = activeProjectId === pId;
                  const isExpanded = Boolean(expandedProjects[pId]);

                  return (
                    <div key={pId} className="space-y-0.5">
                      <div
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                          isCurrent
                            ? "bg-zinc-900 text-cyan-300 font-medium"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                        }`}
                      >
                        <Link
                          href={`/projects/${pId}`}
                          className="flex items-center gap-2 min-w-0 flex-1 truncate"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              isCurrent ? "bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" : "bg-zinc-600"
                            }`}
                          />
                          <span className="truncate">{proj.name}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => toggleProjectExpand(pId, e)}
                          className="p-0.5 text-zinc-500 hover:text-zinc-300 rounded cursor-pointer"
                        >
                          {isExpanded ? (
                            <FiChevronDown className="h-3 w-3" />
                          ) : (
                            <FiChevronRight className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      {/* Sub-links (Codemagic pattern) */}
                      {isExpanded && (
                        <div className="pl-6 pr-2 py-0.5 space-y-0.5 text-[11px] border-l border-zinc-800/80 ml-3">
                          <Link
                            href={`/projects/${pId}`}
                            className={`block py-1 px-2 rounded transition-colors ${
                              pathname === `/projects/${pId}`
                                ? "text-white font-medium bg-zinc-900"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                            }`}
                          >
                            Overview
                          </Link>
                          <Link
                            href={`/projects/${pId}/builds`}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded transition-colors ${
                              pathname.includes(`/projects/${pId}/builds`)
                                ? "text-white font-medium bg-zinc-900"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                            }`}
                          >
                            <FiPlay className="h-2.5 w-2.5 text-amber-400" />
                            Builds
                          </Link>
                          <Link
                            href={`/projects/${pId}/configuration`}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded transition-colors ${
                              pathname.includes(`/projects/${pId}/configuration`)
                                ? "text-white font-medium bg-zinc-900"
                                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30"
                            }`}
                          >
                            <FiCode className="h-2.5 w-2.5 text-blue-400" />
                            Configuration
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom User Footer */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80 relative">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/60 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-semibold text-zinc-200 shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">
                {user?.username || "Developer"}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">
                {user?.email || "user@flotio.dev"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <FiLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
