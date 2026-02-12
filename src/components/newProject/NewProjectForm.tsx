"use client";
import React, { useState } from "react";
import { useApi } from "@/hooks/useApi";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";


const steps = ["Projet", "Git", "Validation"];

const NewProjectForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState("");
  const [buildFolder, setBuildFolder] = useState(".");
  const [flutterVersion, setFlutterVersion] = useState("3.19.0");
  const [gitRepo, setGitRepo] = useState("");
  const [gitToken, setGitToken] = useState("");
  const [gitUsername, setGitUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { request } = useApi();

  const isStep0Valid = name.trim() !== "" && buildFolder.trim() !== "" && flutterVersion.trim() !== "";
  const isStep1Valid = gitRepo.trim() !== "" && gitToken.trim() !== "" && gitUsername.trim() !== "";
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
            build_folder: buildFolder,
            flutter_version: flutterVersion,
            git_repo: gitRepo,
            git_token: gitToken,
            git_username: gitUsername,
            name,
          }),
        }
      );
      if (!res.ok) throw new Error("Erreur lors de la création du projet");
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || "Erreur inconnue");
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
          <Typography variant="h6" fontWeight={700} mb={2}>Informations du projet</Typography>
          <TextField label="Nom du projet" value={name} onChange={e => setName(e.target.value)} fullWidth sx={{ mb: 2 }} required />
          <TextField label="Dossier de build (build_folder)" value={buildFolder} onChange={e => setBuildFolder(e.target.value)} fullWidth sx={{ mb: 2 }} required />
          <TextField label="Version Flutter (flutter_version)" value={flutterVersion} onChange={e => setFlutterVersion(e.target.value)} fullWidth sx={{ mb: 2 }} required />
        </Box>
      )}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={700} mb={2}>Données Git</Typography>
          <Box display="flex" gap={2} mb={2}>
            <TextField label="Dépôt Git (git_repo)" value={gitRepo} onChange={e => setGitRepo(e.target.value)} fullWidth required />
          </Box>
          <Box display="flex" gap={2} mb={2}>
            <TextField label="Git Token (git_token)" value={gitToken} onChange={e => setGitToken(e.target.value)} fullWidth required />
            <TextField label="Git Username (git_username)" value={gitUsername} onChange={e => setGitUsername(e.target.value)} fullWidth required />
          </Box>
        </Box>
      )}
      {activeStep === 2 && (
        <Box>
          <Typography variant="h6" fontWeight={700} mb={2}>Validation</Typography>
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
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Nom du projet</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{name || <span style={{ color: theme.palette.text.secondary }}>Non renseigné</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Dossier de build</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{buildFolder || <span style={{ color: theme.palette.text.secondary }}>Non renseigné</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Version Flutter</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{flutterVersion || <span style={{ color: theme.palette.text.secondary }}>Non renseigné</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Dépôt Git</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{gitRepo || <span style={{ color: theme.palette.text.secondary }}>Non renseigné</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Git Token</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{gitToken || <span style={{ color: theme.palette.text.secondary }}>Non renseigné</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main }}>Git Username</td>
                  <td style={{ padding: '12px 16px' }}>{gitUsername || <span style={{ color: theme.palette.text.secondary }}>Non renseigné</span>}</td>
                </tr>
              </tbody>
            </table>
          </Box>
        </Box>
      )}
      <Box display="flex" justifyContent="space-between" mt={4}>
        <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">Précédent</Button>
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
            Suivant
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreateProject}
            disabled={loading}
          >
            {loading ? "Création..." : "Créer le projet"}
          </Button>
        )}
            {error && (
              <Typography color="error" mt={2}>{error}</Typography>
            )}
            {success && (
              <Typography color="primary" mt={2}>Projet créé avec succès !</Typography>
            )}
      </Box>
    </Paper>
  );
};

export default NewProjectForm;
