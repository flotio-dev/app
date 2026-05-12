"use client";

import React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useTheme } from "@mui/material/styles";
import { EnvironmentVariable } from "./projectConfiguration.types";

interface EnvironmentVariableRowProps {
  variable: EnvironmentVariable;
  keyError?: string;
  onChange: (variable: EnvironmentVariable) => void;
  onDelete: (id: string) => void;
}

const EnvironmentVariableRow: React.FC<EnvironmentVariableRowProps> = ({
  variable,
  keyError,
  onChange,
  onDelete,
}) => {
  const theme = useTheme();

  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr auto" }} gap={2} alignItems="start">
      <TextField
        label="Key"
        value={variable.key}
        error={Boolean(keyError)}
        helperText={keyError || "Unique key required"}
        onChange={(event) => onChange({ ...variable, key: event.target.value })}
        size="small"
        fullWidth
      />
      <TextField
        label="Value"
        value={variable.value}
        onChange={(event) => onChange({ ...variable, value: event.target.value })}
        size="small"
        fullWidth
        helperText="Can be empty"
      />
      <Box display="flex" alignItems="center" height="100%">
        <Tooltip title="Delete variable">
          <IconButton onClick={() => onDelete(variable.id)} sx={{ color: theme.palette.text.secondary }}>
            <DeleteOutlineIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default EnvironmentVariableRow;
