"use client";

import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { useTheme } from "@mui/material/styles";

import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { formatDistanceToNow, parseISO } from 'date-fns';

function getStatus(project: any) {
  // You can adjust this logic based on your API's status field
  return project.status || 'Online';
}

function RecentProjects() {
  const theme = useTheme();
  const { projects } = useDashboardData();

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 4);
  }, [projects]);

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
        <Link href="/projects" underline="hover" color={theme.palette.primary.main} fontSize={13} fontWeight={500}>
          View all
        </Link>
      </Box>
      <Box display="flex" gap={2} overflow="auto" pb={1}>
        {recentProjects.map((project) => (
          <Paper
            key={project.id}
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
                  background: getStatus(project) === "Online" ? theme.palette.success.main : theme.palette.grey[500],
                }}
              />
              <Typography fontWeight={500} color={theme.palette.text.primary} fontSize={15}>
                {project.name}
              </Typography>
              <Box flex={1} />
              <Typography variant="caption" color={theme.palette.text.disabled}>
                {project.updated_at ? formatDistanceToNow(parseISO(project.updated_at), { addSuffix: true }) : ''}
              </Typography>
            </Box>
            <Typography variant="caption" color={theme.palette.text.secondary}>
              {project.git_repo}
            </Typography>
            <Typography variant="caption" color={theme.palette.text.disabled}>
              By {project.git_username}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Paper>
  );
}

export default RecentProjects;
