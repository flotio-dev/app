"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiGrid, FiPlay, FiSliders } from "react-icons/fi";

interface ProjectTabsProps {
  projectId: string;
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Overview",
      href: `/projects/${projectId}`,
      icon: <FiGrid className="h-3.5 w-3.5" />,
      active: pathname === `/projects/${projectId}`,
    },
    {
      label: "Builds",
      href: `/projects/${projectId}/builds`,
      icon: <FiPlay className="h-3.5 w-3.5" />,
      active: pathname.startsWith(`/projects/${projectId}/builds`),
    },
    {
      label: "Configuration",
      href: `/projects/${projectId}/configuration`,
      icon: <FiSliders className="h-3.5 w-3.5" />,
      active: pathname.startsWith(`/projects/${projectId}/configuration`),
    },
  ];

  return (
    <div className="w-full border-b border-border-subtle bg-surface/50 px-3 sm:px-6 backdrop-blur-xs transition-colors duration-200 overflow-x-auto no-scrollbar">
      <div className="flex items-center space-x-4 sm:space-x-6 min-w-max">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors shrink-0 ${
              tab.active
                ? "border-accent-primary text-text-primary font-semibold"
                : "border-transparent text-text-muted hover:text-text-primary hover:border-border-default"
            }`}
          >
            <span className={tab.active ? "text-accent-primary" : "text-text-muted"}>
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

