"use client";

import React, { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useProjectConfig } from "@/context/ProjectConfigContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { GithubRepository, ProjectConfig } from "@/lib/api/types";
import {
  FiGithub,
  FiEdit2,
  FiCheck,
  FiX,
  FiKey,
  FiUser,
  FiGlobe,
  FiSearch,
  FiExternalLink,
  FiRefreshCw,
  FiFolder,
} from "react-icons/fi";

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
  const [gitSource, setGitSource] = useState<"github" | "custom">("github");
  const [form, setForm] = useState({ gitUsername: "", repoUrl: "", gitToken: "" });
  const [project, setProject] = useState<ProjectView | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // GitHub repo picker states
  const [repos, setRepos] = useState<GithubRepository[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [repoSearch, setRepoSearch] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<string>("all");
  const [flutterOnly, setFlutterOnly] = useState(false);

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
      const currentRepoUrl = payloadProject.git_repo || payloadProject.config?.git_repo || "";
      setForm({
        gitUsername: payloadProject.git_username || payloadProject.config?.git_username || "",
        repoUrl: currentRepoUrl,
        gitToken: payloadProject.git_token || payloadProject.config?.git_token || "",
      });

      if (currentRepoUrl && !currentRepoUrl.includes("github.com")) {
        setGitSource("custom");
      } else {
        setGitSource("github");
      }
    }
  }, [ctxProject, config]);

  const fetchGithubRepos = async () => {
    setLoadingRepos(true);
    try {
      const repoList = await client.github.repos();
      const repoItems = Array.isArray(repoList?.repositories) ? repoList.repositories : [];
      setRepos(repoItems);
      setGithubConnected(true);
    } catch {
      setRepos([]);
      setGithubConnected(false);
    } finally {
      setLoadingRepos(false);
    }
  };

  useEffect(() => {
    if (editMode && gitSource === "github") {
      fetchGithubRepos();
    }
  }, [editMode, gitSource]);

  const orgOptions = useMemo(() => {
    const orgs = Array.from(new Set(repos.map((r) => r.owner).filter(Boolean)));
    return orgs.sort();
  }, [repos]);

  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      const q = repoSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.full_name || "").toLowerCase().includes(q) ||
        (r.name || "").toLowerCase().includes(q) ||
        (r.description || "").toLowerCase().includes(q);
      const matchesOrg = selectedOrg === "all" || r.owner === selectedOrg;
      const isFlutter = r.is_flutter || (r.language || "").toLowerCase() === "dart";
      const matchesFlutter = !flutterOnly || isFlutter;
      return matchesSearch && matchesOrg && matchesFlutter;
    });
  }, [repos, repoSearch, selectedOrg, flutterOnly]);

  const handleSelectRepo = (repo: GithubRepository) => {
    const fullName = repo.full_name || `${repo.owner}/${repo.name}`;
    const url = `https://github.com/${fullName}`;
    setForm((prev) => ({
      ...prev,
      repoUrl: url,
      gitUsername: repo.owner ?? prev.gitUsername,
      gitToken: "", // managed by github app
    }));
  };

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

  const isGitHubRepo = form.repoUrl.includes("github.com");

  return (
    <Card className="p-0 overflow-hidden mb-6">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FiGithub className="h-4 w-4 text-cyan-400" />
          <CardTitle>Git Repository & Authentication</CardTitle>
          <Badge
            variant={isGitHubRepo ? "info" : "neutral"}
            size="sm"
          >
            {isGitHubRepo ? "GitHub" : "Custom Git"}
          </Badge>
        </div>

        {editMode ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<FiX className="h-3 w-3" />}
              onClick={() => {
                setEditMode(false);
                // Reset to saved values
                const currentRepoUrl = project.git_repo || project.config?.git_repo || "";
                setForm({
                  gitUsername: project.git_username || project.config?.git_username || "",
                  repoUrl: currentRepoUrl,
                  gitToken: project.git_token || project.config?.git_token || "",
                });
              }}
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
        {/* Edit mode source switcher */}
        {editMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 rounded-lg border border-zinc-800">
              <button
                type="button"
                onClick={() => setGitSource("github")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  gitSource === "github"
                    ? "bg-[#ff5722] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FiGithub className="h-3.5 w-3.5" />
                Select from GitHub
              </button>
              <button
                type="button"
                onClick={() => setGitSource("custom")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  gitSource === "custom"
                    ? "bg-[#ff5722] text-white shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FiGlobe className="h-3.5 w-3.5" />
                Custom / External Git URL
              </button>
            </div>

            {gitSource === "github" && (
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<FiRefreshCw className={`h-3 w-3 ${loadingRepos ? "animate-spin" : ""}`} />}
                onClick={fetchGithubRepos}
                disabled={loadingRepos}
              >
                Refresh Repos
              </Button>
            )}
          </div>
        )}

        {/* Selected Repo Banner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <FiGlobe className="h-4 w-4 text-orange-400 shrink-0" />
            <span className="text-zinc-400">Current Repository:</span>
            <span className="font-mono font-medium text-zinc-100 truncate">
              {form.repoUrl || "No repository configured"}
            </span>
          </div>
          {form.repoUrl && isGitHubRepo && (
            <a
              href={form.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-medium shrink-0 ml-2"
            >
              <span>Open on GitHub</span>
              <FiExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* GitHub Repos Picker when in GitHub Edit Mode */}
        {editMode && gitSource === "github" && (
          <div className="space-y-3 pt-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search repository name or description..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-500 focus:outline-hidden focus:border-[#ff5722] focus:ring-1 focus:ring-[#ff5722]/20"
                />
              </div>

              {orgOptions.length > 1 && (
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="px-3 py-2 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 focus:outline-hidden focus:border-[#ff5722]"
                >
                  <option value="all">All Organizations ({repos.length})</option>
                  {orgOptions.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
              )}

              <button
                type="button"
                onClick={() => setFlutterOnly(!flutterOnly)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
                  flutterOnly
                    ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>Flutter only</span>
              </button>
            </div>

            {/* Repos list container */}
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950/60 max-h-60 overflow-y-auto">
              {loadingRepos ? (
                <div className="p-8 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
                  <FiRefreshCw className="h-4 w-4 animate-spin text-orange-400" />
                  <span>Loading GitHub repositories...</span>
                </div>
              ) : githubConnected === false ? (
                <div className="p-6 text-center text-xs text-zinc-400 space-y-2">
                  <p>GitHub account is not connected or repository access has not been granted.</p>
                  <a
                    href={`https://github.com/apps/${process.env.NEXT_PUBLIC_APP_ID || "flotio-app"}/installations/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ff5722] text-white font-medium text-xs hover:bg-[#e64a19]"
                  >
                    <FiGithub className="h-3.5 w-3.5" />
                    Connect GitHub App
                  </a>
                </div>
              ) : filteredRepos.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No repositories found matching your search.
                </div>
              ) : (
                <div className="divide-y divide-zinc-800/60">
                  {filteredRepos.map((repo) => {
                    const fullName = repo.full_name || `${repo.owner}/${repo.name}`;
                    const isSelected = form.repoUrl.includes(fullName);
                    const isFlutter = repo.is_flutter || (repo.language || "").toLowerCase() === "dart";

                    return (
                      <div
                        key={repo.id || fullName}
                        onClick={() => handleSelectRepo(repo)}
                        className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-orange-500/10 border-l-2 border-[#ff5722]"
                            : "hover:bg-zinc-900/60"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs font-semibold ${isSelected ? "text-orange-300" : "text-zinc-200"}`}>
                              {fullName}
                            </span>
                            {isFlutter && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30">
                                Flutter
                              </span>
                            )}
                            {repo.private && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-zinc-800 text-zinc-400">
                                Private
                              </span>
                            )}
                          </div>
                          {repo.description && (
                            <p className="text-[11px] text-zinc-400 truncate mt-0.5 max-w-md">
                              {repo.description}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-orange-400">
                              <FiCheck className="h-3.5 w-3.5" /> Selected
                            </span>
                          ) : (
                            <Button size="sm" variant="outline">
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Git Inputs (or view mode inputs) */}
        {(!editMode || gitSource === "custom") && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <Input
              label="Git Username"
              value={form.gitUsername}
              disabled={!editMode}
              leftElement={<FiUser className="h-3.5 w-3.5" />}
              onChange={(e) => setForm((prev) => ({ ...prev, gitUsername: e.target.value }))}
              placeholder={editMode ? "e.g. github-user" : "N/A"}
              className="bg-zinc-900 border-zinc-800"
            />

            <Input
              label="Repository URL"
              value={form.repoUrl}
              disabled={!editMode}
              leftElement={<FiGlobe className="h-3.5 w-3.5" />}
              onChange={(e) => setForm((prev) => ({ ...prev, repoUrl: e.target.value }))}
              placeholder="https://github.com/owner/repo.git"
              className="bg-zinc-900 border-zinc-800 font-mono text-xs"
            />

            <Input
              label="Git Access Token"
              type={editMode ? "text" : "password"}
              value={editMode ? form.gitToken : form.gitToken ? "••••••••••••" : ""}
              disabled={!editMode}
              leftElement={<FiKey className="h-3.5 w-3.5" />}
              onChange={(e) => setForm((prev) => ({ ...prev, gitToken: e.target.value }))}
              placeholder={editMode ? "Personal access token (if private)" : isGitHubRepo ? "Managed by GitHub App" : "No token configured"}
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
        )}

        <div className="pt-2 text-[11px] text-zinc-500 flex items-center justify-between border-t border-zinc-800/40">
          <span>
            Git source: {isGitHubRepo ? "Connected GitHub App" : "External Git URL"}
          </span>
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
