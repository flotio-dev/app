"use client";



import { useTheme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import { Typography, Paper, TextField, Grid, Divider, Button } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';

export default function ProjectDatas() {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', build_folder: '', flutter_version: '' });
  const [project, setProject] = useState<any>(null);
  const params = useParams();
  const { request } = useApi();

  useEffect(() => {
    const fetchProject = async () => {
      if (!params.id) return;
      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${params.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setForm({
          name: data.project.name || '',
          build_folder: data.project.build_folder || '',
          flutter_version: data.project.flutter_version || '',
        });
      }
    };
    fetchProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!project) return;
    try {
      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          build_folder: form.build_folder,
          flutter_version: form.flutter_version,
          git_repo: project.git_repo || '',
          git_token: project.git_token || '',
          git_username: project.git_username || '',
          name: form.name,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project || { ...project, ...form });
        setEditMode(false);
      }
    } catch (e) {
      // Optionally handle error
      setEditMode(false);
    }
  };

  if (!project) return null;
  return (
    <Box px={6} py={6}>
      <Paper elevation={0} sx={{ borderRadius: 3, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, maxWidth: 900, mx: 'auto', mb: 4, position: 'relative' }}>
        <Box px={4} py={3}>
          <Typography variant="subtitle1" fontWeight={700} mb={3} color={theme.palette.text.primary}>
            General Information
          </Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary} minWidth={140}>
                Project Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editMode ? form.name : project.name}
                InputProps={{ readOnly: !editMode }}
                sx={{ input: { color: theme.palette.text.primary } }}
                onChange={e => handleChange('name', e.target.value)}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary} minWidth={140}>
                Build Folder
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editMode ? form.build_folder : project.build_folder}
                InputProps={{ readOnly: !editMode }}
                sx={{ input: { color: theme.palette.text.primary } }}
                onChange={e => handleChange('build_folder', e.target.value)}
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary} minWidth={140}>
                Created At
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={project.created_at ? formatDistanceToNow(parseISO(project.created_at), { addSuffix: true }) : ''}
                InputProps={{ readOnly: true }}
                sx={{ input: { color: theme.palette.text.primary } }}
                disabled
              />
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography variant="body2" fontWeight={600} color={theme.palette.text.secondary} minWidth={140}>
                Flutter Version
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={editMode ? form.flutter_version : project.flutter_version}
                InputProps={{ readOnly: !editMode }}
                sx={{ input: { color: theme.palette.text.primary } }}
                onChange={e => handleChange('flutter_version', e.target.value)}
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
}
