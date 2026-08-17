"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useProjectConfig } from "@/context/ProjectConfigContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { FlutterVersion, ProjectConfig } from "@/lib/api/types";
import { FiSliders, FiEdit2, FiCheck, FiX, FiFolder, FiCpu } from "react-icons/fi";

type ProjectView = {
  id?: string | number;
  name?: string;
  created_at?: string;
  updated_at?: string;
  flutter_version?: string;
  build_folder?: string;
  config?: ProjectConfig | null;
};

export default function ProjectDatas() {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: "", build_folder: "", flutter_version: "" });
  const [project, setProject] = useState<ProjectView | null>(null);
  const [flutterVersions, setFlutterVersions] = useState<FlutterVersion[]>([]);
  const [loadingFlutterVersions, setLoadingFlutterVersions] = useState(false);
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
      const initialFlutterVersion =
        payloadProject.flutter_version || payloadProject.config?.flutter_version || "";
      const initialBuildFolder =
        payloadProject.build_folder || payloadProject.config?.project_path || "";
      setForm({
        name: payloadProject.name || "",
        build_folder: initialBuildFolder,
        flutter_version: initialFlutterVersion,
      });
    }
  }, [ctxProject, config, params.id]);

  useEffect(() => {
    let cancelled = false;
    const fetchFlutterVersions = async () => {
      setLoadingFlutterVersions(true);
      try {
        const data = await client.flutter.versions();
        const versions = Array.isArray(data?.versions)
          ? data.versions.filter((item) => item?.version)
          : [];
        if (!cancelled) setFlutterVersions(versions);
      } catch (err) {
        console.error("Failed to fetch flutter versions", err);
      } finally {
        if (!cancelled) setLoadingFlutterVersions(false);
      }
    };
    fetchFlutterVersions();
    return () => {
      cancelled = true;
    };
  }, [client]);

  const handleSave = async () => {
    if (!project || project.id === undefined || project.id === null) return;
    setIsSaving(true);
    try {
      const currentConfig = project.config || {};
      const data = await client.projects.update(Number(project.id), {
        name: form.name,
        config: {
          ...currentConfig,
          project_path: form.build_folder,
          flutter_version: form.flutter_version,
        },
      });

      const nextConfig = data.project?.config || {
        ...currentConfig,
        project_path: form.build_folder,
        flutter_version: form.flutter_version,
      };

      setProject({
        ...project,
        name: data.project?.name ?? form.name,
        config: nextConfig,
        flutter_version: nextConfig.flutter_version ?? form.flutter_version,
        build_folder: nextConfig.project_path ?? form.build_folder,
      });
      setEditMode(false);
    } catch (e) {
      console.error("Failed to update project", e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!project) return null;

  return (
    <Card className="p-0 overflow-hidden mb-6">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FiSliders className="h-4 w-4 text-cyan-400" />
          <CardTitle>Project Details</CardTitle>
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
              Save Changes
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
            label="Project Name"
            value={form.name}
            disabled={!editMode}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="bg-zinc-900 border-zinc-800"
          />

          <Input
            label="Build Folder (project_path)"
            value={form.build_folder}
            disabled={!editMode}
            onChange={(e) => setForm((prev) => ({ ...prev, build_folder: e.target.value }))}
            className="bg-zinc-900 border-zinc-800"
          />

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Flutter Version
            </label>
            {editMode ? (
              <select
                value={form.flutter_version}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, flutter_version: e.target.value }))
                }
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              >
                {flutterVersions.map((v) => (
                  <option key={`${v.channel}-${v.version}`} value={v.version ?? ""}>
                    {v.version} ({v.channel})
                  </option>
                ))}
              </select>
            ) : (
              <div className="h-9 px-3 py-2 rounded-md border border-zinc-800 bg-zinc-950 text-sm text-zinc-200 flex items-center gap-2">
                <Badge variant="neutral" size="sm">
                  {form.flutter_version || "Default (3.19.0)"}
                </Badge>
              </div>
            )}
          </div>
        </div>

        <div className="pt-2 text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/40">
          <span>ID: {project.id}</span>
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
