"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";
import ProjectKeyStoreCard from "./ProjectKeyStoreCard";
import ProjectEnvironmentVariablesCard from "./ProjectEnvironmentVariablesCard";
import { EnvironmentVariable, KeyStoreState } from "./projectConfiguration.types";

const createVariable = (): EnvironmentVariable => ({
  id: crypto.randomUUID(),
  key: "",
  value: "",
});

const defaultKeyStore: KeyStoreState = {
  file: null,
  keystorePassword: "",
  keyAlias: "",
  keyPassword: "",
};

const ProjectConfigurationContent: React.FC = () => {
  const theme = useTheme();
  const [keyStore, setKeyStore] = useState<KeyStoreState>(defaultKeyStore);
  const [variables, setVariables] = useState<EnvironmentVariable[]>([createVariable()]);

  const hasKeystore = Boolean(keyStore.file);

  const canSave = useMemo(() => {
    const keys = variables.map((variable) => variable.key.trim()).filter(Boolean);
    const hasEmptyKey = variables.some((variable) => !variable.key.trim());
    const hasDuplicates = new Set(keys).size !== keys.length;
    return !hasEmptyKey && !hasDuplicates;
  }, [variables]);

  const addVariable = () => {
    setVariables((current) => [...current, createVariable()]);
  };

  const handleSaveDraft = () => {
    // Front-only: aucun appel API ici.
    // Les états restent en mémoire dans la page.
    console.log("Draft configuration:", { keyStore, variables });
  };

  return (
    <Box px={{ xs: 2, md: 6 }} py={4}>
      <Box width="100%" maxWidth="100%" display="flex" flexDirection="column" gap={3}>
        <Box>
          <Typography variant="h4" fontWeight={800} color={theme.palette.text.primary} gutterBottom>
            Project Configuration
          </Typography>
          <Typography color={theme.palette.text.secondary}>
            Front-end only project configuration.
          </Typography>
        </Box>

        <Alert severity="info">
          The KeyStore is optional. Secret fields are masked and environment variables are validated locally.
        </Alert>

        <Box display="flex" flexDirection="column" gap={3} width="100%">
          <Box sx={{ width: '100%' }}>
            <ProjectKeyStoreCard value={keyStore} onChange={setKeyStore} />
          </Box>
          <Box sx={{ width: '100%' }}>
            <ProjectEnvironmentVariablesCard
              variables={variables}
              onAdd={addVariable}
              onChange={setVariables}
            />
          </Box>
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button variant="outlined" onClick={() => setKeyStore(defaultKeyStore)}>
            Reset KeyStore
          </Button>
          <Button variant="contained" onClick={handleSaveDraft} disabled={!canSave}>
            Save changes
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectConfigurationContent;
