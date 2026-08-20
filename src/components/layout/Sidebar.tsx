"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/auth/AuthContext";
import { useApi, clearLocalSession } from "@/hooks/useApi";
import { useCliModal } from "@/context/CliModalContext";
import type { Project } from "@/lib/api/types";
import FlotioLogo from "@/components/common/FlotioLogo";

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
  FiX,
} from "react-icons/fi";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
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
    onClose?.();
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
    <aside
      className={`fixed left-0 top-0 h-screen w-64 border-r border-border-subtle bg-surface flex flex-col justify-between z-50 select-none transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      } lg:translate-x-0`}
    >
      {/* Top section */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-border-subtle">
          <Link
            href="/dashboard"
            onClick={() => onClose?.()}
            className="flex items-center gap-2.5 group"
          >
            <FlotioLogo size={28} className="shrink-0 group-hover:scale-105 transition-transform" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold tracking-tight text-text-primary text-base">Flotio</span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-surface-elevated border border-border-subtle text-text-muted">
                CI/CD
              </span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer"
            aria-label="Close sidebar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Main Navigation */}
        <div className="p-3 space-y-1">
          {navItems.map((item) => {
            const active = isNavActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose?.()}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-surface-elevated text-text-primary font-semibold shadow-xs border border-border-subtle"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                }`}
              >
                <span className={active ? "text-accent-primary" : "text-text-muted"}>
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
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-text-secondary bg-surface-elevated border border-border-subtle hover:text-text-primary hover:border-border-default hover:bg-surface-hover transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-2">
              <FiTerminal className="h-3.5 w-3.5 text-accent-cyan" />
              <span>Flotio CLI</span>
            </div>
            <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface border border-border-subtle text-text-muted">
              CLI
            </kbd>
          </button>
        </div>

        {/* Divider */}
        <div className="px-3 py-1">
          <div className="h-px bg-border-subtle" />
        </div>

        {/* Recent Projects Section */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-text-muted uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setRecentOpen(!recentOpen)}
              className="flex items-center gap-1.5 hover:text-text-primary transition-colors cursor-pointer"
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
              className="p-1 rounded hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors"
            >
              <FiPlus className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOpen && (
            <div className="space-y-0.5 pt-1">
              {projects.length === 0 ? (
                <div className="px-3 py-2 text-xs text-text-muted">
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
                            ? "bg-surface-elevated text-accent-primary font-medium border border-border-subtle"
                            : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                        }`}
                      >
                        <Link
                          href={`/projects/${pId}`}
                          onClick={() => onClose?.()}
                          className="flex items-center gap-2 min-w-0 flex-1 truncate"
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                              isCurrent ? "bg-accent-primary shadow-[0_0_8px_rgba(139,92,246,0.8)]" : "bg-text-muted"
                            }`}
                          />
                          <span className="truncate">{proj.name}</span>
                        </Link>
                        <button
                          type="button"
                          onClick={(e) => toggleProjectExpand(pId, e)}
                          className="p-0.5 text-text-muted hover:text-text-primary rounded cursor-pointer"
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
                        <div className="pl-6 pr-2 py-0.5 space-y-0.5 text-[11px] border-l border-border-subtle ml-3">
                          <Link
                            href={`/projects/${pId}`}
                            onClick={() => onClose?.()}
                            className={`block py-1 px-2 rounded transition-colors ${
                              pathname === `/projects/${pId}`
                                ? "text-text-primary font-medium bg-surface-elevated"
                                : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                            }`}
                          >
                            Overview
                          </Link>
                          <Link
                            href={`/projects/${pId}/builds`}
                            onClick={() => onClose?.()}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded transition-colors ${
                              pathname.includes(`/projects/${pId}/builds`)
                                ? "text-text-primary font-medium bg-surface-elevated"
                                : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                            }`}
                          >
                            <FiPlay className="h-2.5 w-2.5 text-amber-500" />
                            Builds
                          </Link>
                          <Link
                            href={`/projects/${pId}/configuration`}
                            onClick={() => onClose?.()}
                            className={`flex items-center gap-1.5 py-1 px-2 rounded transition-colors ${
                              pathname.includes(`/projects/${pId}/configuration`)
                                ? "text-text-primary font-medium bg-surface-elevated"
                                : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                            }`}
                          >
                            <FiCode className="h-2.5 w-2.5 text-blue-500" />
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
      <div className="p-3 border-t border-border-subtle bg-surface relative">
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-hover transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#ff5722] to-[#e11d48] border border-border-subtle flex items-center justify-center text-xs font-semibold text-white shrink-0 shadow-xs">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-text-primary truncate">
                {user?.username || "Developer"}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {user?.email || "user@flotio.dev"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-md text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <FiLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

