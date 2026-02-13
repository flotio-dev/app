"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import { useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import CancelIcon from "@mui/icons-material/Cancel";
import GitHubIcon from "@mui/icons-material/GitHub";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { useApi } from "@/hooks/useApi";

interface BuildDetailsHeaderProps {
  buildId: string;
  status: string;
  commit: string;
  branch: string;
  message: string;
  startTime?: string;
  duration?: number;
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
  duration,
  repoUrl,
  apkUrl
}) => {
  const theme = useTheme();
  const params = useParams();
  const projectId = params.id as string;
  const router = useRouter();
  const { request } = useApi();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const isRunning = ["building", "pending", "running"].includes(status.toLowerCase());
  const isSuccess = status.toLowerCase() === "success";

  // Format duration in seconds to HH:MM:SS
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "-";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDownload = async () => {
    if (!projectId || !buildId) return;

    try {
      const response = await request(
        `${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/build/${buildId}/download`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.download_url) {
          window.open(data.download_url, "_blank");
        } else {
          alert("Lien de téléchargement non trouvé.");
        }
      } else {
        console.error("Failed to fetch download URL");
        alert("Erreur lors de la récupération du lien de téléchargement.");
      }
    } catch (error) {
      console.error("Error downloading build:", error);
      alert("Erreur lors de la demande de téléchargement.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectId || !buildId) return;
    setIsDeleting(true);
    try {
      const response = await request(
        `${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/build/${buildId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        window.location.href = `/projects/${projectId}/builds`;
      } else {
        const errorText = await response.text();
        alert(`Erreur lors de la suppression: ${errorText}`);
      }
    } catch (error) {
      console.error("Error deleting build:", error);
      alert("Erreur lors de la suppression du build");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!projectId || !buildId) return;
    setIsCanceling(true);
    try {
      const response = await request(
        `${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/build/${buildId}/cancel`,
        { method: "PUT" }
      );

      if (response.ok) {
        window.location.reload();
      } else {
        alert("Erreur lors de l'annulation du build");
      }
    } catch (error) {
      console.error("Error canceling build:", error);
    } finally {
      setIsCanceling(false);
      setCancelDialogOpen(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return { bg: "#d1fae5", text: "#047857", label: "Success" };
      case "failed":
        return { bg: "#fee2e2", text: "#dc2626", label: "Failed" };
      case "building":
      case "running":
        return { bg: "#fef3c7", text: "#d97706", label: "Running" };
      case "waiting":
        return { bg: "#e0f2fe", text: "#0284c7", label: "Waiting" };
      case "pending":
        return { bg: "#e0f2fe", text: "#0284c7", label: "Pending" };
      case "cancelled":
        return { bg: "#e0f2fe", text: "#0284c7", label: "Cancelled" };
      default:
        return { bg: "#f3f4f6", text: "#374151", label: "Unknown" };
    }
  };

  const statusColor = getStatusColor(status);

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: 2,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="h5" fontWeight={700} mb={1}>
              {buildId}
            </Typography>
            <Chip
              label={statusColor.label}
              size="small"
              sx={{
                background: statusColor.bg,
                color: statusColor.text,
                fontWeight: 600,
                fontSize: "0.75rem",
              }}
            />
          </Box>
          <Box display="flex" gap={1}>
            {repoUrl && (
              <Button
                variant="outlined"
                startIcon={<GitHubIcon />}
                size="small"
                sx={{ textTransform: "none" }}
                onClick={() => window.open(repoUrl, "_blank")}
              >
                Visit Repository
              </Button>
            )}

            {/* Cancel Build - Orange if Running */}
            {isRunning && (
              <Button
                variant="outlined"
                color="warning"
                startIcon={<CancelIcon />}
                size="small"
                sx={{ textTransform: "none" }}
                onClick={() => setCancelDialogOpen(true)}
              >
                Cancel Build
              </Button>
            )}

            {/* Download APK - Green if Success */}
            {isSuccess && (
              <Button
                variant="outlined"
                color="success"
                startIcon={<DownloadIcon />}
                size="small"
                sx={{ textTransform: "none" }}
                onClick={handleDownload}
              >
                Download APK
              </Button>
            )}

            {/* Delete Build - Red (Permanently Visible) */}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              size="small"
              sx={{ textTransform: "none" }}
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Build
            </Button>
          </Box>
        </Box>

        <Box display="flex" gap={4} mt={3}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              COMMIT
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {commit}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              BRANCHE
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {branch}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="caption" color="text.secondary">
              MESSAGE
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {message}
            </Typography>
          </Box>
          {startTime && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                DÉMARRÉ
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {startTime}
              </Typography>
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary">
              DURÉE
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatDuration(duration)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete Build #{buildId}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
      >
        <DialogTitle>Confirm Cancellation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this build?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)} color="primary">
            Back
          </Button>
          <Button
            onClick={handleCancelConfirm}
            color="warning"
            variant="contained"
            autoFocus
            disabled={isCanceling}
          >
            {isCanceling ? "Canceling..." : "Cancel Build"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BuildDetailsHeader;
