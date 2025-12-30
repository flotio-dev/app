"use client";

import React from "react";
import SideMenu from "@/components/common/SideMenu";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import OverviewCards from "@/components/dashboard/OverviewCards";
import { DeploymentsChart } from "@/components/dashboard/DeploymentsChart";
import RecentProjects from "@/components/dashboard/RecentProjects";
import LatestActivity from "@/components/dashboard/LatestActivity";
import { useTheme } from "@mui/material/styles";

export default function DashboardPage() {
  const theme = useTheme();
  return (
    <div className="min-h-screen flex">
      <div className="fixed left-0 top-0 h-screen w-64 z-30">
        <SideMenu />
      </div>
      <main className="flex-1 flex flex-col min-h-screen" style={{ paddingLeft: 256 }}>
        <header className="h-16 flex items-center px-6" style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <DashboardHeader />
        </header>
        <div style={{ flex: 1, padding: 24 }}>
          <div className="mb-8">
            <OverviewCards />
          </div>
          <div className="mb-8">
            <DeploymentsChart />
          </div>
          <div className="mb-8">
            <RecentProjects />
          </div>
          <div>
            <LatestActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
