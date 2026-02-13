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
  "90d": 90,
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


export function DeploymentsChart() {
  const theme = useTheme();
  const { builds } = useDashboardData();
  const [selected, setSelected] = useState("7d");
  const periods = ["7d", "30d", "90d"];
  const data = useMemo(() => {
    const days = periodDays[selected] ?? 7;
    const bucketSize = days <= 7 ? 1 : days <= 30 ? 5 : 15;

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

    for (let i = days - 1; i >= 0; i -= bucketSize) {
      const bucketStart = new Date(today);
      bucketStart.setDate(today.getDate() - i);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketStart.getDate() + bucketSize - 1);
      if (bucketEnd > today) {
        bucketEnd.setTime(today.getTime());
      }

      let total = 0;
      const cursor = new Date(bucketStart);
      while (cursor <= bucketEnd) {
        const key = toDateKey(cursor);
        total += counts.get(key) ?? 0;
        cursor.setDate(cursor.getDate() + 1);
      }

      range.push({
        day: bucketSize === 1 ? formatDayLabel(bucketStart, days) : formatRangeLabel(bucketStart, bucketEnd),
        value: total,
      });
    }

    return range;
  }, [builds, selected]);

  const totalBuilds = data.reduce((sum, item) => sum + item.value, 0);

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
                  height: `${d.value * 1.8}px`,
                  maxHeight: 120,
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
