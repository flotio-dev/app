"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardDataProvider } from "@/components/dashboard/DashboardDataProvider";
import OverviewCards from "@/components/dashboard/OverviewCards";
import { DeploymentsChart } from "@/components/dashboard/DeploymentsChart";
import RecentProjects from "@/components/dashboard/RecentProjects";
import LatestActivity from "@/components/dashboard/LatestActivity";
import { Button } from "@/components/ui/Button";
import { FiPlus } from "react-icons/fi";

export default function DashboardPage() {
  return (
    <DashboardDataProvider>
      <AppShell
        headerActions={
          <Link href="/new-project">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FiPlus className="h-3.5 w-3.5" />}
            >
              New Project
            </Button>
          </Link>
        }
      >
        <div className="space-y-6">
          {/* Top Hero Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                Dashboard Overview
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time metrics, active build pipelines, and project telemetry.
              </p>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <OverviewCards />

          {/* Deployment Velocity Chart */}
          <DeploymentsChart />

          {/* Grid: Recent Projects & Latest Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentProjects />
            <LatestActivity />
          </div>
        </div>
      </AppShell>
    </DashboardDataProvider>
  );
}
