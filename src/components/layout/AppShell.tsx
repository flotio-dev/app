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
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col font-sans selection:bg-purple-500/20 selection:text-purple-300 transition-colors duration-200">
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (Slide-in on mobile, persistent on lg+) */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area (offset by 256px only on lg+) */}
      <div className="flex-1 flex flex-col min-h-screen pl-0 lg:pl-64 transition-all duration-300">
        {/* Sticky Header */}
        <Header
          customBreadcrumbs={customBreadcrumbs}
          actions={headerActions}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        {/* Project Context Tabs (if project route) */}
        {projectId && <ProjectTabs projectId={projectId} />}

        {/* Main Content */}
        <main
          className={`flex-1 w-full p-4 sm:p-6 lg:p-8 ${
            fullWidth ? "" : "max-w-[1440px] mx-auto"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}

