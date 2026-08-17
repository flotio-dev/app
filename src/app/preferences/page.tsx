"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import ProfileSettings from "@/components/preferences/ProfileSettings";
import GithubConnect from "@/components/preferences/GithubConnect";

export default function PreferencesPage() {
  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">
              Account & Preferences
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Manage your personal developer profile, connected GitHub integrations, and preferences.
            </p>
          </div>
        </div>

        <ProfileSettings />
        <GithubConnect />
      </div>
    </AppShell>
  );
}
