
import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { useTheme } from "@mui/material/styles";

const projects = [
  {
    name: "commerce-api-v2",
    status: "Online",
    description: "Main backend service for the e-commerce platform.",
    branch: "main",
    time: "2h ago",
  },
  {
    name: "chat-websocket",
    status: "Online",
    description: "Real-time messaging socket server node.",
    branch: "dev",
    time: "5h ago",
  },
  {
    name: "analytics-worker",
    status: "Paused",
    description: "Background job processor for analytics events.",
    branch: "feat/scaling",
    time: "1d ago",
  },
];

function RecentProjects() {
  const theme = useTheme();
  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        p: 3,
        boxShadow: 1,
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        transition: 'background 0.2s, border 0.2s',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography fontWeight={600} color={theme.palette.text.primary}>
          Recent Projects
        </Typography>
        <Link href="#" underline="hover" color={theme.palette.primary.main} fontSize={13} fontWeight={500}>
          View all
        </Link>
      </Box>
      <Box display="flex" gap={2} overflow="auto" pb={1}>
        {projects.map((project) => (
          <Paper
            key={project.name}
            elevation={0}
            sx={{
              minWidth: 220,
              maxWidth: 320,
              p: 2,
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              background: theme.palette.background.default,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.5,
            }}
          >
            <Box display="flex" alignItems="center" gap={1}>
              <Box
                width={8}
                height={8}
                borderRadius={8}
                sx={{
                  background: project.status === "Online" ? theme.palette.success.main : theme.palette.grey[500],
                }}
              />
              <Typography fontWeight={500} color={theme.palette.text.primary} fontSize={15}>
                {project.name}
              </Typography>
              <Box flex={1} />
              <Typography variant="caption" color={theme.palette.text.disabled}>
                {project.time}
              </Typography>
            </Box>
            <Typography variant="caption" color={theme.palette.text.secondary}>
              {project.description}
            </Typography>
            <Typography variant="caption" color={theme.palette.text.disabled}>
              {project.branch}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
}

export default RecentProjects;
