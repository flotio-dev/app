"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import { useApi } from "@/hooks/useApi";
import { format, formatDuration, intervalToDuration } from "date-fns";
import { fr } from "date-fns/locale";

interface APIBuild {
  apk_url: string;
  container_id: string;
  created_at: string;
  duration: number;
  id: number;
  platform: string;
  project_id: number;
  status: string;
  updated_at: string;
}

interface BuildsListProps {
  projectId?: string;
}

function extractBuilds(payload: unknown): APIBuild[] {
  if (Array.isArray(payload)) {
    return payload as APIBuild[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as {
    builds?: APIBuild[];
    Builds?: APIBuild[];
    data?: { builds?: APIBuild[]; Builds?: APIBuild[] };
    details?: { builds?: APIBuild[]; Builds?: APIBuild[] };
    project?: { builds?: APIBuild[]; Builds?: APIBuild[] };
  };

  return (
    data.builds ||
    data.Builds ||
    data.data?.builds ||
    data.data?.Builds ||
    data.details?.builds ||
    data.details?.Builds ||
    data.project?.builds ||
    data.project?.Builds ||
    []
  );
}

const BuildsList: React.FC<BuildsListProps> = ({ projectId }) => {
  const theme = useTheme();
  const router = useRouter();
  const { request } = useApi();
  const [builds, setBuilds] = useState<APIBuild[]>([]);
  const fetchingProjectIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedBuild, setSelectedBuild] = useState<APIBuild | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchBuilds = useCallback(async () => {
    if (!projectId) {
      setBuilds([]);
      fetchingProjectIdRef.current = null;
      return;
    }

    if (fetchingProjectIdRef.current === projectId) {
      return;
    }

    fetchingProjectIdRef.current = projectId;

    try {
      const response = await request(
        `${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/builds`
      );
      if (!response.ok) throw new Error("Failed to fetch builds");
      const data = await response.json();
      if (isMountedRef.current) {
        setBuilds(extractBuilds(data));
      }
    } catch (error) {
      console.error("Failed to fetch builds:", error);
    } finally {
      if (fetchingProjectIdRef.current === projectId) {
        fetchingProjectIdRef.current = null;
      }
    }
  }, [projectId, request]);

  useEffect(() => {
    fetchBuilds();
  }, [fetchBuilds]);

  useEffect(() => {
    if (!projectId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      fetchBuilds();
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [projectId, fetchBuilds]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, build: APIBuild) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedBuild(build);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedBuild(null);
  };

  const handleDownload = async () => {
    if (!selectedBuild || !projectId) {
      handleMenuClose();
      return;
    }

    try {
      const response = await request(
        `${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/build/${selectedBuild.id}/download`
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
    } finally {
      handleMenuClose();
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    // Keep selectedBuild set for the dialog
    setAnchorEl(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBuild || !projectId) return;

    setIsDeleting(true);
    try {
      const response = await request(
        `${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/build/${selectedBuild.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Delete response:", data);
        setBuilds((prev) => prev.filter((b) => b.id !== selectedBuild.id));
        setDeleteDialogOpen(false);
        setSelectedBuild(null);
      } else {
        const errorText = await response.text();
        console.error("Failed to delete build:", errorText);
        alert(`Erreur lors de la suppression du build: ${errorText}`);
      }
    } catch (error) {
      console.error("Error deleting build:", error);
      alert("Erreur lors de la suppression du build");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedBuild(null);
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Builds List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {builds.length === 0 ? (
          <Typography color="textSecondary" align="center">
            Aucun build trouvé.
          </Typography>
        ) : (
          builds.map((build) => {
            const statusColor = getStatusColor(build.status);
            return (
              <Paper
                key={build.id}
                elevation={0}
                onClick={() => router.push(`/projects/${projectId}/builds/${build.id}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: theme.palette.action.hover,
                    boxShadow: 1,
                  },
                }}
              >
                {/* ID */}
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: theme.palette.primary.main,
                    minWidth: '100px',
                    cursor: 'pointer',
                  }}
                >
                  #{build.id}
                </Typography>

                {/* Status Chip */}
                <Chip
                  label={statusColor.label}
                  size="small"
                  sx={{
                    background: statusColor.bg,
                    color: statusColor.text,
                    fontWeight: 600,
                    height: 24,
                    borderRadius: 0.75,
                    minWidth: '100px',
                  }}
                />

                {/* Start Time */}
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    width: '180px',
                    minWidth: '180px', // Fixed width for alignment
                    paddingLeft: 4, // Reduced padding, using fixed width for spacing
                  }}
                >
                  {format(new Date(build.created_at), "dd MMM yyyy HH:mm", { locale: fr })}
                </Typography>

                {/* Duration */}
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    width: '200px',
                    minWidth: '200px', // Fixed width for alignment
                    textAlign: 'left'
                  }}
                >
                  {["building", "running", "pending"].includes(build.status.toLowerCase())
                    ? "Running..."
                    : build.duration
                      ? formatDuration(intervalToDuration({ start: 0, end: build.duration * 1000 }), { locale: fr })
                      : '-'}
                </Typography>

                {/* Description / Platform */}
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1, // Allow this column to take up remaining space
                    minWidth: '150px',
                    paddingLeft: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textAlign: 'right', // Align to right so it sits nicely against the actions
                  }}
                >
                  {build.platform}
                </Typography>

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, build)}
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': { background: theme.palette.action.hover },
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            );
          })
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          elevation: 3,
          sx: { minWidth: 150 },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {selectedBuild?.status.toLowerCase() === "success" && selectedBuild.apk_url && (
          <MenuItem onClick={handleDownload} sx={{ color: theme.palette.text.primary }}>
            <ListItemIcon>
              <DownloadIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText>Download APK</ListItemText>
          </MenuItem>
        )}
        <MenuItem onClick={handleDeleteClick} sx={{ color: theme.palette.error.main }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete Build</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onClick={(e) => e.stopPropagation()}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete Build #{selectedBuild?.id}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
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
    </Box>
  );
};

export default BuildsList;
