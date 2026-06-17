"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Button from "@mui/material/Button";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Paper from "@mui/material/Paper";
import FormHelperText from "@mui/material/FormHelperText";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";


const steps = ["Project", "Git", "Review"];

type FlutterVersionOption = {
  channel: string;
  version: string;
};

const NewProjectForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState("");
  const [buildFolder, setBuildFolder] = useState(".");
  const [flutterVersion, setFlutterVersion] = useState("3.19.0");
  const [flutterVersions, setFlutterVersions] = useState<FlutterVersionOption[]>([]);
  const [loadingFlutterVersions, setLoadingFlutterVersions] = useState(false);
  
  // Git state
  const [gitSource, setGitSource] = useState<"github" | "external">("github");
  const [gitRepo, setGitRepo] = useState("");
  const [repos, setRepos] = useState<any[]>([]);
  const [gitToken, setGitToken] = useState("");
  const [gitUsername, setGitUsername] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { request } = useApi();
  const router = useRouter();

  React.useEffect(() => {
    let cancelled = false;

    const fetchFlutterVersions = async () => {
      setLoadingFlutterVersions(true);
      try {
        const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/flutter/versions`);
        if (!res.ok) return;

        const data = await res.json();
        const versions = Array.isArray(data?.versions)
          ? data.versions.filter((item: any) => item?.version)
          : [];

        if (!cancelled) {
          setFlutterVersions(versions);

          const currentExists = versions.some((item: FlutterVersionOption) => item.version === flutterVersion);
          if (!currentExists && versions.length > 0) {
            setFlutterVersion(versions[0].version);
          }
        }
      } catch (err) {
        console.error("Failed to fetch flutter versions", err);
      } finally {
        if (!cancelled) {
          setLoadingFlutterVersions(false);
        }
      }
    };

    fetchFlutterVersions();

    return () => {
      cancelled = true;
    };
  }, [request]);

  // Fetch repos when entering step 1 (Git)
  React.useEffect(() => {
    if (activeStep === 1) {
      const fetchRepos = async () => {
        setLoadingRepos(true);
        try {
          const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/github/repos`);
          if (res.ok) {
            const data = await res.json();
            // Handle structure: { details: { repositories: [...] } }
            const repoList = data.details?.repositories || data.repositories || [];
            setRepos(Array.isArray(repoList) ? repoList : []);
          }
        } catch (err) {
          console.error("Failed to fetch github repos", err);
        } finally {
          setLoadingRepos(false);
        }
      };
      fetchRepos();
    }
  }, [activeStep]);

  const isStep0Valid = name.trim() !== "" && buildFolder.trim() !== "" && flutterVersion.trim() !== "";
  // Step 1 Validation:
  // If GitHub source: repo required.
  // If External source: repo required (token/username optional for public repos).
  const isStep1Valid = gitRepo.trim() !== "";
  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const theme = useTheme();
  const handleCreateProject = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await request(
        `${process.env.NEXT_PUBLIC_API_URL}/project`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            build_folder: buildFolder,
            flutter_version: flutterVersion,
            git_repo: gitRepo,
            git_token: gitToken,
            git_username: gitUsername,
            config: {
              project_path: buildFolder,
              flutter_version: flutterVersion,
              git_repo: gitRepo,
              git_token: gitToken,
              git_username: gitUsername,
            },
          }),
        }
      );
      if (!res.ok) throw new Error("Error creating project");
      setSuccess(true);
      // Redirect to /projects after successful creation
      router.push("/projects");
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        maxWidth: 700,
        width: '100%',
        p: 4,
        borderRadius: 3,
        background: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === 0 && (
        <Box>
          <Typography variant="h6" fontWeight={700} mb={2}>Project Information</Typography>
          <TextField label="Project Name" value={name} onChange={e => setName(e.target.value)} fullWidth sx={{ mb: 2 }} required />
          <TextField label="Build Folder (build_folder)" value={buildFolder} onChange={e => setBuildFolder(e.target.value)} fullWidth sx={{ mb: 2 }} required />
          <FormControl fullWidth required sx={{ mb: 2 }}>
            <InputLabel id="flutter-version-label">Flutter Version (flutter_version)</InputLabel>
            <Select
              labelId="flutter-version-label"
              value={flutterVersion}
              label="Flutter Version (flutter_version)"
              onChange={(e) => setFlutterVersion(e.target.value)}
              disabled={loadingFlutterVersions}
              renderValue={(value) => {
                const selected = flutterVersions.find((item) => item.version === value);
                return (
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", pr: 1 }}>
                    <Typography fontWeight={600}>{value}</Typography>
                    {selected?.channel && <Chip size="small" label={selected.channel} />}
                  </Box>
                );
              }}
            >
              {loadingFlutterVersions ? (
                <MenuItem disabled value="">Loading...</MenuItem>
              ) : flutterVersions.length > 0 ? (
                flutterVersions.map((item) => (
                  <MenuItem key={`${item.channel}-${item.version}`} value={item.version}>
                    <Box sx={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                      <Typography fontWeight={600}>{item.version}</Typography>
                      <Chip size="small" label={item.channel} />
                    </Box>
                  </MenuItem>
                ))
              ) : (
                <MenuItem value={flutterVersion}>{flutterVersion}</MenuItem>
              )}
            </Select>
            <FormHelperText>
              Choisis une version disponible depuis l’API Flutter.
            </FormHelperText>
          </FormControl>
        </Box>
      )}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={700} mb={2}>Git Configuration</Typography>
          
          <ToggleButtonGroup
            value={gitSource}
            exclusive
            onChange={(e, newSource) => {
              if (newSource) {
                setGitSource(newSource);
                setGitRepo(""); // Reset repo selection when switching source
              }
            }}
            fullWidth
            sx={{ mb: 3 }}
          >
            <ToggleButton value="github">Repo Github</ToggleButton>
            <ToggleButton value="external">External Git</ToggleButton>
          </ToggleButtonGroup>

          {gitSource === "github" ? (
            <Box>
              <Typography variant="body2" color="textSecondary" mb={2}>
                 Select a repository from your connected GitHub account.
              </Typography>
              <FormControl fullWidth required sx={{ mb: 2 }}>
                <InputLabel id="git-repo-label">Github repo</InputLabel>
                <Select
                  labelId="git-repo-label"
                  value={gitRepo}
                  label="Github repo"
                  onChange={(e) => setGitRepo(e.target.value)}
                  disabled={loadingRepos}
                >
                  {loadingRepos ? (
                    <MenuItem disabled value="">Loading...</MenuItem>
                  ) : repos.length > 0 ? (
                    repos.map((repo: any) => (
                      <MenuItem key={repo.id} value={`https://github.com/${repo.full_name}`}>
                        {repo.full_name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">No repository found</MenuItem>
                  )}
                </Select>
              </FormControl>
              {/* Optional: GitHub might not need token/username if integrated via OAuth in backend */}
              <Typography variant="caption" color="textSecondary">
                Authentication is handled via your connected GitHub account.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="textSecondary" mb={2}>
                 Manually enter details for your external Git repository.
              </Typography>
              <TextField 
                label="Repository URL (git_repo)" 
                value={gitRepo} 
                onChange={e => setGitRepo(e.target.value)} 
                fullWidth 
                required 
                sx={{ mb: 2 }}
                placeholder="https://github.com/username/project.git"
              />
              <Box display="flex" gap={2} mb={2}>
                <TextField 
                  label="Git Token (git_token)" 
                  value={gitToken} 
                  onChange={e => setGitToken(e.target.value)} 
                  fullWidth 
                  type="password"
                  helperText="Optional for public repositories"
                />
                <TextField 
                  label="Git Username (git_username)" 
                  value={gitUsername} 
                  onChange={e => setGitUsername(e.target.value)} 
                  fullWidth 
                />
              </Box>
            </Box>
          )}
        </Box>
      )}
      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" fontWeight={700} mb={2}>Review</Typography>
          <Box mb={2} display="flex" justifyContent="center">
            <table
              style={{
                background: theme.palette.background.paper,
                borderRadius: 8,
                boxShadow: theme.palette.mode === 'dark' ? '0 2px 8px #222' : '0 2px 8px #eee',
                minWidth: 400,
                fontSize: '1rem',
                color: theme.palette.text.primary,
              }}
            >
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Project Name</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{name || <span style={{ color: theme.palette.text.secondary }}>Not provided</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Build Folder</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{buildFolder || <span style={{ color: theme.palette.text.secondary }}>Not provided</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Flutter Version</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{flutterVersion || <span style={{ color: theme.palette.text.secondary }}>Not provided</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Git Source</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{gitSource === 'github' ? 'GitHub (Connected)' : 'External (Manual)'}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Git Repository</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{gitRepo || <span style={{ color: theme.palette.text.secondary }}>Not provided</span>}</td>
                </tr>
                {gitSource === 'external' ? (
                  <>
                    <tr>
                      <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Git Token</td>
                      <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{gitToken ? '********' : <span style={{ color: theme.palette.text.secondary }}>Not provided</span>}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main }}>Git Username</td>
                      <td style={{ padding: '12px 16px' }}>{gitUsername || <span style={{ color: theme.palette.text.secondary }}>Not provided</span>}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main }}>Authentication</td>
                    <td style={{ padding: '12px 16px' }}>Via GitHub App</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Box>
      )}
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">Back</Button>
        {activeStep < steps.length - 1 ? (
          <Button
            variant="contained"
            color="primary"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !isStep0Valid) ||
              (activeStep === 1 && !isStep1Valid)
            }
          >
            Next
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateProject}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </Button>
        )}
            {error && (
              <Typography color="error" mt={2}>{error}</Typography>
            )}
            {success && (
              <Typography color="primary" mt={2}>Project created successfully!</Typography>
            )}
      </Box>
    </Paper>
  );
};

export default NewProjectForm;
