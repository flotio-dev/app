"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import BuildsList from "@/components/builds/BuildsList";
import StartBuildModal from "@/components/builds/StartBuildModal";
import { Button } from "@/components/ui/Button";
import { FiPlay } from "react-icons/fi";

export default function ProjectBuildsPage() {
  const params = useParams();
  const projectId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const [openStartModal, setOpenStartModal] = useState(false);

  return (
    <AppShell
      projectId={projectId}
      headerActions={
        <Button
          variant="primary"
          size="sm"
          leftIcon={<FiPlay className="h-3.5 w-3.5" />}
          onClick={() => setOpenStartModal(true)}
        >
          Start Build
        </Button>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Build History</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Track execution progress, step timings, and output binaries for this project.
            </p>
          </div>
        </div>

        <BuildsList projectId={projectId} />
      </div>

      <StartBuildModal
        open={openStartModal}
        projectId={projectId}
        onClose={() => setOpenStartModal(false)}
        onStartBuild={() => {}}
      />
    </AppShell>
  );
}
