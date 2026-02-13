"use client";

import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import ErrorRounded from "@mui/icons-material/ErrorRounded";
import AutorenewRounded from "@mui/icons-material/AutorenewRounded";
import CreateNewFolderRounded from "@mui/icons-material/CreateNewFolderRounded";
import BuildRounded from "@mui/icons-material/BuildRounded";

type ActivityItem = {
  type: string;
  project: string | null;
  time: string;
  icon: React.ReactNode;
  timestamp: number;
};

const formatDateTime = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const LatestActivity: React.FC = () => {
  const theme = useTheme();
  const { builds, projects } = useDashboardData();

  const getStatusIcon = (status: string) => {
    if (status === "success") {
      return <CheckCircleRounded fontSize="small" sx={{ color: theme.palette.success.main }} />;
    }
    if (status === "failed") {
      return <ErrorRounded fontSize="small" sx={{ color: theme.palette.error.main }} />;
    }
    if (status === "building") {
      return <AutorenewRounded fontSize="small" sx={{ color: theme.palette.warning.main }} />;
    }
    return <BuildRounded fontSize="small" sx={{ color: theme.palette.text.secondary }} />;
  };

  const activities = useMemo(() => {
    if (projects.length === 0 && builds.length === 0) {
      return [];
    }

    const projectNameMap = new Map<string | number, string>();
    projects.forEach((project) => {
      const id = project.id ?? project.project_id;
      if (id !== undefined && id !== null) {
        projectNameMap.set(id, project.name ?? "Unknown project");
      }
    });

    const buildItems: ActivityItem[] = builds
      .filter((build) => Boolean(build?.created_at))
      .map((build) => {
        const status = build.status ?? "unknown";
        const projectName = build.project_id !== undefined
          ? projectNameMap.get(build.project_id) ?? "Unknown project"
          : "Unknown project";
        const timestamp = build.created_at ? new Date(build.created_at).getTime() : 0;

        return {
          type: `Build ${status}`,
          project: projectName,
          time: formatDateTime(build.created_at),
          icon: getStatusIcon(status),
          timestamp,
        };
      });

    const projectCreatedItems: ActivityItem[] = projects
      .filter((project) => Boolean(project?.created_at))
      .map((project) => {
        const timestamp = project.created_at ? new Date(project.created_at).getTime() : 0;
        return {
          type: "Project created",
          project: project.name ?? "Unknown project",
          time: formatDateTime(project.created_at),
          icon: <CreateNewFolderRounded fontSize="small" sx={{ color: theme.palette.primary.main }} />,
          timestamp,
        };
      });

    const projectUpdatedItems: ActivityItem[] = projects
      .filter((project) => Boolean(project?.updated_at))
      .map((project) => {
        const createdAt = project.created_at ? new Date(project.created_at).getTime() : 0;
        const updatedAt = project.updated_at ? new Date(project.updated_at).getTime() : 0;
        return {
          project,
          createdAt,
          updatedAt,
        };
      })
      .filter((item) => item.updatedAt && item.updatedAt !== item.createdAt)
      .map((item) => ({
        type: "Project updated",
        project: item.project.name ?? "Unknown project",
        time: formatDateTime(item.project.updated_at),
        icon: <AutorenewRounded fontSize="small" sx={{ color: theme.palette.info.main }} />,
        timestamp: item.updatedAt,
      }));

    return [...buildItems, ...projectCreatedItems, ...projectUpdatedItems]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  }, [builds, projects, theme]);
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
      <Typography fontWeight={600} mb={2} color={theme.palette.text.primary}>
        Latest Activity
      </Typography>
      {activities.length === 0 ? (
        <Typography variant="body2" color={theme.palette.text.secondary}>
          No recent activity.
        </Typography>
      ) : (
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
          {activities.map((activity, idx) => (
            <Box
              key={idx}
              component="li"
              display="flex"
              alignItems="center"
              gap={2}
              fontSize={15}
              color={theme.palette.text.secondary}
              mb={1.5}
            >
              <Box display="flex" alignItems="center" justifyContent="center">
                {activity.icon}
              </Box>
              <Box flex={1} display="flex" alignItems="center">
                <Typography variant="body2" color={theme.palette.text.primary}>
                  {activity.type}
                </Typography>
                {activity.project && (
                  <Chip
                    label={activity.project}
                    size="small"
                    sx={{
                      ml: 1,
                      fontSize: 12,
                      background: theme.palette.background.default,
                      color: theme.palette.text.secondary,
                    }}
                  />
                )}
              </Box>
              <Typography variant="caption" color={theme.palette.text.disabled}>
                {activity.time}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default LatestActivity;
