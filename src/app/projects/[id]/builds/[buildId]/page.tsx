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

  // Fetch and poll logs
  useEffect(() => {
    if (!build) return;

    let isMounted = true;
    let pollInterval: NodeJS.Timeout;
    const connectionId = Math.random().toString(36).substring(2, 15);

    const fetchLogs = async () => {
      try {
        const data = await client.builds.logs(Number(projectId), Number(buildId));
        if (isMounted) {
          setLogs(data.logs ?? []);

          const isRunning = ["building", "running", "pending"].includes(
            build.status?.toLowerCase() ?? ""
          );

          if (isRunning) {
            let currentLastLine = (data.logs ?? []).length;

            pollInterval = setInterval(async () => {
              if (!isMounted) return;
              try {
                const syncData = await client.builds.syncLogs(
                  Number(projectId),
                  Number(buildId),
                  { connectionId, lastLine: currentLastLine }
                );

                if (syncData.logs && syncData.logs.length > 0) {
                  setLogs((prev) => [...prev, ...(syncData.logs ?? [])]);
                }

                if (typeof syncData.last_line === "number") {
                  currentLastLine = syncData.last_line;
                } else {
                  currentLastLine += syncData.logs?.length || 0;
                }

                if (isMounted) {
                  setBuild((prev) => {
                    if (!prev) return null;
                    let newStatus = prev.status;
                    if (
                      syncData.logs &&
                      syncData.logs.length > 0 &&
                      prev.status?.toLowerCase() === "pending"
                    ) {
                      newStatus = "running";
                    } else if (syncData.status) {
                      newStatus = syncData.status;
                    }
                    return newStatus !== prev.status ? { ...prev, status: newStatus } : prev;
                  });
                }
              } catch {
                // ignore
              }
            }, 2500);
          }
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };

    fetchLogs();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [build?.id, projectId, buildId, client]);

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
