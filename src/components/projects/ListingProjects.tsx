"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useApi } from "@/hooks/useApi";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import type { Project } from "@/lib/api/types";

import {
  FiFolder,
  FiGitBranch,
  FiUser,
  FiClock,
  FiTrash2,
  FiPlay,
  FiSliders,
  FiPlus,
  FiMoreVertical,
} from "react-icons/fi";

interface ListingProjectsProps {
  search: string;
}

type ProjectRow = {
  id: number;
  name: string;
  repoUrl: string;
  status: string;
  lastDeployment: string;
  author: string;
  flutterVersion: string;
};

export default function ListingProjects({ search }: ListingProjectsProps) {
  const router = useRouter();
  const { client } = useApi();
  const hasLoadedProjectsRef = useRef(false);
  const isFetchingProjectsRef = useRef(false);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (hasLoadedProjectsRef.current || isFetchingProjectsRef.current) {
      return;
    }

    let isMounted = true;
    isFetchingProjectsRef.current = true;

    const fetchProjects = async () => {
      try {
        const data = await client.projects.list();
        const projectsData = data.projects ?? [];

        // Fetch last build status for each project
        const projectsWithStatus = await Promise.all(
          projectsData.map(async (p: Project) => {
            try {
              const buildsData = await client.builds.list(Number(p.id));
              const builds = buildsData.builds ?? [];
              if (builds.length > 0) {
                const sortedBuilds = [...builds].sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
                return { ...p, status: sortedBuilds[0].status ?? null };
              }
              return { ...p, status: null };
            } catch {
              return { ...p, status: null };
            }
          })
        );

        if (!isMounted) return;

        setProjects(
          projectsWithStatus.map((p): ProjectRow => ({
            id: p.id ?? 0,
            name: p.name ?? "",
            repoUrl: p.config?.git_repo || "",
            status: p.status || "No builds",
            lastDeployment: p.updated_at || "",
            author: p.config?.git_username || "author",
            flutterVersion: p.config?.flutter_version || "3.19.0",
          }))
        );
        hasLoadedProjectsRef.current = true;
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        isFetchingProjectsRef.current = false;
        if (isMounted) setIsLoading(false);
      }
    };

    fetchProjects();
    return () => {
      isMounted = false;
      isFetchingProjectsRef.current = false;
    };
  }, [client]);

  const handleDelete = async (id: number) => {
    setIsDeleting(true);
    try {
      await client.projects.remove(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete project", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.repoUrl.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter === "ALL") return true;
      if (statusFilter === "SUCCESS") return p.status.toLowerCase() === "success";
      if (statusFilter === "FAILED") return p.status.toLowerCase() === "failed";
      if (statusFilter === "RUNNING")
        return ["building", "running", "pending"].includes(p.status.toLowerCase());
      return true;
    });
  }, [projects, search, statusFilter]);

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "success") return <Badge variant="success" dot>Success</Badge>;
    if (s === "failed") return <Badge variant="failed" dot>Failed</Badge>;
    if (["building", "running"].includes(s))
      return <Badge variant="running" dot>Building</Badge>;
    if (["waiting", "pending", "queued"].includes(s))
      return <Badge variant="queued" dot>Queued</Badge>;
    return <Badge variant="neutral">No builds</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Filter and Count Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-400">
            Showing <strong className="text-zinc-200">{filteredProjects.length}</strong>{" "}
            {filteredProjects.length === 1 ? "project" : "projects"}
          </span>
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800 self-start sm:self-auto">
          {[
            { key: "ALL", label: "All" },
            { key: "SUCCESS", label: "Passing" },
            { key: "RUNNING", label: "Building" },
            { key: "FAILED", label: "Failed" },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                statusFilter === tab.key
                  ? "bg-zinc-800 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="h-44 p-5 animate-pulse bg-zinc-900/30">
              <div className="h-4 w-32 bg-zinc-800 rounded mb-3" />
              <div className="h-3 w-48 bg-zinc-800/60 rounded mb-2" />
              <div className="h-3 w-24 bg-zinc-800/40 rounded mt-6" />
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
          <FiFolder className="h-10 w-10 text-zinc-600 mb-3" />
          <h3 className="text-sm font-semibold text-zinc-200">No projects found</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            {search
              ? "No projects match your current search criteria."
              : "Get started by importing a GitHub repository or configuring a new mobile pipeline."}
          </p>
          <Link href="/new-project" className="mt-4">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FiPlus className="h-3.5 w-3.5" />}
            >
              Create New Project
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const timeAgo = project.lastDeployment
              ? formatDistanceToNow(parseISO(project.lastDeployment), { addSuffix: true })
              : "recently";

            return (
              <Card
                key={project.id}
                hoverable
                className="group flex flex-col justify-between p-5 transition-all duration-200"
              >
                <div>
                  {/* Top row: Title + Status */}
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="min-w-0 group-hover:text-cyan-300 transition-colors"
                    >
                      <h3 className="text-base font-semibold text-zinc-100 truncate">
                        {project.name}
                      </h3>
                    </Link>
                    {getStatusBadge(project.status)}
                  </div>

                  {/* Git Repo */}
                  <div className="mt-2.5 space-y-1 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5 truncate font-mono text-[11px] text-zinc-400">
                      <FiGitBranch className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate">
                        {project.repoUrl || "No repository linked"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Meta & Actions */}
                <div className="mt-6 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <FiClock className="h-3 w-3" />
                    <span>{timeAgo}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Link
                      href={`/projects/${project.id}/builds`}
                      title="View Builds"
                      className="p-1.5 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                    >
                      <FiPlay className="h-3.5 w-3.5 text-amber-400" />
                    </Link>
                    <Link
                      href={`/projects/${project.id}/configuration`}
                      title="Configuration"
                      className="p-1.5 rounded-md hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                    >
                      <FiSliders className="h-3.5 w-3.5 text-blue-400" />
                    </Link>
                    <button
                      type="button"
                      title="Delete Project"
                      onClick={() => setConfirmDeleteId(project.id)}
                      className="p-1.5 rounded-md hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer text-zinc-500"
                    >
                      <FiTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Project"
        description="Are you sure you want to permanently delete this project? All builds, configuration, and logs associated with this project will be removed."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDeleteId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={() => confirmDeleteId !== null && handleDelete(confirmDeleteId)}
            >
              Delete Project
            </Button>
          </>
        }
      >
        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 text-xs text-rose-300">
          Warning: This action is destructive and cannot be undone.
        </div>
      </Modal>
    </div>
  );
}
