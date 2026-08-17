"use client";

import React, { useEffect, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useProjectConfig } from "@/context/ProjectConfigContext";
import { AccordionSection } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { KeystoreDTO } from "@/lib/api/types";
import {
  FiShield,
  FiPlus,
  FiTrash2,
  FiLink,
  FiCheckCircle,
  FiUploadCloud,
  FiKey,
} from "react-icons/fi";

interface ProjectKeyStoreCardProps {
  projectId?: string;
}

export default function ProjectKeyStoreCard({ projectId }: ProjectKeyStoreCardProps) {
  const { client } = useApi();
  const { config, refresh } = useProjectConfig();

  const [keystores, setKeystores] = useState<KeystoreDTO[]>([]);
  const [attachedId, setAttachedId] = useState<number | null>(null);
  const [openModal, setOpenModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [storePassword, setStorePassword] = useState("");
  const [keyAlias, setKeyAlias] = useState("");
  const [keyPassword, setKeyPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchKeystores = async () => {
    try {
      const data = await client.keystores.list();
      setKeystores(data.keystores ?? []);
    } catch (err) {
      console.error("Failed to load keystores", err);
    }
  };

  useEffect(() => {
    fetchKeystores();
    if (config) {
      const raw = config.keystore_id ?? null;
      setAttachedId(raw === 0 ? null : raw);
    }
  }, [config]);

  const handleLinkKeystore = async (id: number | null) => {
    if (!projectId) return;
    try {
      await client.projects.updateConfig(Number(projectId), {
        keystore_id: id ?? undefined,
      });
      setAttachedId(id);
      try {
        await refresh();
      } catch {}
    } catch (err) {
      console.error("Failed to link keystore", err);
    }
  };

  const handleDeleteKeystore = async (id?: number) => {
    if (!id) return;
    try {
      await client.keystores.remove(id);
      if (attachedId === id) {
        await handleLinkKeystore(null);
      }
      setKeystores((prev) => prev.filter((k) => k.id !== id));
    } catch (err) {
      console.error("Failed to delete keystore", err);
    }
  };

  const handleCreateKeystore = async () => {
    if (!name.trim() || !storePassword || !keyAlias) {
      setError("Please fill in all required fields (Name, Store Password, Key Alias).");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      let fileBase64 = "";
      if (file) {
        const buffer = await file.arrayBuffer();
        fileBase64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );
      }

      const res = await client.keystores.create({
        name: name.trim(),
        keystore_file: fileBase64,
        store_password: storePassword,
        key_alias: keyAlias,
        key_password: keyPassword || storePassword,
      });

      const newId = res.keystore?.id;
      await fetchKeystores();

      // Automatically link if nothing attached
      if (newId && !attachedId && projectId) {
        await handleLinkKeystore(newId);
      }

      setOpenModal(false);
      setName("");
      setFile(null);
      setStorePassword("");
      setKeyAlias("");
      setKeyPassword("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create keystore";
      setError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <AccordionSection
        defaultOpen={true}
        title="Android Code Signing & Keystores"
        description="Attach production release signing keys for APK and App Bundle generation."
        icon={<FiShield className="h-4 w-4 text-cyan-400" />}
        badge={
          attachedId ? (
            <Badge variant="success" size="sm" dot>
              Keystore Attached
            </Badge>
          ) : (
            <Badge variant="neutral" size="sm">
              Not Attached
            </Badge>
          )
        }
      >
        <div className="space-y-4 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-400">
              Select an existing keystore or upload a new Java Keystore (.jks/.keystore) file.
            </p>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FiPlus className="h-3.5 w-3.5" />}
              onClick={() => setOpenModal(true)}
            >
              Upload Keystore
            </Button>
          </div>

          {keystores.length === 0 ? (
            <div className="p-8 rounded-lg border border-dashed border-zinc-800 bg-zinc-950/40 text-center">
              <p className="text-xs text-zinc-500">No signing keystores uploaded yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
              {keystores.map((k) => {
                const isAttached = attachedId === k.id;

                return (
                  <div
                    key={k.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      isAttached ? "bg-cyan-950/20" : "hover:bg-zinc-900/40"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                        <FiKey className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-semibold text-zinc-100 truncate font-mono">
                            {k.name}
                          </h5>
                          {isAttached && (
                            <Badge variant="success" size="sm">
                              Active Project Key
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">
                          Alias: {k.key_alias || "upload"} • ID: {k.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAttached ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLinkKeystore(null)}
                        >
                          Unlink
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          leftIcon={<FiLink className="h-3 w-3" />}
                          onClick={() => k.id && handleLinkKeystore(k.id)}
                        >
                          Attach to Project
                        </Button>
                      )}

                      <button
                        type="button"
                        title="Delete Keystore"
                        onClick={() => handleDeleteKeystore(k.id)}
                        className="p-1.5 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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

      {/* Upload Modal */}
      <Modal
        isOpen={openModal}
        onClose={() => setOpenModal(false)}
        title="Upload Android Keystore"
        description="Upload a .jks or .keystore file and supply store credentials."
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isUploading}
              onClick={handleCreateKeystore}
            >
              Save Keystore
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
            label="Keystore Display Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Release Production Key"
            className="bg-zinc-900 border-zinc-800"
            required
          />

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Keystore File (.jks / .keystore)
            </label>
            <input
              type="file"
              accept=".jks,.keystore"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Keystore Password"
              type="password"
              value={storePassword}
              onChange={(e) => setStorePassword(e.target.value)}
              placeholder="Store password"
              className="bg-zinc-900 border-zinc-800 font-mono"
              required
            />

            <Input
              label="Key Alias"
              value={keyAlias}
              onChange={(e) => setKeyAlias(e.target.value)}
              placeholder="upload"
              className="bg-zinc-900 border-zinc-800 font-mono"
              required
            />
          </div>

          <Input
            label="Key Password (Optional, defaults to store password)"
            type="password"
            value={keyPassword}
            onChange={(e) => setKeyPassword(e.target.value)}
            placeholder="Key password"
            className="bg-zinc-900 border-zinc-800 font-mono"
          />
        </div>
      </Modal>
    </>
  );
}
