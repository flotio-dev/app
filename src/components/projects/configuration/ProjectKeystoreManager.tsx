"use client";

import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import AddIcon from "@mui/icons-material/Add";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import { useTheme } from "@mui/material/styles";
import { useApi } from "@/hooks/useApi";
import { useProjectConfig } from '@/context/ProjectConfigContext';
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

interface Props {
  projectId?: string | undefined;
  refreshKey?: number;
}

type Keystore = {
  id?: number;
  name?: string;
  key_alias?: string;
  createdAt?: string;
};

export default function ProjectKeystoreManager({ projectId: propProjectId, refreshKey }: Props) {
  const theme = useTheme();
  const { request } = useApi();
  const [keystores, setKeystores] = useState<Keystore[]>([]);
  const [loading, setLoading] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [storePassword, setStorePassword] = useState("");
  const [keyAlias, setKeyAlias] = useState("");
  const [keyPassword, setKeyPassword] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity?: 'success'|'error' }>({ open: false, message: '', severity: 'success' });
  const [attachedId, setAttachedId] = useState<number | null>(null);

  const projectId = propProjectId;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/keystore`);
        if (!res.ok) throw new Error("Failed to fetch keystores");
        const data = await res.json();
        const list = Array.isArray(data) ? data : Array.isArray(data.keystores) ? data.keystores : [];
        if (mounted) setKeystores(list as Keystore[]);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [request, refreshKey]);

  const { config, refresh } = useProjectConfig();

  useEffect(() => {
    if (!projectId) return;
    const raw = config?.keystore_id ?? config?.keystoreId ?? null;
    const next = raw === 0 || raw === "0" ? null : (raw ? Number(raw) : null);
    setAttachedId(next as number | null);
  }, [projectId, config]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const createKeystore = async () => {
    if (!file) return;
    try {
      const raw = await file.arrayBuffer();
      const b64 = Buffer.from(raw).toString("base64");
      const payload = { name, keystore_file: b64, store_password: storePassword, key_alias: keyAlias, key_password: keyPassword };
      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/keystore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create keystore");
      const createdData = await res.json();
      const created = createdData.keystore || createdData || null;

      // refresh list
      const listRes = await request(`${process.env.NEXT_PUBLIC_API_URL}/keystore`);
      const listData = await listRes.json();
      const list = Array.isArray(listData) ? listData : Array.isArray(listData.keystores) ? listData.keystores : [];
      setKeystores(list as Keystore[]);

      // attach to project config if projectId provided
      if (created && created.id && projectId) {
        try {
          // POST minimal payload to set keystore_id
          const postRes = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/config`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keystore_id: created.id })
          });
          if (!postRes.ok) throw new Error('Failed to update project config');
          setSnack({ open: true, message: 'Keystore created and attached to project', severity: 'success' });
          setAttachedId(created.id);
          // refresh provider
          try { await refresh(); } catch {}
        } catch (e) {
          console.error(e);
          setSnack({ open: true, message: 'Keystore created but failed to attach to project', severity: 'error' });
        }
      }

      setOpenCreate(false);
      setName(""); setFile(null); setStorePassword(""); setKeyAlias(""); setKeyPassword("");
    } catch (e) {
      console.error(e);
      setSnack({ open: true, message: 'Failed to create keystore', severity: 'error' });
    }
  };

  const deleteKeystore = async (id?: number) => {
    if (!id) return;
    try {
      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/keystore/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setKeystores((cur) => cur.filter((k) => k.id !== id));
      // if deleted keystore was attached, clear project config
        if (projectId && attachedId === id) {
        try {
          await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/config`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keystore_id: null })
          });
          setAttachedId(null);
          try { await refresh(); } catch {}
        } catch (e) {
          console.error(e);
        }
      }
      setSnack({ open: true, message: 'Keystore deleted', severity: 'success' });
    } catch (e) {
      console.error(e);
      setSnack({ open: true, message: 'Failed to delete keystore', severity: 'error' });
    }
  };

  const attachToProject = (id?: number) => {
    if (!projectId || !id) return;
        (async () => {
      try {
        const postRes = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/config`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keystore_id: id })
        });
        if (!postRes.ok) throw new Error('Failed to attach keystore to project');
        setSnack({ open: true, message: 'Keystore attached to project', severity: 'success' });
        setAttachedId(id);
        try { await refresh(); } catch {}
      } catch (e) {
        console.error(e);
        setSnack({ open: true, message: 'Failed to attach keystore', severity: 'error' });
      }
    })();
  };

  const detachFromProject = () => {
    if (!projectId) return;
    (async () => {
      try {
        const postRes = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/config`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keystore_id: null })
        });
        if (!postRes.ok) throw new Error('Failed to detach keystore');
        setAttachedId(null);
        try { await refresh(); } catch {}
        setSnack({ open: true, message: 'Keystore detached from project', severity: 'success' });
      } catch (e) {
        console.error(e);
        setSnack({ open: true, message: 'Failed to detach keystore', severity: 'error' });
      }
    })();
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, border: `1px solid ${theme.palette.divider}` }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>KeyStores</Typography>
          <Typography variant="body2" color="text.secondary">Manage your keystores and attach one to this project (via project config).</Typography>
        </Box>
        <Box>
          <Button startIcon={<AddIcon />} variant="outlined" onClick={() => setOpenCreate(true)}>New KeyStore</Button>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box />
        <Box>
          <Button size="small" onClick={() => setShowAll((s) => !s)}>{showAll ? 'Show attached only' : 'Show all keystores'}</Button>
        </Box>
      </Box>

      <List>
        {(showAll ? keystores : keystores.filter((k) => (k.id ?? -1) === (attachedId ?? -1))).map((k, idx) => (
          <ListItem key={k.id ?? `keystore-${k.name ?? idx}-${idx}`} secondaryAction={
            <Box>
              {(k.id ?? -1) === (attachedId ?? -1) ? (
                <Chip label="Attached" color="success" size="small" sx={{ mr: 1 }} />
              ) : (
                <Button startIcon={<LinkIcon />} variant="outlined" size="small" onClick={() => attachToProject(k.id)}>Attach</Button>
              )}
              <IconButton edge="end" aria-label="delete" onClick={() => deleteKeystore(k.id)}>
                <DeleteIcon />
              </IconButton>
            </Box>
          }>
            <ListItemText primary={k.name || `Keystore #${k.id}`} secondary={k.createdAt ? new Date(k.createdAt).toLocaleString() : ''} />
          </ListItem>
        ))}
        {keystores.length === 0 && !loading && (
          <ListItem><ListItemText primary="No keystores yet" secondary="Create one to attach to this project" /></ListItem>
        )}
      </List>

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create KeyStore</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth size="small" />
            <Button component="label" variant="outlined">Upload KeyStore<input hidden type="file" accept=".jks,.keystore,.p12,.pfx" onChange={handleFileChange} /></Button>
            {file && <Typography variant="body2">Selected: {file.name}</Typography>}
            <TextField label="Store password" value={storePassword} onChange={(e) => setStorePassword(e.target.value)} fullWidth size="small" type="password" />
            <TextField label="Key alias" value={keyAlias} onChange={(e) => setKeyAlias(e.target.value)} fullWidth size="small" />
            <TextField label="Key password" value={keyPassword} onChange={(e) => setKeyPassword(e.target.value)} fullWidth size="small" type="password" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button onClick={createKeystore} variant="contained" disabled={!file}>Create</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <MuiAlert severity={snack.severity || 'success'} elevation={6} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </MuiAlert>
      </Snackbar>
    </Paper>
  );
}
