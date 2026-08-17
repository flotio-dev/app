"use client";

import React from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ProjectConfigProvider } from "@/context/ProjectConfigContext";
import ProjectConfigurationContent from "@/components/projects/configuration/ProjectConfigurationContent";

export default function ProjectConfigurationPage() {
  const params = useParams();
  const projectId = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  return (
    <ProjectConfigProvider>
      <AppShell projectId={projectId}>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100">
                Project Configuration
              </h1>
              <p className="text-xs text-zinc-400 mt-0.5">
                Manage Flutter runtime parameters, environment secrets, and Android signing keys.
              </p>
            </div>
          </div>

          <ProjectConfigurationContent />
        </div>
      </AppShell>
    </ProjectConfigProvider>
  );
}
