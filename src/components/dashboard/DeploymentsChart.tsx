"use client";

import React, { useMemo, useState } from "react";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { FiTrendingUp } from "react-icons/fi";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const periodDays: Record<string, number> = {
  "7d": 7,
  "30d": 30,
};

const formatDayLabel = (date: Date, days: number) => {
  if (days <= 7) {
    return WEEKDAYS[date.getDay()];
  }
  const day = String(date.getDate()).padStart(2, "0");
  const month = MONTHS[date.getMonth()];
  return `${day} ${month}`;
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
  const { builds } = useDashboardData();
  const [selected, setSelected] = useState<"24h" | "7d" | "30d">("24h");
  const periods: Array<"24h" | "7d" | "30d"> = ["24h", "7d", "30d"];

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
      for (let i = 23; i >= 0; i -= 1) {
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
  const maxBarHeight = 110;

  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FiTrendingUp className="h-4 w-4 text-cyan-400" />
          <div>
            <CardTitle>Deployment Velocity</CardTitle>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
          {periods.map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setSelected(period)}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selected === period
                  ? "bg-zinc-800 text-white font-semibold shadow-xs"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-5 pt-3">
        {totalBuilds === 0 ? (
          <div className="w-full h-40 flex items-center justify-center rounded-lg border border-dashed border-zinc-800/80 bg-zinc-950/40">
            <p className="text-xs text-zinc-500">No build activity detected for this period.</p>
          </div>
        ) : (
          <div className="w-full h-40 flex items-end gap-1 sm:gap-2 pt-6">
            {data.map((d, i) => {
              const heightPct = maxValue > 0 ? (d.value / maxValue) * maxBarHeight : 0;
              const isNonZero = d.value > 0;
              return (
                <div
                  key={d.day + i}
                  className="flex-1 flex flex-col items-center group relative min-w-0"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 hidden group-hover:flex items-center px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-100 font-mono whitespace-nowrap shadow-md z-10">
                    {d.value} builds
                  </div>

                  <div
                    className={`w-full max-w-[28px] rounded-t transition-all duration-300 ${
                      isNonZero
                        ? "bg-gradient-to-t from-cyan-600 to-cyan-400 group-hover:from-cyan-500 group-hover:to-cyan-300"
                        : "bg-zinc-800/40"
                    }`}
                    style={{ height: `${Math.max(heightPct, 4)}px` }}
                  />
                  <span className="text-[10px] text-zinc-500 mt-2 truncate w-full text-center">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
