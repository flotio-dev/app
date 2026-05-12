"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { useTheme } from "@mui/material/styles";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SecurityIcon from "@mui/icons-material/Security";
import { KeyStoreState } from "./projectConfiguration.types";

interface ProjectKeyStoreCardProps {
  value: KeyStoreState;
  onChange: (next: KeyStoreState) => void;
}

const ProjectKeyStoreCard: React.FC<ProjectKeyStoreCardProps> = ({ value, onChange }) => {
  const theme = useTheme();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onChange({ ...value, file });
  };

  const clearFile = () => {
    onChange({ ...value, file: null });
  };

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
            <SecurityIcon fontSize="small" />
            KeyStore
          </Typography>
          <Typography variant="body2" color={theme.palette.text.secondary}>
            The KeyStore is optional and is handled entirely on the front end.
          </Typography>
        </Box>
        <Chip
          label={value.file ? "KeyStore added" : "No KeyStore"}
          color={value.file ? "success" : "default"}
          variant={value.file ? "filled" : "outlined"}
        />
      </Box>

      <Stack spacing={2} sx={{ flex: 1 }}>
        <Box width="100%">
          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              minHeight: 40,
              px: 1.5,
              textTransform: 'none',
            }}
          >
            Upload KeyStore file
            <input hidden type="file" accept=".jks,.keystore,.p12,.pfx" onChange={handleFileChange} />
          </Button>
          {value.file && (
            <Box mt={1} display="flex" alignItems="center" gap={1} flexWrap="wrap">
              <Chip label={value.file.name} />
              <Button size="small" color="inherit" startIcon={<DeleteOutlineIcon />} onClick={clearFile}>
                Remove
              </Button>
            </Box>
          )}
        </Box>

        <TextField
          label="KeyStore password"
          type="password"
          value={value.keystorePassword}
          onChange={(event) => onChange({ ...value, keystorePassword: event.target.value })}
          fullWidth
          size="small"
        />

        <TextField
          label="Key alias"
          value={value.keyAlias}
          onChange={(event) => onChange({ ...value, keyAlias: event.target.value })}
          fullWidth
          size="small"
        />

        <TextField
          label="Key password"
          type="password"
          value={value.keyPassword}
          onChange={(event) => onChange({ ...value, keyPassword: event.target.value })}
          fullWidth
          size="small"
        />
      </Stack>
    </Paper>
  );
};

export default ProjectKeyStoreCard;
