"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import RefreshIcon from "@mui/icons-material/Refresh";
import CancelIcon from "@mui/icons-material/Cancel";
import LinkIcon from "@mui/icons-material/Link";

interface BuildDetailsHeaderProps {
  buildId: string;
  status: string;
  commit: string;
  branch: string;
  message: string;
  startTime?: string;
  duration?: number;
}

const BuildDetailsHeader: React.FC<BuildDetailsHeaderProps> = ({
  buildId,
  status,
  commit,
  branch,
  message,
  startTime,
  duration,
}) => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return { bg: "#d1fae5", text: "#047857", label: "Succès" };
      case "failed":
        return { bg: "#fee2e2", text: "#dc2626", label: "Échec" };
      case "building":
      case "pending":
      case "running":
        return { bg: "#fef3c7", text: "#d97706", label: "En cours" };
      default:
        return { bg: "#f3f4f6", text: "#374151", label: "En attente" };
    }
  };

  const statusColor = getStatusColor(status);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
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
          <Button
            variant="outlined"
            startIcon={<LinkIcon />}
            size="small"
            sx={{ textTransform: "none" }}
          >
            Visit Commit
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            size="small"
            sx={{ textTransform: "none" }}
          >
            Rebuild
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            size="small"
            sx={{ textTransform: "none" }}
          >
            Cancel Build
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
        {duration !== undefined && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              DURÉE
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatDuration(duration)}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default BuildDetailsHeader;
