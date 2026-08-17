"use client";

import React, { useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { AccordionSection } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { EnvCreateRequest, EnvDTO } from "@/lib/api/types";
import {
  FiSliders,
  FiPlus,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiCheck,
  FiFileText,
  FiLock,
} from "react-icons/fi";

export interface EnvVariableState {
  id: string;
  apiId?: number;
  key: string;
  value: string;
  type?: "env" | "file";
  path?: string;
  isBase64?: boolean;
}

interface ProjectEnvironmentVariablesCardProps {
  projectId?: string;
}

export default function ProjectEnvironmentVariablesCard({
  projectId,
}: ProjectEnvironmentVariablesCardProps) {
  const { client } = useApi();
  const [variables, setVariables] = useState<EnvVariableState[]>([]);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [editingVar, setEditingVar] = useState<EnvVariableState | null>(null);
  const [modalKey, setModalKey] = useState("");
  const [modalValue, setModalValue] = useState("");
  const [modalType, setModalType] = useState<"env" | "file">("env");
  const [modalPath, setModalPath] = useState("");
  const [modalBase64, setModalBase64] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEnvVariables = async () => {
    if (!projectId) return;
    try {
      const data = await client.envs.list(Number(projectId));
      const list = data.envs ?? [];
      setVariables(
        list.map((item) => ({
          id: String(item.id ?? crypto.randomUUID()),
          apiId: item.id,
          key: item.key ?? "",
          value: item.value ?? "",
          type: item.type === "file" ? "file" : "env",
          path: item.path ?? "",
          isBase64: Boolean(item.is_base64),
        }))
      );
    } catch (err) {
      console.error("Failed to load env variables", err);
    }
  };

  useEffect(() => {
    fetchEnvVariables();
  }, [projectId]);

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAddModal = () => {
    setEditingVar(null);
    setModalKey("");
    setModalValue("");
    setModalType("env");
    setModalPath("");
    setModalBase64(false);
    setError(null);
    setOpenModal(true);
  };

  const handleOpenEditModal = (v: EnvVariableState) => {
    setEditingVar(v);
    setModalKey(v.key);
    setModalValue(v.value);
    setModalType(v.type || "env");
    setModalPath(v.path || "");
    setModalBase64(Boolean(v.isBase64));
    setError(null);
    setOpenModal(true);
  };

  const handleSaveModal = async () => {
    if (!modalKey.trim()) {
      setError("Variable key cannot be empty.");
      return;
    }
    if (!projectId) return;

    setIsSaving(true);
    setError(null);

    try {
      if (editingVar?.apiId) {
        // Update
        await client.envs.update(editingVar.apiId, {
          key: modalKey.trim(),
          value: modalValue,
          type: modalType,
          path: modalType === "file" ? modalPath : undefined,
          is_base64: modalBase64,
          project_id: Number(projectId),
        });
      } else {
        // Create
        await client.envs.create({
          key: modalKey.trim(),
          value: modalValue,
          type: modalType,
          path: modalType === "file" ? modalPath : undefined,
          is_base64: modalBase64,
          project_id: Number(projectId),
        });
      }
      await fetchEnvVariables();
      setOpenModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save variable";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (apiId?: number) => {
    if (!apiId) return;
    try {
      await client.envs.remove(apiId);
      setVariables((prev) => prev.filter((v) => v.apiId !== apiId));
    } catch (err) {
      console.error("Failed to delete variable", err);
    }
  };

  return (
    <>
      <AccordionSection
        defaultOpen={true}
        title="Environment Variables & Secret Groups"
        description="Encrypted credentials, API keys, and file variables injected during build runtime."
        icon={<FiLock className="h-4 w-4 text-cyan-400" />}
        badge={
          <Badge variant="neutral" size="sm">
            {variables.length} configured
          </Badge>
        }
      >
        <div className="space-y-4 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Values are masked by default. Secrets are safely encrypted at rest and in transit.
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FiPlus className="h-3.5 w-3.5" />}
              onClick={handleOpenAddModal}
            >
              Add Variable
            </Button>
          </div>

          {variables.length === 0 ? (
            <div className="p-8 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
              <p className="text-xs text-zinc-500">No environment variables configured yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
              {variables.map((item) => {
                const isRevealed = revealedIds.has(item.id);
                const isCopied = copiedId === item.id;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono font-bold text-zinc-100">
                        {item.key}
                      </span>
                      <Badge variant="neutral" size="sm">
                        {item.type || "env"}
                      </Badge>
                      {item.isBase64 && (
                        <Badge variant="info" size="sm">
                          Base64
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-mono text-xs text-zinc-400 min-w-0">
                      <span className="truncate max-w-[220px] bg-zinc-900 px-2 py-1 rounded border border-zinc-850">
                        {isRevealed ? item.value : "••••••••••••"}
                      </span>

                      <button
                        type="button"
                        title={isRevealed ? "Hide" : "Reveal"}
                        onClick={() => toggleReveal(item.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        {isRevealed ? <FiEyeOff className="h-3.5 w-3.5" /> : <FiEye className="h-3.5 w-3.5" />}
                      </button>

                      <button
                        type="button"
                        title="Copy Value"
                        onClick={() => copyToClipboard(item.id, item.value)}
                        className="p-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <FiCopy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        title="Edit"
                        onClick={() => handleOpenEditModal(item)}
                        className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        title="Delete"
                        onClick={() => handleDelete(item.apiId)}
                        className="p-1 text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AccordionSection>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title={editingVar ? "Edit Environment Variable" : "Add Environment Variable"}
        description="Set variable key, value, and destination properties."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSaving}
              onClick={handleSaveModal}
            >
              Save Variable
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300">
              {error}
            </div>
          )}

          <Input
            label="Variable Name / Key"
            value={modalKey}
            onChange={(e) => setModalKey(e.target.value)}
            placeholder="e.g. API_SECRET_KEY"
            className="bg-zinc-900 border-zinc-800 font-mono"
            required
          />

          <Input
            label="Variable Value"
            type="password"
            value={modalValue}
            onChange={(e) => setModalValue(e.target.value)}
            placeholder="Enter value"
            className="bg-zinc-900 border-zinc-800 font-mono"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Type
              </label>
              <select
                value={modalType}
                onChange={(e) => setModalType(e.target.value as "env" | "file")}
                className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200"
              >
                <option value="env">Standard Env Variable</option>
                <option value="file">File Path Variable</option>
              </select>
            </div>

            {modalType === "file" && (
              <Input
                label="Target File Destination"
                value={modalPath}
                onChange={(e) => setModalPath(e.target.value)}
                placeholder="android/key.properties"
                className="bg-zinc-900 border-zinc-800 text-xs font-mono"
              />
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={modalBase64}
              onChange={(e) => setModalBase64(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-900 text-cyan-500"
            />
            <span>Base64 encoded binary value</span>
          </label>
        </div>
      </Modal>
    </>
  );
}