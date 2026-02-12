"use client";

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { Typography, Paper, TextField, Grid, Divider, Button } from '@mui/material';
import React, { useState } from 'react';
import GitHubIcon from '@mui/icons-material/GitHub';

interface ProjectGitDatasProps {
  gitName: string;
  repoUrl: string;
  branch: string;
}

const ProjectGitDatas: React.FC<ProjectGitDatasProps> = ({ gitName, repoUrl, branch }) => {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ gitName, repoUrl, branch });

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setEditMode(false);
    // Ici, on pourrait appeler une API ou un callback pour sauvegarder les modifications
  };

  return (
    <Box px={6} py={3}>
      <Paper elevation={0} sx={{ borderRadius: 3, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, maxWidth: 900, mx: 'auto', mb: 4, position: 'relative' }}>
        <Box px={4} py={3}>
          <Typography variant="subtitle1" fontWeight={700} mb={3} color={theme.palette.text.primary} display="flex" alignItems="center" gap={1}>
            <GitHubIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
            Git Information
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary} minWidth={120}>
                Git Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editMode ? form.gitName : gitName}
                InputProps={{ readOnly: !editMode }}
                sx={{ input: { color: theme.palette.text.primary } }}
                onChange={e => handleChange('gitName', e.target.value)}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary} minWidth={120}>
                Repository URL
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editMode ? form.repoUrl : repoUrl}
                InputProps={{ readOnly: !editMode }}
                sx={{ input: { color: theme.palette.text.primary } }}
                onChange={e => handleChange('repoUrl', e.target.value)}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary} minWidth={120}>
                Branch
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editMode ? form.branch : branch}
                InputProps={{ readOnly: !editMode }}
                sx={{ input: { color: theme.palette.text.primary } }}
                onChange={e => handleChange('branch', e.target.value)}
              />
            </Box>
          </Box>
        </Box>
        <Divider sx={{ borderColor: theme.palette.divider }} />
        <Box px={4} py={2} display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color={theme.palette.text.secondary}>
            Last updated now
          </Typography>
        </Box>
        <Box position="absolute" bottom={12} right={24}>
          {editMode ? (
            <Button variant="contained" color="primary" size="small" onClick={handleSave}>Enregistrer</Button>
          ) : (
            <Button variant="outlined" color="primary" size="small" onClick={() => setEditMode(true)}>Modifier</Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default ProjectGitDatas;
