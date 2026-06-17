"use client";

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { Typography, Paper, TextField, Grid, Divider, Button } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { useProjectConfig } from '@/context/ProjectConfigContext';
import GitHubIcon from '@mui/icons-material/GitHub';

const ProjectGitDatas: React.FC = () => {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ gitUsername: '', repoUrl: '', gitToken: '' });
  const [project, setProject] = useState<any>(null);
  const params = useParams();
  const { request } = useApi();
  const { project: ctxProject, config } = useProjectConfig();

  useEffect(() => {
    if (!ctxProject && !config) return;
    const payloadProject = ctxProject || (config ? { ...config, config, id: params.id } : null);
    if (payloadProject) {
      setProject(payloadProject);
      setForm({
        gitUsername: payloadProject.git_username || payloadProject.config?.git_username || '',
        repoUrl: payloadProject.git_repo || payloadProject.config?.git_repo || '',
        gitToken: payloadProject.git_token || payloadProject.config?.git_token || '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxProject, config]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Removed duplicate handleSave
  const handleSave = async () => {
    if (!project) return;
    try {
      const currentConfig = project.config || {};
      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${project.id}/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...currentConfig,
          git_repo: form.repoUrl,
          git_token: form.gitToken,
          git_username: form.gitUsername,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const nextConfig = data.config || data || { ...currentConfig, git_repo: form.repoUrl, git_token: form.gitToken, git_username: form.gitUsername };
        setProject({
          ...project,
          config: nextConfig,
          git_repo: nextConfig.git_repo ?? form.repoUrl,
          git_token: nextConfig.git_token ?? form.gitToken,
          git_username: nextConfig.git_username ?? form.gitUsername,
        });
        setEditMode(false);
      }
    } catch (e) {
      setEditMode(false);
    }
  };

  if (!project) return null;
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
                Git Username
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={form.gitUsername}
                InputProps={{ readOnly: !editMode }}
                sx={{ input: { color: theme.palette.text.primary } }}
                onChange={e => handleChange('gitUsername', e.target.value)}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary} minWidth={120}>
                Git Token
              </Typography>
              <TextField
                fullWidth
                size="small"
                type={editMode ? 'text' : 'password'}
                value={editMode ? form.gitToken : (form.gitToken ? '••••••••' : '')}
                InputProps={{ readOnly: !editMode }}
                sx={{ input: { color: theme.palette.text.primary } }}
                onChange={e => handleChange('gitToken', e.target.value)}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary} minWidth={120}>
                Repository URL
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={form.repoUrl}
                InputProps={{ readOnly: !editMode }}
                sx={{ input: { color: theme.palette.text.primary } }}
                onChange={e => handleChange('repoUrl', e.target.value)}
              />
            </Box>
          </Box>
        </Box>
        <Divider sx={{ borderColor: theme.palette.divider }} />
        <Box px={4} py={2} display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="caption" color={theme.palette.text.secondary}>
            Last updated {project.updated_at ? formatDistanceToNow(parseISO(project.updated_at), { addSuffix: true }) : ''}
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
