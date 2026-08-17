"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import type { FlutterVersion, GithubRepository } from "@/lib/api/types";
import {
  FiFolder,
  FiGithub,
  FiGlobe,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiCpu,
  FiKey,
  FiUser,
} from "react-icons/fi";

const steps = [
  { id: 0, label: "Project Info" },
  { id: 1, label: "Git Repository" },
  { id: 2, label: "Review & Initialize" },
];

export default function NewProjectForm() {
  const router = useRouter();
  const { client } = useApi();

  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState("");
  const [buildFolder, setBuildFolder] = useState(".");
  const [flutterVersion, setFlutterVersion] = useState("3.19.0");
  const [flutterVersions, setFlutterVersions] = useState<FlutterVersion[]>([]);
  const [loadingFlutterVersions, setLoadingFlutterVersions] = useState(false);

  // Git state
  const [gitSource, setGitSource] = useState<"github" | "external">("github");
  const [gitRepo, setGitRepo] = useState("");
  const [repos, setRepos] = useState<GithubRepository[]>([]);
  const [gitToken, setGitToken] = useState("");
  const [gitUsername, setGitUsername] = useState("");
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoSearch, setRepoSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch flutter versions
  useEffect(() => {
    let cancelled = false;
    const fetchFlutterVersions = async () => {
      setLoadingFlutterVersions(true);
      try {
        const data = await client.flutter.versions();
        const versions = Array.isArray(data?.versions)
          ? data.versions.filter((item) => item?.version)
          : [];
        if (!cancelled) {
          setFlutterVersions(versions);
          if (versions.length > 0 && !versions.some((v) => v.version === flutterVersion)) {
            setFlutterVersion(versions[0].version ?? "3.19.0");
          }
        }
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

  // Fetch GitHub repos when entering Git step
  useEffect(() => {
    if (activeStep === 1 && gitSource === "github") {
      let cancelled = false;
      const fetchRepos = async () => {
        setLoadingRepos(true);
        try {
          const repoList = await client.github.repos();
          if (!cancelled) {
            setRepos(Array.isArray(repoList.repositories) ? repoList.repositories : []);
          }
        } catch (err) {
          console.error("Failed to fetch github repos", err);
        } finally {
          if (!cancelled) setLoadingRepos(false);
        }
      };
      fetchRepos();
      return () => {
        cancelled = true;
      };
    }
  }, [activeStep, gitSource, client]);

  const isStep0Valid = name.trim() !== "" && buildFolder.trim() !== "";
  const isStep1Valid = gitRepo.trim() !== "";

  const handleCreateProject = async () => {
    setLoading(true);
    setError(null);
    try {
      // Contract N-3: { name, config } only
      const res = await client.projects.create({
        name: name.trim(),
        config: {
          project_path: buildFolder.trim(),
          flutter_version: flutterVersion,
          git_repo: gitRepo.trim(),
          git_token: gitToken.trim(),
          git_username: gitUsername.trim(),
        },
      });

      const newId = res.project?.id;
      if (newId) {
        router.push(`/projects/${newId}`);
      } else {
        router.push("/projects");
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create project";
      setError(message);
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter((r) =>
    (r.full_name || "").toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <Card className="max-w-2xl w-full mx-auto p-0 overflow-hidden shadow-2xl border-zinc-800 bg-zinc-950">
      {/* Wizard Stepper Header */}
      <div className="px-6 py-4 border-b border-zinc-800/80 bg-zinc-950">
        <div className="flex items-center justify-between">
          {steps.map((step, idx) => {
            const isDone = activeStep > step.id;
            const isCurrent = activeStep === step.id;

            return (
              <React.Fragment key={step.id}>
                <div className="flex items-center gap-2">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold font-mono transition-colors ${
                      isDone
                        ? "bg-emerald-500 text-black"
                        : isCurrent
                        ? "bg-cyan-500 text-black"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {isDone ? <FiCheck className="h-3.5 w-3.5 stroke-[3]" /> : step.id + 1}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isCurrent ? "text-zinc-100 font-semibold" : "text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex-1 h-px bg-zinc-800 mx-3" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Wizard Step Body */}
      <CardContent className="p-6 sm:p-8 space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* STEP 0: Project Info */}
        {activeStep === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Project Details</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Set the project display name and mobile workspace directory.
              </p>
            </div>

            <Input
              label="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Flutter App"
              className="bg-zinc-900 border-zinc-800"
              required
            />

            <Input
              label="Build Folder (project_path)"
              value={buildFolder}
              onChange={(e) => setBuildFolder(e.target.value)}
              placeholder="."
              className="bg-zinc-900 border-zinc-800 font-mono text-xs"
              helperText="Relative path inside the repo containing pubspec.yaml (e.g. '.' or 'packages/app')."
              required
            />

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Flutter SDK Version
              </label>
              <select
                value={flutterVersion}
                onChange={(e) => setFlutterVersion(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
              >
                {flutterVersions.map((v) => (
                  <option key={`${v.channel}-${v.version}`} value={v.version ?? ""}>
                    Flutter {v.version} ({v.channel})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* STEP 1: Git Configuration */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Source Repository</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Connect via your GitHub account or specify an external Git URL.
              </p>
            </div>

            {/* Source Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setGitSource("github")}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  gitSource === "github"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FiGithub className="h-4 w-4" />
                GitHub Account
              </button>

              <button
                type="button"
                onClick={() => setGitSource("external")}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  gitSource === "external"
                    ? "bg-zinc-800 text-white shadow-xs"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <FiGlobe className="h-4 w-4" />
                External Git URL
              </button>
            </div>

            {gitSource === "github" ? (
              <div className="space-y-3 pt-2">
                <Input
                  placeholder="Search connected repositories..."
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 text-xs"
                />

                <div className="rounded-lg border border-zinc-800 bg-zinc-950 max-h-56 overflow-y-auto divide-y divide-zinc-850">
                  {loadingRepos ? (
                    <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                      Loading GitHub repositories...
                    </div>
                  ) : filteredRepos.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500">
                      No GitHub repositories found. Connect your account in Preferences.
                    </div>
                  ) : (
                    filteredRepos.map((repo) => {
                      const url = `https://github.com/${repo.full_name}`;
                      const isSelected = gitRepo === url;

                      return (
                        <div
                          key={repo.id}
                          onClick={() => setGitRepo(url)}
                          className={`p-3 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-cyan-950/30 text-cyan-200"
                              : "hover:bg-zinc-900/60 text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate font-mono">
                            <FiGithub className="h-4 w-4 text-zinc-500 shrink-0" />
                            <span className="truncate">{repo.full_name}</span>
                          </div>
                          {isSelected && <FiCheck className="h-4 w-4 text-cyan-400" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <Input
                  label="Repository URL"
                  value={gitRepo}
                  onChange={(e) => setGitRepo(e.target.value)}
                  placeholder="https://github.com/org/repo.git"
                  className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Git Username"
                    value={gitUsername}
                    onChange={(e) => setGitUsername(e.target.value)}
                    placeholder="Optional for public repos"
                    className="bg-zinc-900 border-zinc-800"
                  />

                  <Input
                    label="Personal Access Token"
                    type="password"
                    value={gitToken}
                    onChange={(e) => setGitToken(e.target.value)}
                    placeholder="Optional for public repos"
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Review & Initialize */}
        {activeStep === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-zinc-100">Review & Confirm</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Confirm your configuration before initializing the project pipeline.
              </p>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 divide-y divide-zinc-800/60 overflow-hidden text-xs">
              <div className="p-3.5 flex justify-between">
                <span className="text-zinc-500">Project Name</span>
                <span className="font-semibold text-zinc-100">{name}</span>
              </div>
              <div className="p-3.5 flex justify-between">
                <span className="text-zinc-500">Build Folder</span>
                <span className="font-mono text-zinc-200">{buildFolder}</span>
              </div>
              <div className="p-3.5 flex justify-between">
                <span className="text-zinc-500">Flutter Version</span>
                <Badge variant="neutral" size="sm">
                  {flutterVersion}
                </Badge>
              </div>
              <div className="p-3.5 flex justify-between">
                <span className="text-zinc-500">Git Source</span>
                <span className="text-zinc-200">
                  {gitSource === "github" ? "GitHub Account" : "External Git"}
                </span>
              </div>
              <div className="p-3.5 flex justify-between">
                <span className="text-zinc-500">Repository URL</span>
                <span className="font-mono text-cyan-300 truncate max-w-xs">
                  {gitRepo}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
          <Button
            variant="outline"
            size="sm"
            disabled={activeStep === 0 || loading}
            leftIcon={<FiArrowLeft className="h-3.5 w-3.5" />}
            onClick={() => setActiveStep((prev) => prev - 1)}
          >
            Back
          </Button>

          {activeStep < 2 ? (
            <Button
              variant="primary"
              size="sm"
              disabled={
                (activeStep === 0 && !isStep0Valid) ||
                (activeStep === 1 && !isStep1Valid)
              }
              rightIcon={<FiArrowRight className="h-3.5 w-3.5" />}
              onClick={() => setActiveStep((prev) => prev + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              isLoading={loading}
              onClick={handleCreateProject}
            >
              Create Project
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
