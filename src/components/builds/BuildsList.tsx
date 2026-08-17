"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useBuildRefresh } from "@/context/BuildRefreshContext";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { BuildDTO } from "@/lib/api/types";
import {
  FiPlay,
  FiDownload,
  FiTrash2,
  FiClock,
  FiGitBranch,
  FiGitCommit,
  FiArrowUpRight,
  FiLoader,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

interface BuildsListProps {
  projectId?: string;
}

const BuildsList: React.FC<BuildsListProps> = ({ projectId }) => {
  const router = useRouter();
  const { client } = useApi();
  const { subscribeToRefresh } = useBuildRefresh();

  const [builds, setBuilds] = useState<BuildDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMountedRef = useRef(true);

  const fetchBuilds = useCallback(async () => {
    if (!projectId) {
      setBuilds([]);
      return;
    }

    try {
      const data = await client.builds.list(Number(projectId));
      if (isMountedRef.current) {
        const sorted = (data.builds ?? []).sort(
          (a, b) =>
            new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime()
        );
        setBuilds(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch builds:", error);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, [projectId, client]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchBuilds();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchBuilds]);

  // Subscribe to build refresh events
  useEffect(() => {
    if (!projectId) return;
    const unsubscribe = subscribeToRefresh(projectId, () => {
      fetchBuilds();
    });
    return unsubscribe;
  }, [projectId, subscribeToRefresh, fetchBuilds]);

  // Auto-polling interval
  useEffect(() => {
    if (!projectId) return;
    const intervalId = window.setInterval(() => {
      fetchBuilds();
    }, 8000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [projectId, fetchBuilds]);

  const handleDelete = async (buildId: number) => {
    if (!projectId) return;
    setIsDeleting(true);
    try {
      await client.builds.remove(Number(projectId), buildId);
      setBuilds((prev) => prev.filter((b) => b.id !== buildId));
      setConfirmDeleteId(null);
    } catch (err) {
      console.error("Failed to delete build:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent, buildId: number) => {
    e.stopPropagation();
    if (!projectId) return;
    try {
      const data = await client.builds.download(Number(projectId), buildId);
      if (data.download_url) {
        window.open(data.download_url, "_blank");
      }
    } catch (err) {
      console.error("Failed to download build:", err);
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "success") return <Badge variant="success" dot>Success</Badge>;
    if (s === "failed") return <Badge variant="failed" dot>Failed</Badge>;
    if (["building", "running", "pending"].includes(s))
      return <Badge variant="running" dot>Building</Badge>;
    if (["waiting", "queued"].includes(s))
      return <Badge variant="queued" dot>Queued</Badge>;
    return <Badge variant="neutral">{status || "Unknown"}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-20 rounded-xl border border-zinc-800 bg-zinc-950 p-4 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (builds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
        <FiPlay className="h-10 w-10 text-zinc-600 mb-3" />
        <h3 className="text-sm font-semibold text-zinc-200">No build history</h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          You haven't run any builds for this project yet. Trigger a manual build to test the pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {builds.map((build) => {
        const buildId = build.id;
        const timeAgo = build.created_at
          ? formatDistanceToNow(parseISO(build.created_at), { addSuffix: true })
          : "recently";
        const formattedDate = build.created_at
          ? format(new Date(build.created_at), "MMM d, yyyy HH:mm")
          : "";

        return (
          <div
            key={buildId}
            onClick={() => router.push(`/projects/${projectId}/builds/${buildId}`)}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/50 hover:border-zinc-700 transition-all duration-150 cursor-pointer gap-4"
          >
            {/* Left: Status + Build ID + Commit */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                {build.status?.toLowerCase() === "success" ? (
                  <FiCheckCircle className="h-4 w-4 text-emerald-400" />
                ) : build.status?.toLowerCase() === "failed" ? (
                  <FiXCircle className="h-4 w-4 text-rose-400" />
                ) : (
                  <FiLoader className="h-4 w-4 text-amber-400 animate-spin" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-zinc-100 group-hover:text-cyan-300 transition-colors font-mono">
                    #{buildId}
                  </span>
                  {getStatusBadge(build.status)}
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 uppercase font-mono">
                    {build.build_mode || "release"}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-300">
                    <FiGitBranch className="h-3 w-3 text-zinc-500" />
                    {build.git_branch || "main"}
                  </span>
                  <span className="text-zinc-500 text-[11px]">{formattedDate}</span>
                </div>
              </div>
            </div>

            {/* Right: Duration & Actions */}
            <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
              <div className="text-right hidden md:block">
                <div className="text-xs font-mono text-zinc-300">
                  {build.duration ? `${build.duration}s` : "—"}
                </div>
                <div className="text-[10px] text-zinc-500">{timeAgo}</div>
              </div>

              {build.status?.toLowerCase() === "success" && (
                <Button
                  variant="secondary"
                  size="sm"
                  leftIcon={<FiDownload className="h-3.5 w-3.5" />}
                  onClick={(e) => buildId && handleDownload(e, buildId)}
                >
                  APK
                </Button>
              )}

              <button
                type="button"
                title="Delete Build"
                onClick={(e) => {
                  e.stopPropagation();
                  if (buildId) setConfirmDeleteId(buildId);
                }}
                className="p-2 rounded-md text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete Build Record"
        description="Are you sure you want to permanently delete this build record and its associated logs?"
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
              Delete Record
            </Button>
          </>
        }
      >
        <p className="text-xs text-zinc-400">
          This will remove build artifacts and logs from the history.
        </p>
      </Modal>
    </div>
  );
};

export default BuildsList;
