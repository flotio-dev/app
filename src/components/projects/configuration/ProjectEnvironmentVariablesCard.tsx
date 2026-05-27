"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import AddIcon from "@mui/icons-material/Add";
import TuneIcon from "@mui/icons-material/Tune";
import { useTheme } from "@mui/material/styles";
import EnvironmentVariableRow from "./EnvironmentVariableRow";
import { EnvironmentVariable } from "./projectConfiguration.types";

interface ProjectEnvironmentVariablesCardProps {
  variables: EnvironmentVariable[];
  onAdd: () => void;
  onChange: (next: EnvironmentVariable[]) => void;
}

const ProjectEnvironmentVariablesCard: React.FC<ProjectEnvironmentVariablesCardProps> = ({
  variables,
  onAdd,
  onChange,
}) => {
  const theme = useTheme();

  const updateVariable = (updated: EnvironmentVariable) => {
    onChange(variables.map((variable) => (variable.id === updated.id ? updated : variable)));
  };

  const deleteVariable = (id: string) => {
    onChange(variables.filter((variable) => variable.id !== id));
  };

  const keyCounts = variables.reduce<Record<string, number>>((acc, variable) => {
    const key = variable.key.trim();
    if (!key) return acc;
    acc[key] = (acc[key] || 0) + 1;
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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2} mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700} color={theme.palette.text.primary} display="flex" alignItems="center" gap={1}>
            <TuneIcon fontSize="small" />
            Environment variables
          </Typography>
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Manage key / value pairs. Keys must be unique within the project.
          </Typography>
        </Box>
        <Chip label={`${variables.length} variable${variables.length > 1 ? "s" : ""}`} variant="outlined" />
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
            const trimmedKey = variable.key.trim();
            const duplicateKey = trimmedKey ? keyCounts[trimmedKey] > 1 : false;
            const keyError = !trimmedKey
              ? "The key cannot be empty"
              : duplicateKey
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

        <Box>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={onAdd}>
            Add variable
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ProjectEnvironmentVariablesCard;
