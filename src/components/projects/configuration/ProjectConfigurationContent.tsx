"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { useProjectConfig } from "@/context/ProjectConfigContext";
import ProjectEnvironmentVariablesCard from "./ProjectEnvironmentVariablesCard";
import ProjectKeyStoreCard from "./ProjectKeyStoreCard";
import { AccordionSection, AccordionGroup } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  FiCpu,
  FiSliders,
  FiShield,
  FiAlertTriangle,
  FiTrash2,
  FiCheck,
} from "react-icons/fi";

const ProjectConfigurationContent: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const projectId = Array.isArray(params.id) ? params.id[0] : (params.id as string);
  const { client } = useApi();
  const { project, config, refresh } = useProjectConfig();

  const [flutterVersion, setFlutterVersion] = useState(config?.flutter_version || "3.19.0");
  const [projectPath, setProjectPath] = useState(config?.project_path || ".");
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSaveFlutterSettings = async () => {
    if (!projectId) return;
    setIsSavingConfig(true);
    try {
      await client.projects.updateConfig(Number(projectId), {
        ...config,
        flutter_version: flutterVersion,
        project_path: projectPath,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      try {
        await refresh();
      } catch {}
    } catch (err) {
      console.error("Failed to save flutter config", err);
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
      <AccordionGroup>
        {/* Accordion 1: Flutter & Build Runtime Defaults */}
        <AccordionSection
          defaultOpen={true}
          title="Flutter & Build Defaults"
          description="Default SDK channel, target directory, and build parameters for automated pipelines."
          icon={<FiCpu className="h-4 w-4 text-cyan-400" />}
        >
          <div className="space-y-4 pt-3">
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
                helperText="Target Flutter SDK version to download."
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800/40">
              {saveSuccess && (
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <FiCheck className="h-3.5 w-3.5" />
                  Settings updated successfully
                </span>
              )}
              <div className="flex-1" />
              <Button
                variant="primary"
                size="sm"
                isLoading={isSavingConfig}
                onClick={handleSaveFlutterSettings}
              >
                Save Defaults
              </Button>
            </div>
          </div>
        </AccordionSection>

        {/* Accordion 2: Environment Variables */}
        <ProjectEnvironmentVariablesCard projectId={projectId} />

        {/* Accordion 3: Android Keystores & Signing */}
        <ProjectKeyStoreCard projectId={projectId} />

        {/* Accordion 4: Danger Zone */}
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
          This action cannot be undone. All pipeline data will be lost.
        </p>
      </Modal>
    </div>
  );
};

export default ProjectConfigurationContent;
