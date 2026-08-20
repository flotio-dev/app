"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import BuildDetailsHeader from "@/components/builds/BuildDetailsHeader";
import BuildStepsAndLogs from "@/components/builds/BuildStepsAndLogs";
import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import { parseBuildLogsToSteps } from "@/lib/buildLogParser";
import type { BuildDTO, Project } from "@/lib/api/types";

export default function BuildDetailsPage() {
  const params = useParams();
  const buildId = Array.isArray(params.buildId) ? params.buildId[0] : (params.buildId as string);
  const projectId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { client } = useApi();

  const [build, setBuild] = useState<BuildDTO | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const buildStatusRef = useRef<string | undefined>("");

  useEffect(() => {
    buildStatusRef.current = build?.status;
  }, [build?.status]);

  // Fetch project details
  useEffect(() => {
    if (projectId) {
      const fetchProject = async () => {
        try {
          const projectResp = await client.projects.get(Number(projectId));
          setProject(projectResp.project ?? null);
        } catch (error) {
          console.error("Failed to fetch project:", error);
        }
      };
      fetchProject();
    }
  }, [projectId, client]);

  // Fetch build details
  useEffect(() => {
    if (projectId && buildId) {
      const fetchBuild = async () => {
        try {
          const data = await client.builds.list(Number(projectId));
          const foundBuild = (data.builds ?? []).find(
            (b: BuildDTO) => b.id?.toString() === buildId
          );
          setBuild(foundBuild || null);
        } catch (error) {
          console.error("Failed to fetch build:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBuild();
    }
  }, [projectId, buildId, client]);

  // Fetch and poll logs with sequential loop (no overlapping requests)
  useEffect(() => {
    if (!projectId || !buildId) return;

    let isMounted = true;
    let isPolling = false;
    let pollTimer: NodeJS.Timeout | undefined;
    const connectionId = `web-${Math.random().toString(36).substring(2, 11)}`;
    let currentLastLine = 0;

    const pollLogs = async () => {
      if (!isMounted || isPolling) return;
      isPolling = true;

      try {
        const syncData = await client.builds.syncLogs(
          Number(projectId),
          Number(buildId),
          { connectionId, lastLine: currentLastLine }
        );

        if (!isMounted) return;

        if (syncData.logs && syncData.logs.length > 0) {
          setLogs((prev) => {
            if (currentLastLine === 0) {
              return syncData.logs ?? [];
            }
            return [...prev, ...(syncData.logs ?? [])];
          });
        }

        if (typeof syncData.last_line === "number" && syncData.last_line > currentLastLine) {
          currentLastLine = syncData.last_line;
        } else if (syncData.logs && syncData.logs.length > 0) {
          currentLastLine += syncData.logs.length;
        }

        if (syncData.status) {
          const newStatus = syncData.status;
          setBuild((prev) => {
            if (!prev) return null;
            let resolvedStatus = newStatus;
            if (
              syncData.logs &&
              syncData.logs.length > 0 &&
              prev.status?.toLowerCase() === "pending"
            ) {
              resolvedStatus = "running";
            }
            return resolvedStatus !== prev.status ? { ...prev, status: resolvedStatus } : prev;
          });

          const isTerminal = ["success", "failed", "cancelled", "error", "succeeded"].includes(
            newStatus.toLowerCase()
          );

          if (isTerminal && !syncData.has_more) {
            return; // Build is finished, stop polling
          }
        }
      } catch (err) {
        console.warn("Log polling error:", err);
      } finally {
        isPolling = false;
        if (isMounted) {
          pollTimer = setTimeout(pollLogs, 1500);
        }
      }
    };

    pollLogs();

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [projectId, buildId, client]);

  // Dynamic build steps extracted from logs using core-api STEP markers
  const buildSteps = useMemo(
    () => parseBuildLogsToSteps(logs, build?.status),
    [logs, build?.status]
  );

  if (isLoading) {
    return (
      <AppShell projectId={projectId}>
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-500 font-mono">Loading build stream...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!build) {
    return (
      <AppShell projectId={projectId}>
        <div className="p-12 text-center">
          <h2 className="text-sm font-semibold text-zinc-200">Build not found</h2>
          <p className="text-xs text-zinc-500 mt-1">The requested build record does not exist.</p>
        </div>
      </AppShell>
    );
  }

  const formattedStartTime = build.created_at
    ? format(new Date(build.created_at), "MMM d, yyyy HH:mm:ss")
    : undefined;

  return (
    <AppShell projectId={projectId}>
      <div className="space-y-6">
        <BuildDetailsHeader
          buildId={build.id?.toString() ?? ""}
          status={build.status ?? ""}
          commit="HEAD"
          branch={build.git_branch || "main"}
          message={`Build #${build.id}`}
          startTime={formattedStartTime}
          repoUrl={project?.config?.git_repo}
          apkUrl={build.apk_url}
        />

        <BuildStepsAndLogs steps={buildSteps} logs={logs} />
      </div>
    </AppShell>
  );
}
