"use client";

import React, { useMemo } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";

const OverviewCards: React.FC = () => {
  const theme = useTheme();
  const { builds, projects } = useDashboardData();

  const { totalBuilds, successRate, avgBuildTime } = useMemo(() => {
    if (projects.length === 0) {
      return { totalBuilds: "—", successRate: "—", avgBuildTime: "—" };
    }

    const total = builds.length;
    const successes = builds.filter((build) => build.status === "success").length;
    const successPct = total > 0 ? Math.round((successes / total) * 1000) / 10 : null;

    const durations = builds
      .map((build) => build.duration)
      .filter((duration): duration is number => typeof duration === "number" && Number.isFinite(duration));
    const avgDuration = durations.length > 0
      ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
      : null;

    return {
      totalBuilds: String(total),
      successRate: successPct === null ? "—" : `${successPct}%`,
      avgBuildTime: avgDuration === null ? "—" : `${avgDuration}s`,
    };
  }, [builds, projects]);

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
