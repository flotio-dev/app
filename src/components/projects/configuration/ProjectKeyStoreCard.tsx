"use client";

import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";
import SecurityIcon from "@mui/icons-material/Security";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useApi } from "@/hooks/useApi";
import { useProjectConfig } from '@/context/ProjectConfigContext';

export type KeystoreItem = {
  id?: number;
  ID?: number;
  keystore_id?: number;
  keystoreId?: number;
  name?: string;
  key_alias?: string;
  createdAt?: string;
  updatedAt?: string;
};

interface ProjectKeyStoreCardProps {
  projectId?: string;
  refreshKey?: number;
}

const toId = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

const ProjectKeyStoreCard: React.FC<ProjectKeyStoreCardProps> = ({ projectId, refreshKey }) => {
  const theme = useTheme();
  const { request } = useApi();

  const [keystores, setKeystores] = useState<KeystoreItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(true);
  const [attachedId, setAttachedId] = useState<number | null>(null);
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [storePassword, setStorePassword] = useState("");
  const [keyAlias, setKeyAlias] = useState("");
  const [keyPassword, setKeyPassword] = useState("");
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

  const getKeystoreId = (k: KeystoreItem) =>
    toId(k.id ?? k.ID ?? k.keystore_id ?? k.keystoreId ?? null);

  const normalizeKeystoreList = (data: any): KeystoreItem[] => {
    if (Array.isArray(data)) return data as KeystoreItem[];
    if (data && Array.isArray(data.keystores)) return data.keystores as KeystoreItem[];
    if (data && typeof data === "object") {
      return Object.values(data).filter((item) => item && typeof item === "object") as KeystoreItem[];
    }
    return [];
  };

  const showSnack = (message: string, severity: "success" | "error") => {
    setSnack({ open: true, message, severity });
  };

  const fetchKeystores = async () => {
    if (!apiBaseUrl) return;
    setLoading(true);
    try {
      const res = await request(`${apiBaseUrl}/keystore`);
      if (!res.ok) throw new Error("Failed to fetch keystores");
      const data = await res.json();
      setKeystores(normalizeKeystoreList(data));
    } catch (err) {
      console.error(err);
      showSnack("Unable to load keystores", "error");
    } finally {
      setLoading(false);
    }
  };

  const { config, refresh } = useProjectConfig();

  const persistKeystoreLink = async (nextKeystoreId: number | null) => {
    if (!apiBaseUrl || !projectId) return;
    const payload = { keystore_id: nextKeystoreId };
    const res = await request(`${apiBaseUrl}/project/${projectId}/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 404) {
        throw new Error("Endpoint /project/{id}/config introuvable. Redémarre core-api.");
      }
      throw new Error(text || "Failed to save project config");
    }
    setAttachedId(nextKeystoreId);
    // refresh provider so other components see the new config
    try {
      await refresh();
    } catch {}
  };

  useEffect(() => {
    fetchKeystores();
    // set attached keystore from provider config when available
    if (config) {
      const raw = config?.keystore_id ?? config?.keystoreId ?? null;
      const next = raw === 0 || raw === "0" ? null : toId(raw);
      setAttachedId(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, projectId, apiBaseUrl, config]);

  const visibleKeystores = useMemo(() => {
    if (showAll) return keystores;
    return keystores.filter((k) => getKeystoreId(k) === attachedId);
  }, [keystores, showAll, attachedId]);

  const handleCreateKeystore = async () => {
    if (!file || !apiBaseUrl) return;
    try {
      const raw = await file.arrayBuffer();
      const payload = {
        name,
        keystore_file: Buffer.from(raw).toString("base64"),
        store_password: storePassword,
        key_alias: keyAlias,
        key_password: keyPassword,
      };

      const res = await request(`${apiBaseUrl}/keystore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create keystore");

      const createdData = await res.json();
      const created = createdData?.keystore ?? createdData;
      const createdId = toId(created?.id ?? created?.ID ?? created?.keystore_id ?? created?.keystoreId ?? null);

      await fetchKeystores();
      setOpenCreate(false);
      setName("");
      setFile(null);
      setStorePassword("");
      setKeyAlias("");
      setKeyPassword("");

      if (createdId !== null && projectId) {
        try {
          await persistKeystoreLink(createdId);
          showSnack("Keystore created and attached", "success");
        } catch (err) {
          console.error(err);
          showSnack("Keystore created but attachment failed", "error");
        }
      } else {
        showSnack("Keystore created", "success");
      }
    } catch (err) {
      console.error(err);
      showSnack("Failed to create keystore", "error");
    }
  };

  const handleDeleteKeystore = async (id?: number) => {
    if (!apiBaseUrl || !id) return;
    try {
      const res = await request(`${apiBaseUrl}/keystore/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete keystore");
      setKeystores((current) => current.filter((k) => getKeystoreId(k) !== id));
      if (attachedId === id) {
        try {
          await persistKeystoreLink(null);
        } catch (err) {
          console.error(err);
        }
      }
      showSnack("Keystore deleted", "success");
    } catch (err) {
      console.error(err);
      showSnack("Failed to delete keystore", "error");
    }
  };

  const handleAttach = async (id?: number) => {
    if (!id) return;
    try {
      await persistKeystoreLink(id);
      showSnack("Keystore attached to project", "success");
    } catch (err) {
      console.error(err);
      showSnack("Failed to attach keystore", "error");
    }
  };

  const handleDetach = async () => {
    try {
      await persistKeystoreLink(null);
      showSnack("Keystore detached from project", "success");
    } catch (err) {
      console.error(err);
      showSnack("Failed to detach keystore", "error");
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        p: 3,
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700} color={theme.palette.text.primary} display="flex" alignItems="center" gap={1}>
            <SecurityIcon fontSize="small" />
            KeyStore
          </Typography>
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Manage keystores, create new ones, link one to the project and detach it when needed.
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1} flexWrap="wrap" justifyContent="flex-end">
          <Chip
            label={attachedId ? `Attached (id ${attachedId})` : "No KeyStore attached"}
            color={attachedId ? "success" : "default"}
            variant={attachedId ? "filled" : "outlined"}
          />
          {attachedId && (
            <Button size="small" variant="outlined" color="inherit" onClick={handleDetach}>
              Detach
            </Button>
          )}
          <Button startIcon={<AddIcon />} size="small" variant="contained" onClick={() => setOpenCreate(true)}>
            New
          </Button>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} gap={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          Existing KeyStores
        </Typography>
        <Button size="small" onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Show attached only" : "Show all keystores"}
        </Button>
      </Box>

      <List sx={{ py: 0 }}>
        {visibleKeystores.map((k, idx) => {
          const id = getKeystoreId(k);
          const isAttached = id !== null && id === attachedId;
          return (
            <ListItem
              key={id ?? `keystore-${k.name ?? idx}-${idx}`}
              divider
              secondaryAction={
                <Box display="flex" alignItems="center" gap={1}>
                  {isAttached ? (
                    <Chip label="Attached" color="success" size="small" />
                  ) : (
                    <Button startIcon={<LinkIcon />} variant="outlined" size="small" onClick={() => handleAttach(id ?? undefined)}>
                      Attach
                    </Button>
                  )}
                  <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteKeystore(id ?? undefined)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={k.name || `Keystore #${id ?? idx + 1}`}
                secondary={k.createdAt ? new Date(k.createdAt).toLocaleString() : (loading ? "Loading…" : "")}
              />
            </ListItem>
          );
        })}
        {visibleKeystores.length === 0 && !loading && (
          <ListItem>
            <ListItemText
              primary={showAll ? "No keystores yet" : "No keystore attached"}
              secondary={showAll ? "Create one to attach it to this project" : "Attach a keystore from the list"}
            />
          </ListItem>
        )}
      </List>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create KeyStore</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth size="small" />
            <Button component="label" variant="outlined" startIcon={<UploadFileIcon />}>
              Upload KeyStore
              <input hidden type="file" accept=".jks,.keystore,.p12,.pfx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Button>
            {file && <Typography variant="body2">Selected: {file.name}</Typography>}
            <TextField label="Store password" value={storePassword} onChange={(e) => setStorePassword(e.target.value)} fullWidth size="small" type="password" />
            <TextField label="Key alias" value={keyAlias} onChange={(e) => setKeyAlias(e.target.value)} fullWidth size="small" />
            <TextField label="Key password" value={keyPassword} onChange={(e) => setKeyPassword(e.target.value)} fullWidth size="small" type="password" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={handleCreateKeystore} variant="contained" disabled={!file}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} elevation={6} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ProjectKeyStoreCard;
