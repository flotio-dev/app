"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useProjectConfig } from "@/context/ProjectConfigContext";
import ProjectEnvironmentVariablesCard from "./ProjectEnvironmentVariablesCard";
import ProjectKeyStoreCard from "./ProjectKeyStoreCard";
import { AccordionSection, AccordionGroup } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { ProjectConfig } from "@/lib/api/types";
import {
  FiCpu,
  FiSliders,
  FiShield,
  FiAlertTriangle,
  FiTrash2,
  FiCheck,
  FiTerminal,
  FiCheckSquare,
  FiUploadCloud,
  FiLayers,
} from "react-icons/fi";

const ProjectConfigurationContent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { client } = useApi();
  const { project, config, refresh } = useProjectConfig();

  // Form states
  // 1. Build & Runtime Defaults
  const [flutterVersion, setFlutterVersion] = useState("3.19.0");
  const [projectPath, setProjectPath] = useState(".");
  const [buildMode, setBuildMode] = useState<string>("release");
  const [androidBuildFormat, setAndroidBuildFormat] = useState<string>("aab");
  const [platforms, setPlatforms] = useState<string[]>(["android"]);
  const [androidBuildArgs, setAndroidBuildArgs] = useState("");
  const [webBuildArgs, setWebBuildArgs] = useState("");
  const [dependencyCaching, setDependencyCaching] = useState(true);

  // 2. Testing & Quality Gates
  const [enableFlutterAnalyze, setEnableFlutterAnalyze] = useState(false);
  const [flutterAnalyzeArgs, setFlutterAnalyzeArgs] = useState("");
  const [enableFlutterTest, setEnableFlutterTest] = useState(false);
  const [flutterTestArgs, setFlutterTestArgs] = useState("");
  const [enableFlutterDriver, setEnableFlutterDriver] = useState(false);
  const [flutterDriverArgs, setFlutterDriverArgs] = useState("");
  const [publishEvenIfTestsFail, setPublishEvenIfTestsFail] = useState(false);

  // 3. Lifecycle Scripts
  const [postCloneScript, setPostCloneScript] = useState("");
  const [preTestScript, setPreTestScript] = useState("");
  const [postTestScript, setPostTestScript] = useState("");
  const [preBuildScript, setPreBuildScript] = useState("");
  const [postBuildScript, setPostBuildScript] = useState("");

  // 4. Distribution & Google Play
  const [packageName, setPackageName] = useState("");
  const [enableGooglePlayPublishing, setEnableGooglePlayPublishing] = useState(false);
  const [googlePlayTrack, setGooglePlayTrack] = useState("internal");
  const [rolloutFraction, setRolloutFraction] = useState("1.0");
  const [submitAsDraft, setSubmitAsDraft] = useState(false);
  const [doNotSendForReview, setDoNotSendForReview] = useState(false);
  const [googlePlayCredentialsId, setGooglePlayCredentialsId] = useState<number | null>(null);
  const [googlePlayCredentialsList, setGooglePlayCredentialsList] = useState<Array<{ id?: number; name?: string }>>([]);
  const [openGooglePlayModal, setOpenGooglePlayModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyJson, setNewKeyJson] = useState("");
  const [isUploadingKey, setIsUploadingKey] = useState(false);
  const [keyUploadError, setKeyUploadError] = useState<string | null>(null);

  // UI States
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccessSection, setSaveSuccessSection] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGooglePlayCredentials = async () => {
    try {
      const data = await client.googlePlayCredentials.list();
      setGooglePlayCredentialsList(data.google_play_credentials ?? []);
    } catch (err) {
      console.error("Failed to load Google Play credentials", err);
    }
  };

  useEffect(() => {
    fetchGooglePlayCredentials();
  }, []);

  // Sync state from config
  useEffect(() => {
    if (config) {
      setFlutterVersion(config.flutter_version || "3.19.0");
      setProjectPath(config.project_path || ".");
      setBuildMode(config.build_mode || "release");
      setAndroidBuildFormat(config.android_build_format || "aab");
      setPlatforms(config.platforms && config.platforms.length > 0 ? config.platforms.filter(p => p !== 'ios') : ["android"]);
      setAndroidBuildArgs(config.android_build_args || "");
      setWebBuildArgs(config.web_build_args || "");
      setDependencyCaching(config.dependency_caching ?? true);

      setEnableFlutterAnalyze(Boolean(config.enable_flutter_analyze));
      setFlutterAnalyzeArgs(config.flutter_analyze_args || "");
      setEnableFlutterTest(Boolean(config.enable_flutter_test));
      setFlutterTestArgs(config.flutter_test_args || "");
      setEnableFlutterDriver(Boolean(config.enable_flutter_driver));
      setFlutterDriverArgs(config.flutter_driver_args || "");
      setPublishEvenIfTestsFail(Boolean(config.publish_even_if_tests_fail));

      setPostCloneScript(config.post_clone_script || "");
      setPreTestScript(config.pre_test_script || "");
      setPostTestScript(config.post_test_script || "");
      setPreBuildScript(config.pre_build_script || "");
      setPostBuildScript(config.post_build_script || "");

      setPackageName(config.package_name || "");
      setEnableGooglePlayPublishing(Boolean(config.enable_google_play_publishing));
      setGooglePlayTrack(config.google_play_track || "internal");
      setRolloutFraction(config.rollout_fraction !== undefined ? String(config.rollout_fraction) : "1.0");
      setSubmitAsDraft(Boolean(config.submit_as_draft));
      setDoNotSendForReview(Boolean(config.do_not_send_for_review));
      const rawGPCredId = config.google_play_credentials_id ?? null;
      setGooglePlayCredentialsId(rawGPCredId === 0 ? null : rawGPCredId);
    }
  }, [config]);

  const togglePlatform = (p: string) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  const handleUploadGooglePlayKey = async () => {
    if (!newKeyName.trim() || !newKeyJson.trim()) {
      setKeyUploadError("Please provide a name and the JSON service account key.");
      return;
    }

    try {
      JSON.parse(newKeyJson);
    } catch {
      setKeyUploadError("The provided key is not valid JSON.");
      return;
    }

    setIsUploadingKey(true);
    setKeyUploadError(null);

    try {
      const res = await client.googlePlayCredentials.create({
        name: newKeyName.trim(),
        credentials: newKeyJson.trim(),
      });
      const created = res.google_play_credentials;
      await fetchGooglePlayCredentials();
      if (created?.id) {
        setGooglePlayCredentialsId(created.id);
      }
      setOpenGooglePlayModal(false);
      setNewKeyName("");
      setNewKeyJson("");
    } catch (err: unknown) {
      setKeyUploadError(err instanceof Error ? err.message : "Failed to upload Google Play credentials");
    } finally {
      setIsUploadingKey(false);
    }
  };

  const handleSaveConfig = async (sectionKey: string) => {
    if (!projectId) return;
    setIsSavingConfig(true);
    setSaveError(null);

    const parsedRollout = parseFloat(rolloutFraction);

    const updatedConfig: Partial<ProjectConfig> = {
      flutter_version: flutterVersion,
      project_path: projectPath,
      build_mode: buildMode,
      android_build_format: androidBuildFormat,
      platforms: platforms.filter(p => p !== 'ios'),
      android_build_args: androidBuildArgs,
      web_build_args: webBuildArgs,
      dependency_caching: dependencyCaching,

      enable_flutter_analyze: enableFlutterAnalyze,
      flutter_analyze_args: flutterAnalyzeArgs,
      enable_flutter_test: enableFlutterTest,
      flutter_test_args: flutterTestArgs,
      enable_flutter_driver: enableFlutterDriver,
      flutter_driver_args: flutterDriverArgs,
      publish_even_if_tests_fail: publishEvenIfTestsFail,

      post_clone_script: postCloneScript,
      pre_test_script: preTestScript,
      post_test_script: postTestScript,
      pre_build_script: preBuildScript,
      post_build_script: postBuildScript,

      package_name: packageName,
      enable_google_play_publishing: enableGooglePlayPublishing,
      google_play_track: googlePlayTrack,
      rollout_fraction: isNaN(parsedRollout) ? 1.0 : parsedRollout,
      submit_as_draft: submitAsDraft,
      do_not_send_for_review: doNotSendForReview,
      google_play_credentials_id: googlePlayCredentialsId ?? undefined,
    };

    try {
      await client.projects.updateConfig(Number(projectId), updatedConfig);
      setSaveSuccessSection(sectionKey);
      setTimeout(() => setSaveSuccessSection(null), 3000);
      try {
        await refresh();
      } catch {}
    } catch (err: unknown) {
      console.error("Failed to save configuration", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    setIsDeleting(true);
    try {
      await client.projects.remove(Number(projectId));
      router.push("/projects");
    } catch (err) {
      console.error("Failed to delete project", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {saveError && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <FiAlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      <AccordionGroup>
        {/* Accordion 1: Flutter & Build Runtime */}
        <AccordionSection
          defaultOpen={true}
          title="Flutter & Build Defaults"
          description="SDK channels, target build path, output format, and platform configurations."
          icon={<FiCpu className="h-4 w-4 text-cyan-400" />}
          badge={<Badge variant="info" size="sm">Core</Badge>}
        >
          <div className="space-y-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Target Build Path (project_path)"
                value={projectPath}
                onChange={(e) => setProjectPath(e.target.value)}
                placeholder="."
                className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                helperText="Relative path containing pubspec.yaml."
              />

              <Input
                label="Default Flutter Version"
                value={flutterVersion}
                onChange={(e) => setFlutterVersion(e.target.value)}
                placeholder="3.19.0"
                className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                helperText="Target Flutter SDK release to download during builds."
              />
            </div>

            {/* Build Mode & Android Format */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Build Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "release", label: "Release" },
                    { key: "debug", label: "Debug" },
                    { key: "profile", label: "Profile" },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => setBuildMode(mode.key)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                        buildMode === mode.key
                          ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300 font-semibold shadow-xs"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Android Build Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "aab", label: "AAB (App Bundle)" },
                    { key: "apk", label: "APK (Binary)" },
                  ].map((format) => (
                    <button
                      key={format.key}
                      type="button"
                      onClick={() => setAndroidBuildFormat(format.key)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all cursor-pointer text-center ${
                        androidBuildFormat === format.key
                          ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-300 font-semibold shadow-xs"
                          : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      {format.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Platforms */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Target Platforms
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  { key: "android", label: "Android" },
                  { key: "web", label: "Web" },
                ].map((p) => {
                  const isSelected = platforms.includes(p.key);
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => togglePlatform(p.key)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-cyan-950/50 border-cyan-500/60 text-cyan-300"
                          : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Build Args */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <Input
                label="Android Build Args"
                value={androidBuildArgs}
                onChange={(e) => setAndroidBuildArgs(e.target.value)}
                placeholder="--dart-define=KEY=VAL"
                className="bg-zinc-900 border-zinc-800 font-mono text-xs"
              />
              <Input
                label="Web Build Args"
                value={webBuildArgs}
                onChange={(e) => setWebBuildArgs(e.target.value)}
                placeholder="--web-renderer html"
                className="bg-zinc-900 border-zinc-800 font-mono text-xs"
              />
            </div>

            {/* Dependency Caching */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
              <div>
                <span className="text-xs font-medium text-zinc-200 block">
                  Enable Dependency Caching
                </span>
                <span className="text-[11px] text-zinc-500">
                  Caches pubspec packages and Gradle dependencies between pipeline builds.
                </span>
              </div>
              <input
                type="checkbox"
                checked={dependencyCaching}
                onChange={(e) => setDependencyCaching(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
              {saveSuccessSection === "build" && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <FiCheck className="h-3.5 w-3.5" />
                  Build defaults saved successfully
                </span>
              )}
              <div className="flex-1" />
              <Button
                variant="primary"
                size="sm"
                isLoading={isSavingConfig}
                onClick={() => handleSaveConfig("build")}
              >
                Save Build Defaults
              </Button>
            </div>
          </div>
        </AccordionSection>

        {/* Accordion 2: Testing & Quality Gates */}
        <AccordionSection
          defaultOpen={false}
          title="Testing & Quality Gates"
          description="Static analysis, unit/widget tests, flutter driver, and failure thresholds."
          icon={<FiCheckSquare className="h-4 w-4 text-emerald-400" />}
        >
          <div className="space-y-5 pt-3">
            {/* Flutter Analyze */}
            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200">Flutter Analyze</span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Run static code analysis before building artifacts.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableFlutterAnalyze}
                  onChange={(e) => setEnableFlutterAnalyze(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>
              {enableFlutterAnalyze && (
                <Input
                  label="Analyze Arguments"
                  value={flutterAnalyzeArgs}
                  onChange={(e) => setFlutterAnalyzeArgs(e.target.value)}
                  placeholder="--fatal-infos --fatal-warnings"
                  className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                />
              )}
            </div>

            {/* Flutter Test */}
            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200">Flutter Tests</span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Execute flutter unit and widget test suites.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableFlutterTest}
                  onChange={(e) => setEnableFlutterTest(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>
              {enableFlutterTest && (
                <Input
                  label="Test Arguments"
                  value={flutterTestArgs}
                  onChange={(e) => setFlutterTestArgs(e.target.value)}
                  placeholder="--coverage --concurrency=4"
                  className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                />
              )}
            </div>

            {/* Flutter Driver */}
            <div className="p-3.5 rounded-lg bg-zinc-900/40 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200">Flutter Driver (Integration)</span>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    Run integration test drivers on connected devices or emulators.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={enableFlutterDriver}
                  onChange={(e) => setEnableFlutterDriver(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer h-4 w-4"
                />
              </div>
              {enableFlutterDriver && (
                <Input
                  label="Driver Arguments"
                  value={flutterDriverArgs}
                  onChange={(e) => setFlutterDriverArgs(e.target.value)}
                  placeholder="--target=test_driver/app.dart"
                  className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                />
              )}
            </div>

            {/* Publish even if tests fail */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/40 border border-zinc-800/80">
              <div>
                <span className="text-xs font-medium text-zinc-200 block">
                  Publish Even If Tests Fail
                </span>
                <span className="text-[11px] text-zinc-500">
                  Allow publishing step to proceed even when testing gates report failures.
                </span>
              </div>
              <input
                type="checkbox"
                checked={publishEvenIfTestsFail}
                onChange={(e) => setPublishEvenIfTestsFail(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
              {saveSuccessSection === "testing" && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <FiCheck className="h-3.5 w-3.5" />
                  Testing gates saved successfully
                </span>
              )}
              <div className="flex-1" />
              <Button
                variant="primary"
                size="sm"
                isLoading={isSavingConfig}
                onClick={() => handleSaveConfig("testing")}
              >
                Save Testing Config
              </Button>
            </div>
          </div>
        </AccordionSection>

        {/* Accordion 3: Lifecycle Scripts & Hooks */}
        <AccordionSection
          defaultOpen={false}
          title="Lifecycle Scripts & Hooks"
          description="Custom bash scripts injected into the build pipeline at specific execution phases."
          icon={<FiTerminal className="h-4 w-4 text-purple-400" />}
        >
          <div className="space-y-4 pt-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-zinc-300">
                Post Clone Script
              </label>
              <Textarea
                value={postCloneScript}
                onChange={(e) => setPostCloneScript(e.target.value)}
                placeholder="# Runs immediately after git checkout&#10;flutter pub get"
                rows={3}
                className="bg-black border-zinc-800 font-mono text-xs text-zinc-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Pre Test Script
                </label>
                <Textarea
                  value={preTestScript}
                  onChange={(e) => setPreTestScript(e.target.value)}
                  placeholder="# Runs before test suite starts"
                  rows={3}
                  className="bg-black border-zinc-800 font-mono text-xs text-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Post Test Script
                </label>
                <Textarea
                  value={postTestScript}
                  onChange={(e) => setPostTestScript(e.target.value)}
                  placeholder="# Runs after tests finish"
                  rows={3}
                  className="bg-black border-zinc-800 font-mono text-xs text-zinc-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Pre Build Script
                </label>
                <Textarea
                  value={preBuildScript}
                  onChange={(e) => setPreBuildScript(e.target.value)}
                  placeholder="# Runs right before flutter build"
                  rows={3}
                  className="bg-black border-zinc-800 font-mono text-xs text-zinc-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Post Build Script
                </label>
                <Textarea
                  value={postBuildScript}
                  onChange={(e) => setPostBuildScript(e.target.value)}
                  placeholder="# Runs after flutter build finishes"
                  rows={3}
                  className="bg-black border-zinc-800 font-mono text-xs text-zinc-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
              {saveSuccessSection === "scripts" && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <FiCheck className="h-3.5 w-3.5" />
                  Lifecycle scripts saved successfully
                </span>
              )}
              <div className="flex-1" />
              <Button
                variant="primary"
                size="sm"
                isLoading={isSavingConfig}
                onClick={() => handleSaveConfig("scripts")}
              >
                Save Scripts
              </Button>
            </div>
          </div>
        </AccordionSection>

        {/* Accordion 4: Distribution & Google Play */}
        <AccordionSection
          defaultOpen={false}
          title="Distribution & Store Publishing"
          description="Application package identifier, Google Play release tracks, and rollout parameters."
          icon={<FiUploadCloud className="h-4 w-4 text-amber-400" />}
        >
          <div className="space-y-5 pt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Package Name (Application ID)"
                value={packageName}
                onChange={(e) => setPackageName(e.target.value)}
                placeholder="com.example.myapp"
                className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                helperText="Android applicationId used for Google Play Console identification."
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-zinc-300">
                  Google Play Track
                </label>
                <select
                  value={googlePlayTrack}
                  onChange={(e) => setGooglePlayTrack(e.target.value)}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-100 focus:border-zinc-500 focus:outline-none"
                >
                  <option value="internal">internal (Internal Testing)</option>
                  <option value="alpha">alpha (Closed Testing)</option>
                  <option value="beta">beta (Open Testing)</option>
                  <option value="production">production (Production)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Rollout Fraction (0.0 to 1.0)"
                value={rolloutFraction}
                onChange={(e) => setRolloutFraction(e.target.value)}
                placeholder="1.0"
                type="number"
                step="0.05"
                min="0"
                max="1"
                className="bg-zinc-900 border-zinc-800 font-mono text-xs"
                helperText="1.0 = 100% rollout to all users."
              />

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableGooglePlayPublishing}
                    onChange={(e) => setEnableGooglePlayPublishing(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                  <span>Enable Automated Google Play Publishing</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={submitAsDraft}
                    onChange={(e) => setSubmitAsDraft(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                  <span>Submit as Draft Release</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doNotSendForReview}
                    onChange={(e) => setDoNotSendForReview(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer h-4 w-4"
                  />
                  <span>Do Not Send For Review Immediately</span>
                </label>
              </div>
            </div>

            {/* Google Play Service Account Key */}
            <div className="p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">
                    Google Play Service Account Key (JSON)
                  </span>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Google Cloud Service Account with Google Play Android Developer API permissions.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpenGooglePlayModal(true)}
                >
                  + Add Key
                </Button>
              </div>

              <div className="space-y-1.5">
                <select
                  value={googlePlayCredentialsId ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGooglePlayCredentialsId(val ? Number(val) : null);
                  }}
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-mono text-zinc-100 focus:border-zinc-500 focus:outline-none"
                >
                  <option value="">-- No Google Play key selected --</option>
                  {googlePlayCredentialsList.map((cred) => (
                    <option key={cred.id} value={cred.id}>
                      {cred.name || `Key #${cred.id}`}
                    </option>
                  ))}
                </select>
                {googlePlayCredentialsId && (
                  <p className="text-[11px] text-emerald-400">
                    ✓ Key linked to project for automated Play Store releases.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
              {saveSuccessSection === "distribution" && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <FiCheck className="h-3.5 w-3.5" />
                  Distribution configuration saved successfully
                </span>
              )}
              <div className="flex-1" />
              <Button
                variant="primary"
                size="sm"
                isLoading={isSavingConfig}
                onClick={() => handleSaveConfig("distribution")}
              >
                Save Distribution Config
              </Button>
            </div>
          </div>
        </AccordionSection>

        {/* Accordion 5: Environment Variables */}
        <ProjectEnvironmentVariablesCard projectId={projectId} />

        {/* Accordion 6: Android Keystores & Signing */}
        <ProjectKeyStoreCard projectId={projectId} />

        {/* Accordion 7: Danger Zone */}
        <AccordionSection
          defaultOpen={false}
          title="Danger Zone"
          description="Irreversible actions including project deletion and secret purging."
          icon={<FiAlertTriangle className="h-4 w-4 text-rose-400" />}
        >
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-rose-950/20 border border-rose-500/20">
            <div>
              <h5 className="text-xs font-semibold text-rose-200">Delete Project</h5>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Permanently delete this project, all build logs, and configuration state.
              </p>
            </div>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<FiTrash2 className="h-3.5 w-3.5" />}
              onClick={() => setOpenDeleteModal(true)}
            >
              Delete Project
            </Button>
          </div>
        </AccordionSection>
      </AccordionGroup>

      {/* Upload Google Play Key Modal */}
      <Modal
        isOpen={openGooglePlayModal}
        onClose={() => setOpenGooglePlayModal(false)}
        title="Upload Google Play Service Account Key"
        description="Add a Google Cloud service account JSON key to enable automated Google Play distribution."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenGooglePlayModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isUploadingKey}
              onClick={handleUploadGooglePlayKey}
            >
              Save Key
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {keyUploadError && (
            <div className="p-2.5 rounded bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs">
              {keyUploadError}
            </div>
          )}

          <Input
            label="Key Name"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="e.g. Google Play Console Key"
            className="bg-zinc-900 border-zinc-800 text-xs"
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Upload JSON Key File
            </label>
            <input
              type="file"
              accept=".json,application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const text = event.target?.result as string;
                    setNewKeyJson(text || "");
                    if (!newKeyName) {
                      setNewKeyName(f.name.replace(/\.[^/.]+$/, ""));
                    }
                  };
                  reader.readAsText(f);
                }
              }}
              className="block w-full text-xs text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Or Paste Service Account JSON
            </label>
            <Textarea
              value={newKeyJson}
              onChange={(e) => setNewKeyJson(e.target.value)}
              placeholder="Paste your Google Play service account JSON key content here..."
              rows={5}
              className="bg-zinc-900 border-zinc-800 font-mono text-[11px] text-zinc-200"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={openDeleteModal}
        onClose={() => setOpenDeleteModal(false)}
        title="Delete Project"
        description="Are you sure you want to permanently delete this project?"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeleting}
              onClick={handleDeleteProject}
            >
              Confirm Deletion
            </Button>
          </>
        }
      >
        <p className="text-xs text-rose-300">
          This action cannot be undone. All pipeline data and build configurations will be permanently lost.
        </p>
      </Modal>
    </div>
  );
};

export default ProjectConfigurationContent;
