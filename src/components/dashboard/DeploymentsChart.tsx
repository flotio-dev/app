"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const periodDays: Record<string, number> = {
  "7d": 7,
  "30d": 30,
};

const periodHours: Record<string, number> = {
  "24h": 24,
};

const formatDayLabel = (date: Date, days: number) => {
  if (days <= 7) {
    return WEEKDAYS[date.getDay()];
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  return `${day} ${month}`;
};

const formatRangeLabel = (start: Date, end: Date) => {
  const startDay = String(start.getDate()).padStart(2, "0");
  const endDay = String(end.getDate()).padStart(2, "0");
  const startMonth = MONTHS[start.getMonth()];
  const endMonth = MONTHS[end.getMonth()];

  if (start.getMonth() === end.getMonth()) {
    return `${startDay}-${endDay} ${startMonth}`;
  }

  return `${startDay} ${startMonth}-${endDay} ${endMonth}`;
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const toHourKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  return `${year}-${month}-${day}-${hour}`;
};

const formatHourLabel = (date: Date) => {
  const hour = String(date.getHours()).padStart(2, "0");
  return `${hour}:00`;
};


export function DeploymentsChart() {
  const theme = useTheme();
  const { builds } = useDashboardData();
  const [selected, setSelected] = useState("24h");
  const periods = ["24h", "7d", "30d"];
  const data = useMemo(() => {
    if (selected === "24h") {
      const counts = new Map<string, number>();
      builds.forEach((build) => {
        if (!build?.created_at) return;
        const createdAt = new Date(build.created_at);
        if (Number.isNaN(createdAt.getTime())) return;
        const key = toHourKey(createdAt);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      });

      const now = new Date();
      const currentHour = new Date(now);
      currentHour.setMinutes(0, 0, 0);

      const range: Array<{ day: string; value: number }> = [];
      const hours = periodHours[selected] ?? 24;

      for (let i = hours - 1; i >= 0; i -= 1) {
        const bucketStart = new Date(currentHour);
        bucketStart.setHours(currentHour.getHours() - i);
        const key = toHourKey(bucketStart);
        range.push({
          day: formatHourLabel(bucketStart),
          value: counts.get(key) ?? 0,
        });
      }

      return range;
    }

    const days = periodDays[selected] ?? 7;
    const counts = new Map<string, number>();
    builds.forEach((build) => {
      if (!build?.created_at) return;
      const createdAt = new Date(build.created_at);
      if (Number.isNaN(createdAt.getTime())) return;
      const key = toDateKey(createdAt);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    const today = new Date();
    const range: Array<{ day: string; value: number }> = [];

    for (let i = days - 1; i >= 0; i -= 1) {
      const bucketStart = new Date(today);
      bucketStart.setDate(today.getDate() - i);
      const key = toDateKey(bucketStart);
      range.push({
        day: formatDayLabel(bucketStart, days),
        value: counts.get(key) ?? 0,
      });
    }

    return range;
  }, [builds, selected]);

  const totalBuilds = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = data.reduce((max, item) => Math.max(max, item.value), 0);
  const maxBarHeight = 120;

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
        <Box display="flex" alignItems="baseline" gap={1.5}>
          <Typography fontWeight={600} color={theme.palette.text.primary}>
            Total deployments - Detailed view
          </Typography>
          <Typography variant="body2" color={theme.palette.text.secondary}>
            {totalBuilds} builds
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          {periods.map((period) => (
            <Button
              key={period}
              size="small"
              variant={selected === period ? "contained" : "outlined"}
              color={selected === period ? "primary" : "inherit"}
              sx={{
                minWidth: 40,
                fontSize: 12,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                textTransform: 'none',
              }}
              onClick={() => setSelected(period)}
            >
              {period}
            </Button>
          ))}
        </Box>
      </Box>
      {totalBuilds === 0 ? (
        <Box
          width="100%"
          height={160}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
            borderRadius: 1,
            border: `1px dashed ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" color={theme.palette.text.secondary}>
            No builds yet for this period.
          </Typography>
        </Box>
      ) : (
        <Box width="100%" height={160} display="flex" alignItems="flex-end" gap={1.5}>
          {data.map((d) => (
            <Box key={d.day} display="flex" flexDirection="column" alignItems="center" flex={1}>
              <Typography variant="caption" color={theme.palette.text.secondary}>
                {d.value}
              </Typography>
              <Box
                width={24}
                borderRadius={1}
                sx={{
                  background: theme.palette.primary.main,
                  height: `${maxValue > 0 ? (d.value / maxValue) * maxBarHeight : 0}px`,
                  transition: 'background 0.2s',
                }}
              />
              <Typography variant="caption" mt={1} color={theme.palette.text.secondary}>
                {d.day}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
