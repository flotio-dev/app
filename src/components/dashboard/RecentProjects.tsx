"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDistanceToNow, parseISO } from "date-fns";
import { FiFolder, FiArrowUpRight, FiGitBranch, FiUser } from "react-icons/fi";

function RecentProjects() {
  const { projects } = useDashboardData();

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 4);
  }, [projects]);

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FiFolder className="h-4 w-4 text-cyan-400" />
          <CardTitle>Recent Projects</CardTitle>
        </div>
        <Link
          href="/projects"
          className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
        >
          View all
          <FiArrowUpRight className="h-3 w-3" />
        </Link>
      </CardHeader>

      <CardContent className="p-4 pt-3">
        {recentProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-xs text-zinc-500">No projects found.</p>
            <Link
              href="/new-project"
              className="mt-2 text-xs font-medium text-cyan-400 hover:underline"
            >
              Create your first project →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentProjects.map((project) => {
              const projectId = project.id;
              const timeAgo = project.updated_at
                ? formatDistanceToNow(parseISO(project.updated_at), { addSuffix: true })
                : "recently";

              return (
                <Link
                  key={projectId}
                  href={projectId ? `/projects/${projectId}` : "/projects"}
                  className="group flex flex-col justify-between p-4 rounded-lg border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-zinc-700 transition-all duration-150"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                      <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-cyan-300 transition-colors truncate">
                        {project.name}
                      </h4>
                    </div>
                    <Badge variant="neutral" size="sm">
                      {project.config?.flutter_version || "Flutter"}
                    </Badge>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-zinc-400">
                    {project.config?.git_repo && (
                      <div className="flex items-center gap-1.5 truncate text-[11px]">
                        <FiGitBranch className="h-3 w-3 text-zinc-500 shrink-0" />
                        <span className="truncate">{project.config.git_repo}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1 border-t border-zinc-800/40">
                      <span className="flex items-center gap-1">
                        <FiUser className="h-3 w-3" />
                        {project.config?.git_username || "author"}
                      </span>
                      <span>{timeAgo}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentProjects;
