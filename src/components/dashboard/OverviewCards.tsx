"use client";

import React, { useMemo } from "react";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { Card } from "@/components/ui/Card";
import { FiActivity, FiCheckCircle, FiClock, FiFolder } from "react-icons/fi";

const OverviewCards: React.FC = () => {
  const { builds, projects } = useDashboardData();

  const { totalProjects, totalBuilds, successRate, avgBuildTime } = useMemo(() => {
    if (projects.length === 0) {
      return { totalProjects: "0", totalBuilds: "0", successRate: "—", avgBuildTime: "—" };
    }

    const total = builds.length;
    const successes = builds.filter((build) => build.status === "success").length;
    const successPct = total > 0 ? Math.round((successes / total) * 1000) / 10 : null;

    const durations = builds
      .map((build) => build.duration)
      .filter((duration): duration is number => typeof duration === "number" && Number.isFinite(duration));
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
        : null;

    return {
      totalProjects: String(projects.length),
      totalBuilds: String(total),
      successRate: successPct === null ? "—" : `${successPct}%`,
      avgBuildTime: avgDuration === null ? "—" : `${avgDuration}s`,
    };
  }, [builds, projects]);

  const cards = [
    {
      label: "Active Projects",
      value: totalProjects,
      description: "Total Flutter repositories configured",
      icon: <FiFolder className="h-4 w-4 text-cyan-400" />,
      accent: "text-cyan-400",
    },
    {
      label: "Total Builds",
      value: totalBuilds,
      description: "Triggered build workflows",
      icon: <FiActivity className="h-4 w-4 text-blue-400" />,
      accent: "text-blue-400",
    },
    {
      label: "Success Rate",
      value: successRate,
      description: "Pipelines passing successfully",
      icon: <FiCheckCircle className="h-4 w-4 text-emerald-400" />,
      accent: "text-emerald-400",
    },
    {
      label: "Avg. Duration",
      value: avgBuildTime,
      description: "Mean build execution time",
      icon: <FiClock className="h-4 w-4 text-amber-400" />,
      accent: "text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label} hoverable className="p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">{card.label}</span>
            <div className="p-2 rounded-md bg-zinc-900 border border-zinc-800/80">
              {card.icon}
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold tracking-tight text-zinc-100">
              {card.value}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">{card.description}</p>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default OverviewCards;
