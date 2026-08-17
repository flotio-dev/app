"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import NewProjectForm from "@/components/newProject/NewProjectForm";

export default function NewProjectPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="text-center max-w-lg mx-auto pt-2 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Create a New Project
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Connect a mobile application repository to automatically build, test, and release your Flutter binaries.
          </p>
        </div>

        <NewProjectForm />
      </div>
    </AppShell>
  );
}
