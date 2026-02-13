"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useApi } from '@/hooks/useApi';

const OverviewCards: React.FC = () => {
  const theme = useTheme();
  const { request } = useApi();
  const [totalBuilds, setTotalBuilds] = useState<string>("—");
  const [successRate, setSuccessRate] = useState<string>("—");
  const [avgBuildTime, setAvgBuildTime] = useState<string>("—");

  useEffect(() => {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiBaseUrl) {
      setTotalBuilds("—");
      return;
    }

    let isActive = true;

    const loadBuildsCount = async () => {
      try {
        const projectsRes = await request(`${apiBaseUrl}/project`);
        if (!projectsRes.ok) {
          if (isActive) setTotalBuilds("—");
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
          if (isActive) setTotalBuilds("—");
          return;
        }

        const buildsResults = await Promise.allSettled(
          projectIds.map((projectId: string | number) => request(`${apiBaseUrl}/project/${projectId}/builds`))
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

        if (isActive) {
          const total = builds.length;
          const successes = builds.filter((build: { status?: string }) => build.status === "success").length;
          const successPct = total > 0 ? Math.round((successes / total) * 1000) / 10 : null;

          const durations = builds
            .map((build: { duration?: number }) => build.duration)
            .filter((duration): duration is number => typeof duration === "number" && Number.isFinite(duration));
          const avgDuration = durations.length > 0
            ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
            : null;

          setTotalBuilds(String(total));
          setSuccessRate(successPct === null ? "—" : `${successPct}%`);
          setAvgBuildTime(avgDuration === null ? "—" : `${avgDuration}s`);
        }
      } catch {
        if (isActive) {
          setTotalBuilds("—");
          setSuccessRate("—");
          setAvgBuildTime("—");
        }
      }
    };

    loadBuildsCount();

    return () => {
      isActive = false;
    };
  }, []);

  const cards = [
    {
      label: "Total Builds",
      value: totalBuilds,
    },
    {
      label: "Success Rate",
      value: successRate,
    },
    {
      label: "Avg Build Time",
      value: avgBuildTime,
    },
  ];

  return (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
      {cards.map((card) => (
        <Paper
          key={card.label}
          elevation={1}
          sx={{
            borderRadius: 2,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            boxShadow: 1,
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            transition: 'background 0.2s, border 0.2s',
          }}
        >
          <Typography variant="body2" color={theme.palette.text.secondary}>
            {card.label}
          </Typography>
          <Typography variant="h4" fontWeight={700} color={theme.palette.text.primary}>
            {card.value}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};

export default OverviewCards;
