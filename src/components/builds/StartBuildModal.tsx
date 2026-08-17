"use client";

import React, { useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useBuildRefresh } from "@/context/BuildRefreshContext";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FiPlay, FiGitBranch, FiSmartphone, FiCpu } from "react-icons/fi";

interface StartBuildModalProps {
  open: boolean;
  projectId?: string;
  onClose: () => void;
  onStartBuild: (config: BuildConfig) => void;
}

export interface BuildConfig {
  environment: string;
  baseDirectory: string;
  platform: string;
  gitRef: string;
}

const StartBuildModal: React.FC<StartBuildModalProps> = ({
  open,
  projectId,
  onClose,
  onStartBuild,
}) => {
  const { client } = useApi();
  const { triggerRefresh } = useBuildRefresh();

  const [environment, setEnvironment] = useState("RELEASE");
  const [flutterChannel, setFlutterChannel] = useState("STABLE");
  const [buildTarget, setBuildTarget] = useState("APK");
  const [gitRef, setGitRef] = useState("main");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartBuild = async () => {
    if (!projectId) return;
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        build_mode: environment.toLowerCase(),
        build_target: buildTarget.toLowerCase(),
        platform: "android",
        git_branch: gitRef.trim().toLowerCase(),
        flutter_channel: flutterChannel.toLowerCase(),
      };

      await client.builds.start(Number(projectId), payload);

      // Trigger immediate refresh
      triggerRefresh(projectId);

      onStartBuild({
        environment,
        baseDirectory: "/",
        platform: buildTarget,
        gitRef,
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("Error starting build:", err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Start New Pipeline Build"
      description="Configure target build options, git branch, and Flutter runtime parameters."
      maxWidth="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isLoading}
            leftIcon={<FiPlay className="h-3.5 w-3.5" />}
            onClick={handleStartBuild}
          >
            Trigger Build
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Git Branch / Ref */}
        <Input
          label="Git Branch or Tag Ref"
          value={gitRef}
          onChange={(e) => setGitRef(e.target.value)}
          leftElement={<FiGitBranch className="h-3.5 w-3.5" />}
          placeholder="main"
          className="bg-zinc-900 border-zinc-800"
          helperText="The branch, tag, or commit hash to check out and build."
        />

        {/* Build Mode Selector */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Build Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "RELEASE", label: "Release", desc: "Optimized production binary" },
              { key: "PROFILE", label: "Profile", desc: "Performance profiling" },
              { key: "DEBUG", label: "Debug", desc: "Quick test build with symbols" },
            ].map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setEnvironment(mode.key)}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  environment === mode.key
                    ? "border-cyan-500/80 bg-cyan-950/20 text-cyan-200"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="text-xs font-semibold text-zinc-100">{mode.label}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{mode.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Build Target Selector */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Target Package Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "APK", label: "Android APK", desc: "Direct device installation file" },
              { key: "AAB", label: "Android App Bundle", desc: "Google Play Store publishing format" },
            ].map((target) => (
              <button
                key={target.key}
                type="button"
                onClick={() => setBuildTarget(target.key)}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  buildTarget === target.key
                    ? "border-cyan-500/80 bg-cyan-950/20 text-cyan-200"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                <div className="text-xs font-semibold text-zinc-100">{target.label}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5">{target.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Flutter Channel */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Flutter Channel
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["STABLE", "BETA", "DEV"].map((channel) => (
              <button
                key={channel}
                type="button"
                onClick={() => setFlutterChannel(channel)}
                className={`py-2 px-3 rounded-lg border text-center text-xs font-medium transition-colors cursor-pointer ${
                  flutterChannel === channel
                    ? "border-cyan-500/80 bg-cyan-950/20 text-cyan-200"
                    : "border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700"
                }`}
              >
                {channel}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default StartBuildModal;
