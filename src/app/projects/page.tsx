"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import ListingProjects from "@/components/projects/ListingProjects";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FiPlus, FiSearch } from "react-icons/fi";

export default function ProjectsPage() {
  const [search, setSearch] = useState("");

  return (
    <AppShell
      headerActions={
        <div className="flex items-center gap-3">
          <div className="w-48 sm:w-64">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftElement={<FiSearch className="h-3.5 w-3.5" />}
              className="h-8 text-xs bg-zinc-900/80 border-zinc-800"
            />
          </div>
          <Link href="/new-project">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<FiPlus className="h-3.5 w-3.5" />}
            >
              New Project
            </Button>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">Projects</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage your connected mobile application repositories and CI/CD pipelines.
            </p>
          </div>
        </div>

        <ListingProjects search={search} />
      </div>
    </AppShell>
  );
}
