"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useProjectConfig } from "@/context/ProjectConfigContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ProjectConfig } from "@/lib/api/types";
import { FiGithub, FiEdit2, FiCheck, FiX, FiKey, FiUser, FiGlobe } from "react-icons/fi";

type ProjectView = {
  id?: string | number;
  updated_at?: string;
  git_repo?: string;
  git_token?: string;
  git_username?: string;
  config?: ProjectConfig | null;
};

export default function ProjectGitDatas() {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ gitUsername: "", repoUrl: "", gitToken: "" });
  const [project, setProject] = useState<ProjectView | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const params = useParams();
  const { client } = useApi();
  const { project: ctxProject, config } = useProjectConfig();

  useEffect(() => {
    if (!ctxProject && !config) return;
    const payloadProject: ProjectView = ctxProject
      ? { ...ctxProject, config: ctxProject.config ?? null }
      : { id: Array.isArray(params.id) ? params.id[0] : params.id, config: config ?? null };

    if (payloadProject) {
      setProject(payloadProject);
      setForm({
        gitUsername: payloadProject.git_username || payloadProject.config?.git_username || "",
        repoUrl: payloadProject.git_repo || payloadProject.config?.git_repo || "",
        gitToken: payloadProject.git_token || payloadProject.config?.git_token || "",
      });
    }
  }, [ctxProject, config]);

  const handleSave = async () => {
    if (!project || project.id === undefined || project.id === null) return;
    setIsSaving(true);
    try {
      const currentConfig = project.config || {};
      const data = await client.projects.updateConfig(Number(project.id), {
        ...currentConfig,
        git_repo: form.repoUrl,
        git_token: form.gitToken,
        git_username: form.gitUsername,
      });

      const nextConfig = data.config || {
        ...currentConfig,
        git_repo: form.repoUrl,
        git_token: form.gitToken,
        git_username: form.gitUsername,
      };

      setProject({
        ...project,
        config: nextConfig,
        git_repo: nextConfig.git_repo ?? form.repoUrl,
        git_token: nextConfig.git_token ?? form.gitToken,
        git_username: nextConfig.git_username ?? form.gitUsername,
      });
      setEditMode(false);
    } catch (e) {
      console.error("Failed to update git config", e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!project) return null;

  return (
    <Card className="p-0 overflow-hidden mb-6">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FiGithub className="h-4 w-4 text-cyan-400" />
          <CardTitle>Git Repository & Authentication</CardTitle>
        </div>

        {editMode ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiX className="h-3 w-3" />}
              onClick={() => setEditMode(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<FiCheck className="h-3 w-3" />}
              onClick={handleSave}
            >
              Save Git Settings
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FiEdit2 className="h-3 w-3" />}
            onClick={() => setEditMode(true)}
          >
            Edit
          </Button>
        )}
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Git Username"
            value={form.gitUsername}
            disabled={!editMode}
            leftElement={<FiUser className="h-3.5 w-3.5" />}
            onChange={(e) => setForm((prev) => ({ ...prev, gitUsername: e.target.value }))}
            className="bg-zinc-900 border-zinc-800"
          />

          <Input
            label="Repository URL"
            value={form.repoUrl}
            disabled={!editMode}
            leftElement={<FiGlobe className="h-3.5 w-3.5" />}
            onChange={(e) => setForm((prev) => ({ ...prev, repoUrl: e.target.value }))}
            className="bg-zinc-900 border-zinc-800 font-mono text-xs"
          />

          <Input
            label="Git Access Token"
            type={editMode ? "text" : "password"}
            value={editMode ? form.gitToken : form.gitToken ? "••••••••••••" : ""}
            disabled={!editMode}
            leftElement={<FiKey className="h-3.5 w-3.5" />}
            onChange={(e) => setForm((prev) => ({ ...prev, gitToken: e.target.value }))}
            placeholder={editMode ? "Enter personal access token" : "No token configured"}
            className="bg-zinc-900 border-zinc-800"
          />
        </div>

        <div className="pt-2 text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/40">
          <span>Git source: {form.repoUrl.includes("github.com") ? "GitHub" : "External Git"}</span>
          <span>
            Last updated:{" "}
            {project.updated_at
              ? formatDistanceToNow(parseISO(project.updated_at), { addSuffix: true })
              : "N/A"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
