import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { mockBuildsData } from "./mockBuildsData";

interface BuildsListProps {
  projectId?: string;
}

const BuildsList: React.FC<BuildsListProps> = ({ projectId }) => {
  const theme = useTheme();

  const filteredBuilds = projectId
    ? mockBuildsData.filter((build) => build.projectId === projectId)
    : mockBuildsData;

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Builds List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filteredBuilds.map((build) => {
          const statusColor = getStatusColor(build.status);
          return (
            <Paper
              key={build.id}
              elevation={0}
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
                  paddingLeft: 20,
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
                  paddingLeft: 5,
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
                  paddingLeft: 10,
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
