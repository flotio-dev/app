"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ProjectTabs } from "./ProjectTabs";

interface AppShellProps {
  children: React.ReactNode;
  projectId?: string;
  headerActions?: React.ReactNode;
  customBreadcrumbs?: Array<{ label: string; href?: string }>;
  fullWidth?: boolean;
}

export function AppShell({
  children,
  projectId,
  headerActions,
  customBreadcrumbs,
  fullWidth = false,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans selection:bg-purple-500/20 selection:text-purple-300 transition-colors duration-200">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main Content Area (offset by 256px) */}
      <div className="flex-1 flex flex-col min-h-screen pl-64">
        {/* Sticky Header */}
        <Header customBreadcrumbs={customBreadcrumbs} actions={headerActions} />

        {/* Project Context Tabs (if project route) */}
        {projectId && <ProjectTabs projectId={projectId} />}

        {/* Main Content */}
        <main
          className={`flex-1 w-full p-6 sm:p-8 ${
            fullWidth ? "" : "max-w-[1440px] mx-auto"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

