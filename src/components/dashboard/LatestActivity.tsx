"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import { useApi } from "@/hooks/useApi";
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
  const { request } = useApi();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

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

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiBaseUrl) {
      setActivities([]);
      return;
    }

    let isActive = true;

    const loadActivities = async () => {
      try {
        const projectsRes = await request(`${apiBaseUrl}/project`);
        if (!projectsRes.ok) {
          if (isActive) setActivities([]);
          return;
        }

        const projectsData = await projectsRes.json();
        const projects = Array.isArray(projectsData)
          ? projectsData
          : projectsData?.projects ?? [];

        const projectIds = projects
          .map((project: { id?: string | number; project_id?: string | number }) => project.id ?? project.project_id)
          .filter(Boolean);

        if (projectIds.length === 0) {
          if (isActive) setActivities([]);
          return;
        }

        const projectNameMap = new Map<string | number, string>();
        projects.forEach((project: { id?: string | number; project_id?: string | number; name?: string }) => {
          const id = project.id ?? project.project_id;
          if (id !== undefined && id !== null) {
            projectNameMap.set(id, project.name ?? "Unknown project");
          }
        });

        const buildsResults = await Promise.allSettled(
          projectIds.map((projectId: string | number) => request(`${apiBaseUrl}/project/${projectId}/builds`))
        );

        const projectsEditedResults = await Promise.allSettled(
          projectIds.map((projectId: string | number) => request(`${apiBaseUrl}/project/${projectId}`))
        );

        const buildsArrays = await Promise.all(
          buildsResults
            .filter((result): result is PromiseFulfilledResult<Response> => result.status === "fulfilled")
            .map(async (result) => {
              if (!result.value.ok) return [];
              const data = await result.value.json();
              if (Array.isArray(data?.builds)) return data.builds;
              if (Array.isArray(data)) return data;
              return [];
            })
        );

        const builds = buildsArrays.flat();
        const sortedBuilds = builds
          .filter((build: { created_at?: string }) => Boolean(build?.created_at))
          .map((build: { status?: string; created_at?: string; project_id?: string | number }) => {
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

        const projectItems = projects
          .filter((project: { created_at?: string }) => Boolean(project?.created_at))
          .map((project: { name?: string; created_at?: string }) => {
            const timestamp = project.created_at ? new Date(project.created_at).getTime() : 0;
            return {
              type: "Project created",
              project: project.name ?? "Unknown project",
              time: formatDateTime(project.created_at),
              icon: <CreateNewFolderRounded fontSize="small" sx={{ color: theme.palette.primary.main }} />,
              timestamp,
            };
          });

        const projectUpdatesArrays = await Promise.all(
          projectsEditedResults
            .filter((result): result is PromiseFulfilledResult<Response> => result.status === "fulfilled")
            .map(async (result) => {
              if (!result.value.ok) return null;
              const data = await result.value.json();
              return data?.project ?? data;
            })
        );

        const projectUpdates = projectUpdatesArrays
          .filter((project): project is { id?: string | number; project_id?: string | number; name?: string; created_at?: string; updated_at?: string } => Boolean(project))
          .map((project) => {
            const projectId = project.id ?? project.project_id;
            const projectName = project.name
              ?? (projectId !== undefined ? projectNameMap.get(projectId) : undefined)
              ?? "Unknown project";
            const createdAt = project.created_at ? new Date(project.created_at).getTime() : 0;
            const updatedAt = project.updated_at ? new Date(project.updated_at).getTime() : 0;
            return {
              type: "Project updated",
              project: projectName,
              time: formatDateTime(project.updated_at),
              icon: <AutorenewRounded fontSize="small" sx={{ color: theme.palette.info.main }} />,
              timestamp: updatedAt,
              createdAt,
            };
          })
          .filter((item) => item.timestamp && item.timestamp !== item.createdAt);

        const items = [...sortedBuilds, ...projectItems, ...projectUpdates]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);

        if (isActive) {
          setActivities(items);
        }
      } catch {
        if (isActive) setActivities([]);
      }
    };

    loadActivities();

    return () => {
      isActive = false;
    };
  }, [request]);
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
