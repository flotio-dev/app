"use client";

import React, { useMemo } from "react";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiFolderPlus,
  FiEdit3,
  FiActivity,
} from "react-icons/fi";

type ActivityItem = {
  type: string;
  project: string | null;
  time: string;
  icon: React.ReactNode;
  variant: "success" | "failed" | "running" | "info" | "neutral";
  timestamp: number;
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const LatestActivity: React.FC = () => {
  const { builds, projects } = useDashboardData();

  const activities = useMemo(() => {
    if (projects.length === 0 && builds.length === 0) {
      return [];
    }

    const projectNameMap = new Map<string | number, string>();
    projects.forEach((project) => {
      const id = project.id;
      if (id !== undefined && id !== null) {
        projectNameMap.set(id, project.name ?? "Unknown project");
      }
    });

    const buildItems: ActivityItem[] = builds
      .filter((build) => Boolean(build?.created_at))
      .map((build) => {
        const status = (build.status ?? "unknown").toLowerCase();
        const projectName =
          build.project_id !== undefined
            ? projectNameMap.get(build.project_id) ?? "Unknown project"
            : "Unknown project";
        const timestamp = build.created_at ? new Date(build.created_at).getTime() : 0;

        let icon = <FiActivity className="h-3.5 w-3.5 text-zinc-400" />;
        let variant: ActivityItem["variant"] = "neutral";

        if (status === "success") {
          icon = <FiCheckCircle className="h-3.5 w-3.5 text-emerald-400" />;
          variant = "success";
        } else if (status === "failed") {
          icon = <FiXCircle className="h-3.5 w-3.5 text-rose-400" />;
          variant = "failed";
        } else if (status === "building" || status === "running" || status === "pending") {
          icon = <FiLoader className="h-3.5 w-3.5 text-amber-400 animate-spin" />;
          variant = "running";
        }

        return {
          type: `Build ${status}`,
          project: projectName,
          time: formatDateTime(build.created_at),
          icon,
          variant,
          timestamp,
        };
      });

    const projectCreatedItems: ActivityItem[] = projects
      .filter((project) => Boolean(project?.created_at))
      .map((project) => {
        const timestamp = project.created_at ? new Date(project.created_at).getTime() : 0;
        return {
          type: "Project created",
          project: project.name ?? "Unknown project",
          time: formatDateTime(project.created_at),
          icon: <FiFolderPlus className="h-3.5 w-3.5 text-cyan-400" />,
          variant: "info",
          timestamp,
        };
      });

    const projectUpdatedItems: ActivityItem[] = projects
      .filter((project) => Boolean(project?.updated_at))
      .map((project) => {
        const createdAt = project.created_at ? new Date(project.created_at).getTime() : 0;
        const updatedAt = project.updated_at ? new Date(project.updated_at).getTime() : 0;
        return { project, createdAt, updatedAt };
      })
      .filter((item) => item.updatedAt && item.updatedAt !== item.createdAt)
      .map((item) => ({
        type: "Project updated",
        project: item.project.name ?? "Unknown project",
        time: formatDateTime(item.project.updated_at),
        icon: <FiEdit3 className="h-3.5 w-3.5 text-blue-400" />,
        variant: "info",
        timestamp: item.updatedAt,
      }));

    return [...buildItems, ...projectCreatedItems, ...projectUpdatedItems]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 6);
  }, [builds, projects]);

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FiActivity className="h-4 w-4 text-cyan-400" />
          <CardTitle>Latest Activity</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        {activities.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">No recent activity.</p>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {activities.map((activity, idx) => (
              <div
                key={idx}
                className="py-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-1.5 rounded-md bg-zinc-900 border border-zinc-800 shrink-0">
                    {activity.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-200 capitalize">
                        {activity.type}
                      </span>
                      {activity.project && (
                        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 font-mono truncate max-w-[200px]">
                          {activity.project}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 shrink-0 font-mono">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LatestActivity;
