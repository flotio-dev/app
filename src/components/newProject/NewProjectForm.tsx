"use client";
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";


const steps = ["Description du projet", "Git & Déploiement", "Validation"];

const NewProjectForm: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [gitRepo, setGitRepo] = useState("");
  const [buildDir, setBuildDir] = useState("");
  const [outputDir, setOutputDir] = useState("");

  const isStep0Valid = name.trim() !== "";
  const isStep1Valid = gitRepo.trim() !== "" && buildDir.trim() !== "" && outputDir.trim() !== "";
  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const theme = useTheme();
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
          <Typography variant="h6" fontWeight={700} mb={2}>Description du projet</Typography>
          <TextField label="Nom du projet" value={name} onChange={e => setName(e.target.value)} fullWidth sx={{ mb: 2 }} />
          <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez le but du projet, l'équipe et l'environnement (prod, staging...)" multiline minRows={4} fullWidth sx={{ mb: 2 }} />
        </Box>
      )}
      {activeStep === 1 && (
        <Box>
          <Typography variant="h6" fontWeight={700} mb={2}>Git & Déploiement</Typography>
          <Box display="flex" gap={2} mb={2}>
            <TextField label="Dépôt Git" value={gitRepo} onChange={e => setGitRepo(e.target.value)} fullWidth />
          </Box>
          <Box display="flex" gap={2} mb={2}>
            <TextField label="Dossier de build" value={buildDir} onChange={e => setBuildDir(e.target.value)} fullWidth />
            <TextField label="Dossier de sortie" value={outputDir} onChange={e => setOutputDir(e.target.value)} fullWidth />
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
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Description</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{description || <span style={{ color: theme.palette.text.secondary }}>Aucune description</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Dépôt Git</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{gitRepo || <span style={{ color: theme.palette.text.secondary }}>Non renseigné</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.divider}` }}>Dossier de build</td>
                  <td style={{ padding: '12px 16px', borderBottom: `1px solid ${theme.palette.divider}` }}>{buildDir || <span style={{ color: theme.palette.text.secondary }}>Non renseigné</span>}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600, padding: '12px 16px', color: theme.palette.primary.main }}>Dossier de sortie</td>
                  <td style={{ padding: '12px 16px' }}>{outputDir || <span style={{ color: theme.palette.text.secondary }}>Non renseigné</span>}</td>
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
          <Button variant="contained" color="primary">Créer le projet</Button>
        )}
      </Box>
    </Paper>
  );
};

export default NewProjectForm;
