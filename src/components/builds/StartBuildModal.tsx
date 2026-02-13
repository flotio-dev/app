"use client";

import React, { useState } from "react";
import { useApi } from '@/hooks/useApi';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Stack,
  Alert,
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
}

const StartBuildModal: React.FC<StartBuildModalProps> = ({
  open,
  projectId,
  onClose,
  onStartBuild,
}) => {
  const theme = useTheme();
  const { request } = useApi();
  const [environment, setEnvironment] = useState("RELEASE");
  const [baseDirectory, setBaseDirectory] = useState("/");
  const [flutterChannel, setFlutterChannel] = useState("STABLE");
  const [buildTarget, setBuildTarget] = useState("APK");
  const [gitRef, setGitRef] = useState("main");
  const [error, setError] = useState<string | null>(null);

  const handleStartBuild = async () => {
    if (!projectId) return;
    setError(null);

    try {
      const payload = {
        build_mode: environment.toLowerCase(),
        build_target: buildTarget.toLowerCase(),
        platform: "android",
        git_branch: gitRef.toLowerCase(),
        flutter_channel: flutterChannel.toLowerCase(),
      };

      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Build request failed:", res.status, errorText);
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) errorMessage = errorJson.message;
          else if (errorJson.error) errorMessage = errorJson.error;
        } catch {
          // Response body is not JSON, use raw text
        }
        throw new Error(errorMessage || `Failed to start build (Status: ${res.status})`);
      }

      onStartBuild({
        environment,
        baseDirectory,
        platform: buildTarget,
        gitRef,
      });
      onClose();
    } catch (err: any) {
      console.error("Error starting build:", err);
      setError(err.message || "An unexpected error occurred");
    }
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
        {error && <Alert severity="error">{error}</Alert>}
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
              gap: 1,
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
            <ToggleButton value="RELEASE">Release</ToggleButton>
            <ToggleButton value="DEBUG">Debug</ToggleButton>
            <ToggleButton value="PROFILE">Profile</ToggleButton>
          </ToggleButtonGroup>
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
            {/* Flutter Channel */}
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
                Flutter Channel
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {["STABLE", "BETA", "DEV", "MASTER"].map((channel) => (
                  <Button
                    key={channel}
                    variant={flutterChannel === channel ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setFlutterChannel(channel)}
                    sx={{
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      flex: 1,
                      transition: "all 0.2s ease",
                      borderRadius: 1,
                      borderWidth: "1px",
                      ...(flutterChannel === channel
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
                    {channel}
                  </Button>
                ))}
              </Box>
            </Box>

            {/* Build Target */}
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
                Build Target
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                {["APK", "AAB"].map((target) => (
                  <Button
                    key={target}
                    variant={buildTarget === target ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setBuildTarget(target)}
                    sx={{
                      textTransform: "uppercase",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      flex: 1,
                      transition: "all 0.2s ease",
                      borderRadius: 1,
                      borderWidth: "1px",
                      ...(buildTarget === target
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
                    {target}
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
