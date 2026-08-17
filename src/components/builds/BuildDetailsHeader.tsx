"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  FiPlay,
  FiDownload,
  FiXCircle,
  FiTrash2,
  FiGitBranch,
  FiGitCommit,
  FiClock,
  FiArrowLeft,
  FiExternalLink,
} from "react-icons/fi";

interface BuildDetailsHeaderProps {
  buildId: string;
  status: string;
  commit: string;
  branch: string;
  message: string;
  startTime?: string;
  repoUrl?: string;
  apkUrl?: string | null;
}

const BuildDetailsHeader: React.FC<BuildDetailsHeaderProps> = ({
  buildId,
  status,
  commit,
  branch,
  message,
  startTime,
  repoUrl,
  apkUrl,
}) => {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { client } = useApi();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const isRunning = ["building", "pending", "running"].includes(status.toLowerCase());
  const isSuccess = status.toLowerCase() === "success";

  const handleDownload = async () => {
    if (!projectId || !buildId) return;
    try {
      const data = await client.builds.download(Number(projectId), Number(buildId));
      if (data.download_url) {
        window.open(data.download_url, "_blank");
      }
    } catch (error) {
      console.error("Error downloading build:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectId || !buildId) return;
    setIsDeleting(true);
    try {
      await client.builds.remove(Number(projectId), Number(buildId));
      router.push(`/projects/${projectId}/builds`);
    } catch (error) {
      console.error("Error deleting build:", error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!projectId || !buildId) return;
    setIsCanceling(true);
    try {
      await client.builds.cancel(Number(projectId), Number(buildId));
      window.location.reload();
    } catch (error) {
      console.error("Error canceling build:", error);
    } finally {
      setIsCanceling(false);
      setCancelDialogOpen(false);
    }
  };

  const getStatusBadge = () => {
    const s = status.toLowerCase();
    if (s === "success") return <Badge variant="success" dot>Success</Badge>;
    if (s === "failed") return <Badge variant="failed" dot>Failed</Badge>;
    if (["building", "running", "pending"].includes(s))
      return <Badge variant="running" dot>Building</Badge>;
    if (["cancelled", "canceled"].includes(s))
      return <Badge variant="neutral">Cancelled</Badge>;
    return <Badge variant="neutral">{status}</Badge>;
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Back button & top status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/projects/${projectId}/builds`}
            className="p-2 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          >
            <FiArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-zinc-100 font-mono tracking-tight">
                Build #{buildId}
              </h2>
              {getStatusBadge()}
            </div>

            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap font-mono">
              <span className="flex items-center gap-1 text-zinc-300">
                <FiGitBranch className="h-3 w-3 text-zinc-500" />
                {branch || "main"}
              </span>
              {commit && (
                <span className="flex items-center gap-1 text-zinc-500">
                  <FiGitCommit className="h-3 w-3" />
                  {commit.slice(0, 7)}
                </span>
              )}
              {startTime && (
                <span className="flex items-center gap-1 text-zinc-500">
                  <FiClock className="h-3 w-3" />
                  {startTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          {isRunning && (
            <Button
              variant="danger"
              size="sm"
              leftIcon={<FiXCircle className="h-3.5 w-3.5" />}
              onClick={() => setCancelDialogOpen(true)}
            >
              Cancel Build
            </Button>
          )}

          {isSuccess && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FiDownload className="h-3.5 w-3.5" />}
              onClick={handleDownload}
            >
              Download APK
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-zinc-500 hover:text-rose-400"
          >
            <FiTrash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Build"
        description="Are you sure you want to permanently delete this build and its log files?"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteConfirm}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-xs text-zinc-400">
          This operation will remove all build artifacts and logs.
        </p>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel In-Flight Build"
        description="Are you sure you want to cancel the currently executing pipeline build?"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isCanceling}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isCanceling}
              onClick={handleCancelConfirm}
            >
              Stop Build
            </Button>
          </>
        }
      >
        <p className="text-xs text-zinc-400">
          The runner will abort immediately and mark the build as cancelled.
        </p>
      </Modal>
    </div>
  );
};

export default BuildDetailsHeader;
