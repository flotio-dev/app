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
    <div className="w-full border-b border-zinc-800/80 bg-zinc-950/40 px-6 backdrop-blur-xs">
      <div className="flex items-center space-x-6">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 py-3 text-xs font-medium border-b-2 transition-colors ${
              tab.active
                ? "border-cyan-400 text-white font-semibold"
                : "border-transparent text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
            }`}
          >
            <span className={tab.active ? "text-cyan-400" : "text-zinc-500"}>
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
