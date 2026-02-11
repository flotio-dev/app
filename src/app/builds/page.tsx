"use client";

import React from "react";
import SideMenu from "@/components/common/SideMenu";
import { useTheme } from "@mui/material/styles";
import BuildsCharts from "@/components/builds/BuildsCharts";

export default function BuildsPage() {
  const theme = useTheme();
  return (
    <div className="min-h-screen flex">
      <div className="fixed left-0 top-0 h-screen w-64 z-30">
        <SideMenu />
      </div>
      <main className="flex-1 flex flex-col min-h-screen" style={{ paddingLeft: 256 }}>
        <header className="h-16 flex items-center px-6" style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <h1 className="text-2xl font-bold">Builds</h1>
        </header>
        <div style={{ flex: 1, padding: 24 }}>
          <div className="mb-8">
            <BuildsCharts />
          </div>
        </div>
      </main>
    </div>
  );
}