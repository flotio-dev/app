"use client";

import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import AddIcon from "@mui/icons-material/Add";
import TuneIcon from "@mui/icons-material/Tune";
import { useTheme } from "@mui/material/styles";
import { useApi } from "@/hooks/useApi";
import EnvironmentVariableRow from "./EnvironmentVariableRow";
import { EnvironmentVariable } from "./projectConfiguration.types";

const createVariable = (): EnvironmentVariable => ({
  id: crypto.randomUUID(),
  key: "",
  value: "",
});

interface ProjectEnvironmentVariablesCardProps {
  projectId?: string;
  variables: EnvironmentVariable[];
  onAdd: () => void;
  onChange: (next: EnvironmentVariable[]) => void;
  onSave: () => void;
  canSave: boolean;
}

const ProjectEnvironmentVariablesCard: React.FC<ProjectEnvironmentVariablesCardProps> = ({
  projectId,
  variables,
  onAdd,
  onChange,
  onSave,
  canSave,
}) => {
  const theme = useTheme();
  const { request } = useApi();
  const loadedEnvIdsRef = useRef<number[]>([]);
  const editedKeyIdsRef = useRef<Set<string>>(new Set());

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [variableToDelete, setVariableToDelete] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const normalizeEnv = (item: any): EnvironmentVariable => {
    const itemId = item?.id ?? item?.ID;
    return {
      id: String(itemId ?? crypto.randomUUID()),
      apiId:
        typeof itemId === "number"
          ? itemId
          : typeof itemId === "string" && !Number.isNaN(Number(itemId))
            ? Number(itemId)
            : undefined,
      key: item?.key ?? "",
      value: item?.value ?? "",
      type: item?.type,
      path: item?.path,
      isBase64: item?.is_base64 ?? item?.isBase64 ?? false,
      projectId: item?.project_id ?? item?.project?.id ?? item?.project?.ID,
    };
  };

  const extractEnvs = (data: any): any[] => {
    if (Array.isArray(data?.envs)) return data.envs;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object") {
      return Object.values(data).flatMap((value) =>
        Array.isArray(value) ? value : value ? [value] : []
      );
    }
    return [];
  };

  useEffect(() => {
    let cancelled = false;

    const fetchEnv = async () => {
      if (!projectId) return;

      try {
        const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/env?project_id=${projectId}`);
        if (!res.ok) return;

        const data = await res.json();
        const envs = extractEnvs(data);

        if (!cancelled) {
          const normalized = envs.map(normalizeEnv);

          loadedEnvIdsRef.current = normalized
            .map((item: EnvironmentVariable) => item.apiId)
            .filter((id: number | undefined): id is number => typeof id === "number");

          editedKeyIdsRef.current.clear();
          onChange(normalized);
        }
      } catch (error) {
        console.error("Failed to fetch env variables", error);
      }
    };

    fetchEnv();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, request]);

  const updateVariable = (updated: EnvironmentVariable) => {
    const previous = variables.find((variable) => variable.id === updated.id);

    if (previous && previous.key !== updated.key) {
      editedKeyIdsRef.current.add(updated.id);
    }

    onChange(variables.map((variable) => (variable.id === updated.id ? updated : variable)));
  };

  const deleteVariable = (id: string) => {
    setVariableToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!variableToDelete) return;

    const variable = variables.find((v) => v.id === variableToDelete);
    if (variable && variable.apiId) {
      try {
        const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/env/${variable.apiId}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          throw new Error(`Failed to delete env ${variable.key}`);
        }
        loadedEnvIdsRef.current = loadedEnvIdsRef.current.filter((id) => id !== variable.apiId);
        setSnack({ open: true, message: "Variable deleted successfully", severity: "success" });
      } catch (error) {
        console.error("Failed to delete env variable", error);
        setSnack({ open: true, message: "Failed to delete variable", severity: "error" });
        setDeleteDialogOpen(false);
        setVariableToDelete(null);
        return;
      }
    }

    editedKeyIdsRef.current.delete(variableToDelete);
    onChange(variables.filter((v) => v.id !== variableToDelete));
    setDeleteDialogOpen(false);
    setVariableToDelete(null);
  };

  const buildPayload = (variable: EnvironmentVariable) => ({
    key: variable.key,
    value: variable.value,
    type: variable.type ?? "env",
    path: variable.path ?? "",
    is_base64: variable.isBase64 ?? false,
    project_id: projectId ? Number(projectId) : undefined,
  });

  const handleSave = async () => {
    if (!projectId) return;

    try {
      const nextVariables = variables.filter((variable) => variable.key.trim());
      const currentIds = new Set<number>(
        nextVariables
          .map((variable) => variable.apiId)
          .filter((id): id is number => typeof id === "number")
      );

      for (const variable of nextVariables) {
        const payload = buildPayload(variable);

        if (variable.apiId) {
          const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/env/${variable.apiId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            throw new Error(`Failed to update env ${variable.key}`);
          }
        } else {
          const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/env`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          if (!res.ok) {
            throw new Error(`Failed to create env ${variable.key}`);
          }
        }
      }

      for (const id of loadedEnvIdsRef.current) {
        if (!currentIds.has(id)) {
          const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/env/${id}`, {
            method: "DELETE",
          });

          if (!res.ok) {
            throw new Error(`Failed to delete env ${id}`);
          }
        }
      }

      const refreshed = await request(`${process.env.NEXT_PUBLIC_API_URL}/env?project_id=${projectId}`);
      if (refreshed.ok) {
        const data = await refreshed.json();
        const envs = extractEnvs(data);
        const normalized = envs.map((item: any) => normalizeEnv(item));

        loadedEnvIdsRef.current = normalized
          .map((item: EnvironmentVariable) => item.apiId)
          .filter((id: number | undefined): id is number => typeof id === "number");

        editedKeyIdsRef.current.clear();
        onChange(normalized.length > 0 ? normalized : [createVariable()]);
      }

      onSave();
      setSnack({ open: true, message: "Variables saved successfully", severity: "success" });
    } catch (error) {
      console.error("Failed to save env variables", error);
      setSnack({ open: true, message: "Failed to save variables", severity: "error" });
    }
  };

  const keyOwners = variables.reduce<Record<string, Set<string>>>((acc, variable) => {
    const key = String(variable.key ?? "").trim();
    if (!key) return acc;

    if (!acc[key]) acc[key] = new Set<string>();
    acc[key].add(String(variable.id));
    return acc;
  }, {});

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        p: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={2}>
        <Box>
          <Typography
            variant="h6"
            fontWeight={700}
            color={theme.palette.text.primary}
            display="flex"
            alignItems="center"
            gap={1}
          >
            <TuneIcon fontSize="small" />
            Environment variables
          </Typography>
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Manage key / value pairs. Keys must be unique within the project.
          </Typography>
        </Box>

        <Chip
          label={`${variables.length} variable${variables.length > 1 ? "s" : ""}`}
          variant="outlined"
        />
      </Box>

      <Stack spacing={2} sx={{ flex: 1 }}>
        {variables.length === 0 ? (
          <Box
            sx={{
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: 2,
              p: 3,
              textAlign: "center",
              color: theme.palette.text.secondary,
            }}
          >
            No variables yet.
          </Box>
        ) : (
          variables.map((variable) => {
            const trimmedKey = String(variable.key ?? "").trim();
            const duplicateKey = trimmedKey ? (keyOwners[trimmedKey]?.size ?? 0) > 1 : false;
            const keyWasEdited = editedKeyIdsRef.current.has(variable.id);

            const keyError = !trimmedKey
              ? "The key cannot be empty"
              : duplicateKey && keyWasEdited
                ? "The key must be unique"
                : undefined;

            return (
              <Box key={variable.id}>
                <EnvironmentVariableRow
                  variable={variable}
                  keyError={keyError}
                  onChange={updateVariable}
                  onDelete={deleteVariable}
                />
                <Divider sx={{ mt: 2 }} />
              </Box>
            );
          })
        )}

        <Box display="flex" alignItems="center" gap={1} width="100%">
          <Button variant="outlined" startIcon={<AddIcon />} onClick={onAdd}>
            Add variable
          </Button>
          <Box flex={1} />
          <Button variant="contained" onClick={handleSave} disabled={!canSave}>
            Save changes
          </Button>
        </Box>
      </Stack>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Environment Variable</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this environment variable? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} elevation={6} variant="filled" onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ProjectEnvironmentVariablesCard;