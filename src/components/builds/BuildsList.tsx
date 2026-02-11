import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const buildsData = [
  {
    id: "build_0073",
    status: "success",
    startTime: "24 juil. 2025, 11:30",
    endTime: "24 juil. 2025, 11:47",
    description: "Commit 9afc1e1 – Optimize images",
  },
  {
    id: "build_0072",
    status: "failed",
    startTime: "23 juil. 2025, 17:12",
    endTime: "23 juil. 2025, 17:25",
    description: "Commit 1b23cde – Fix env var typo",
  },
  {
    id: "build_0071",
    status: "success",
    startTime: "22 juil. 2025, 14:45",
    endTime: "22 juil. 2025, 15:02",
    description: "Commit a8f2b5c – Add new feature",
  },
  {
    id: "build_0070",
    status: "success",
    startTime: "21 juil. 2025, 09:30",
    endTime: "21 juil. 2025, 09:45",
    description: "Commit c3e4d9f – Update dependencies",
  },
  {
    id: "build_0069",
    status: "failed",
    startTime: "20 juil. 2025, 16:20",
    endTime: "20 juil. 2025, 16:35",
    description: "Commit 2f7g8h9 – Refactor utils",
  },
];

const BuildsList: React.FC = () => {
  const theme = useTheme();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return { bg: "#d1fae5", text: "#047857", label: "Succès" };
      case "failed":
        return { bg: "#fee2e2", text: "#dc2626", label: "Échec" };
      case "building":
        return { bg: "#fef3c7", text: "#d97706", label: "En cours" };
      default:
        return { bg: "#f3f4f6", text: "#374151", label: "Inconnu" };
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Builds List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {buildsData.map((build) => {
          const statusColor = getStatusColor(build.status);
          return (
            <Paper
              key={build.id}
              elevation={0}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
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
                {build.id}
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
                  minWidth: '150px',
                }}
              >
                {build.startTime}
              </Typography>

              {/* End Time */}
              <Typography
                variant="body2"
                sx={{
                  color: theme.palette.text.secondary,
                  minWidth: '150px',
                }}
              >
                {build.endTime}
              </Typography>

              {/* Description */}
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {build.description}
              </Typography>

              {/* Actions */}
              <Box sx={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                <IconButton
                  size="small"
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
        })}
      </Box>
    </Box>
  );
};

export default BuildsList;
