"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectConfigProvider } from "@/context/ProjectConfigContext";
import ProjectDatas from "@/components/projects/ProjectDatas";
import ProjectGitDatas from "@/components/projects/ProjectGitDatas";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useApi } from "@/hooks/useApi";
import type { BuildDTO } from "@/lib/api/types";
import {
  FiPlay,
  FiDownload,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiSliders,
} from "react-icons/fi";

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { client } = useApi();

  const [latestSuccessBuild, setLatestSuccessBuild] = useState<BuildDTO | null>(null);
  const [latestBuild, setLatestBuild] = useState<BuildDTO | null>(null);
  const [isStartingBuild, setIsStartingBuild] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchBuilds = async () => {
      try {
        const res = await client.builds.list(Number(projectId));
        const builds = res.builds || [];
        if (builds.length > 0) {
          const sorted = [...builds].sort(
            (a, b) =>
              new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime()
          );
          setLatestBuild(sorted[0]);
          const success = sorted.find((b) => b.status?.toLowerCase() === "success");
          if (success) setLatestSuccessBuild(success);
        }
      } catch (err) {
        console.error("Error fetching builds:", err);
      }
    };

    fetchBuilds();
  }, [projectId, client]);

  const handleStartQuickBuild = async () => {
    setIsStartingBuild(true);
    try {
      const res = await client.builds.start(Number(projectId), {
        build_mode: "release",
        git_branch: "main",
        platform: "android",
      });
      const newBuildId = res.build?.id;
      if (newBuildId) {
        router.push(`/projects/${projectId}/builds/${newBuildId}`);
      } else {
        router.push(`/projects/${projectId}/builds`);
      }
    } catch (err) {
      console.error("Failed to start build", err);
      router.push(`/projects/${projectId}/builds`);
    } finally {
      setIsStartingBuild(false);
    }
  };

  const handleDownloadApk = async () => {
    if (!latestSuccessBuild || !projectId) return;
    try {
      const data = await client.builds.download(
        Number(projectId),
        Number(latestSuccessBuild.id)
      );
      if (data.download_url) {
        window.open(data.download_url, "_blank");
      }
    } catch (err) {
      console.error("Failed to download APK", err);
    }
  };

  return (
    <ProjectConfigProvider>
      <AppShell
        projectId={projectId}
        headerActions={
          <div className="flex items-center gap-2">
            {latestSuccessBuild && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<FiDownload className="h-3.5 w-3.5" />}
                onClick={handleDownloadApk}
              >
                Download APK
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              isLoading={isStartingBuild}
              leftIcon={<FiPlay className="h-3.5 w-3.5" />}
              onClick={handleStartQuickBuild}
            >
              Start Build
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Quick Summary Strip */}
          {latestBuild && (
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                  {latestBuild.status?.toLowerCase() === "success" ? (
                    <FiCheckCircle className="h-4 w-4 text-emerald-400" />
                  ) : latestBuild.status?.toLowerCase() === "failed" ? (
                    <FiXCircle className="h-4 w-4 text-rose-400" />
                  ) : (
                    <FiLoader className="h-4 w-4 text-amber-400 animate-spin" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-200">
                      Latest Build #{latestBuild.id}
                    </span>
                    <Badge
                      variant={
                        latestBuild.status?.toLowerCase() === "success"
                          ? "success"
                          : latestBuild.status?.toLowerCase() === "failed"
                          ? "failed"
                          : "running"
                      }
                      size="sm"
                      dot
                    >
                      {latestBuild.status}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Triggered on branch {latestBuild.git_branch || "main"} • Mode:{" "}
                    {latestBuild.build_mode || "release"}
                  </p>
                </div>
              </div>

              <Link href={`/projects/${projectId}/builds`}>
                <Button variant="ghost" size="sm">
                  View all builds →
                </Button>
              </Link>
            </div>
          )}

          {/* Project Details Form Card */}
          <ProjectDatas />

          {/* Project Git & Auth Form Card */}
          <ProjectGitDatas />
        </div>
      </AppShell>
    </ProjectConfigProvider>
  );
}
