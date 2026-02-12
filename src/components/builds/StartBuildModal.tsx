"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

interface StartBuildModalProps {
  open: boolean;
  projectId?: string;
  onClose: () => void;
  onStartBuild: (config: BuildConfig) => void;
}

interface BuildConfig {
  environment: string;
  baseDirectory: string;
  platform: string;
  gitRef: string;
  autoSubmit: boolean;
}

const StartBuildModal: React.FC<StartBuildModalProps> = ({
  open,
  projectId,
  onClose,
  onStartBuild,
}) => {
  const theme = useTheme();
  const [environment, setEnvironment] = useState("DEFAULT");
  const [baseDirectory, setBaseDirectory] = useState("/");
  const [platform, setPlatform] = useState("ALL");
  const [gitRef, setGitRef] = useState("main");
  const [autoSubmit, setAutoSubmit] = useState(false);

  const handleStartBuild = () => {
    onStartBuild({
      environment,
      baseDirectory,
      platform,
      gitRef,
      autoSubmit,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1.5,
          backgroundColor: theme.palette.background.paper,
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle
        sx={{
          fontSize: "1.25rem",
          fontWeight: 600,
          paddingBottom: 2,
        }}
      >
        Start build
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
        {/* Environment Selection */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              marginBottom: 1,
              color: theme.palette.text.primary,
              fontSize: "0.875rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              opacity: 0.8,
            }}
          >
            Environment
          </Typography>
          <ToggleButtonGroup
            value={environment}
            exclusive
            onChange={(e, newEnvironment) => {
              if (newEnvironment !== null) {
                setEnvironment(newEnvironment);
              }
            }}
            fullWidth
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "uppercase",
                fontWeight: 600,
                fontSize: "0.75rem",
                padding: "10px 12px",
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.secondary,
                transition: "all 0.2s ease",
                borderRadius: 1,
                "&.Mui-selected": {
                  backgroundColor: theme.palette.primary.main,
                  color: "#fff",
                  border: `1px solid ${theme.palette.primary.main}`,
                  "&:hover": {
                    backgroundColor: theme.palette.primary.dark,
                    borderColor: theme.palette.primary.dark,
                  },
                },
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                  borderColor: theme.palette.primary.light,
                },
              },
            }}
          >
            <ToggleButton value="DEFAULT">Default</ToggleButton>
            <ToggleButton value="PRODUCTION">Production</ToggleButton>
            <ToggleButton value="DEVELOPMENT">Development</ToggleButton>
            <ToggleButton value="PREVIEW">Preview</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Auto Submit Checkbox */}
        <Box
          sx={{
            padding: 1.5,
            borderRadius: 1,
            backgroundColor: theme.palette.action.hover,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={autoSubmit}
                onChange={(e) => setAutoSubmit(e.target.checked)}
                sx={{
                  color: theme.palette.primary.main,
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Automatically submit to stores after building successfully
              </Typography>
            }
            sx={{
              "& .MuiFormControlLabel-label": {
                fontSize: "0.875rem",
              },
              margin: 0,
            }}
          />
        </Box>

        {/* Build Configuration */}
        <Box>
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              marginBottom: 1,
              color: theme.palette.text.primary,
              fontSize: "0.875rem",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              opacity: 0.8,
            }}
          >
            Build configuration
          </Typography>

          <Stack spacing={1.5}>
            {/* Base Directory */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: theme.palette.text.secondary,
                  marginBottom: 0.5,
                  fontWeight: 500,
                }}
              >
                Base directory
              </Typography>
              <TextField
                value={baseDirectory}
                onChange={(e) => setBaseDirectory(e.target.value)}
                fullWidth
                size="small"
                placeholder="/"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              />
            </Box>

            {/* Platform Selection */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: theme.palette.text.secondary,
                  marginBottom: 0.75,
                  fontWeight: 500,
                }}
              >
                Platform
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {["ALL", "ANDROID"].map((p) => (
                  <Button
                    key={p}
                    variant={platform === p ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setPlatform(p)}
                    sx={{
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      flex: 1,
                      transition: "all 0.2s ease",
                      borderRadius: 1,
                      borderWidth: "1px",
                      ...(platform === p
                        ? {
                            backgroundColor: theme.palette.primary.main,
                            borderColor: theme.palette.primary.main,
                          }
                        : {
                            borderColor: theme.palette.divider,
                            color: theme.palette.text.secondary,
                            "&:hover": {
                              borderColor: theme.palette.primary.main,
                              backgroundColor: theme.palette.action.hover,
                            },
                          }),
                    }}
                  >
                    {p}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Git Reference */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontSize: "0.75rem",
                  color: theme.palette.text.secondary,
                  marginBottom: 0.5,
                  fontWeight: 500,
                }}
              >
                Git ref
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontSize: "0.7rem",
                  color: theme.palette.text.secondary,
                  marginBottom: 0.75,
                }}
              >
                Commit hash, branch, or tag
              </Typography>
              <TextField
                value={gitRef}
                onChange={(e) => setGitRef(e.target.value)}
                fullWidth
                size="small"
                placeholder="main"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ padding: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: "uppercase",
            fontWeight: 600,
            fontSize: "0.875rem",
            borderRadius: 1,
            transition: "all 0.2s ease",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleStartBuild}
          variant="contained"
          color="primary"
          sx={{
            textTransform: "uppercase",
            fontWeight: 600,
            fontSize: "0.875rem",
            borderRadius: 1,
            transition: "all 0.2s ease",
          }}
        >
          Start Build
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StartBuildModal;
