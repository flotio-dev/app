"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { useTheme } from "@mui/material/styles";
import { useParams } from "next/navigation";
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
  const [variables, setVariables] = useState<EnvironmentVariable[]>([createVariable()]);
  const params = useParams();
  const projectId = params.id as string | undefined;

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
    console.log("Draft configuration:", { variables });
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
            <ProjectKeyStoreCard projectId={projectId} />
          </Box>
          <Box sx={{ width: '100%' }}>
            <ProjectEnvironmentVariablesCard
              projectId={projectId}
              variables={variables}
              onAdd={addVariable}
              onChange={setVariables}
              onSave={handleSaveDraft}
              canSave={canSave}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ProjectConfigurationContent;
