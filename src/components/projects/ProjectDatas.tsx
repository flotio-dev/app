"use client";



import { useTheme } from '@mui/material/styles';

import Box from '@mui/material/Box';
import { Typography, Paper, TextField, Divider, Button, FormControl, InputLabel, Select, MenuItem, FormHelperText, Chip } from '@mui/material';
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useParams } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import { useProjectConfig } from '@/context/ProjectConfigContext';

type FlutterVersionOption = {
  channel: string;
  version: string;
};

export default function ProjectDatas() {
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ name: '', build_folder: '', flutter_version: '' });
  const [project, setProject] = useState<any>(null);
  const [flutterVersions, setFlutterVersions] = useState<FlutterVersionOption[]>([]);
  const [loadingFlutterVersions, setLoadingFlutterVersions] = useState(false);
  const params = useParams();
  const { request } = useApi();
  const { project: ctxProject, config } = useProjectConfig();

  useEffect(() => {
    if (!ctxProject && !config) return;
    const payloadProject = ctxProject || (config ? { ...config, config, id: params.id } : null);
    if (payloadProject) {
      setProject(payloadProject);
      const initialFlutterVersion = payloadProject.flutter_version || payloadProject.config?.flutter_version || '';
      const initialBuildFolder = payloadProject.build_folder || payloadProject.config?.project_path || '';
      setForm({
        name: payloadProject.name || '',
        build_folder: initialBuildFolder,
        flutter_version: initialFlutterVersion,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctxProject, config, params.id]);

  useEffect(() => {
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
        }
      } catch (err) {
        console.error('Failed to fetch flutter versions', err);
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

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!project) return;
    try {
      const currentConfig = project.config || {};
      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          config: {
            ...currentConfig,
            project_path: form.build_folder,
            flutter_version: form.flutter_version,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project || {
          ...project,
          name: form.name,
          config: {
            ...currentConfig,
            project_path: form.build_folder,
            flutter_version: form.flutter_version,
          },
        });
        setEditMode(false);
      }
    } catch (e) {
      // Optionally handle error
      setEditMode(false);
    }
  };

  const projectFlutterVersion = project?.flutter_version || project?.config?.flutter_version || '';
  const projectBuildFolder = project?.build_folder || project?.config?.project_path || '';

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
                value={editMode ? form.name : (project.name ?? '')}
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
                value={editMode ? form.build_folder : projectBuildFolder}
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
              {editMode ? (
                <FormControl fullWidth size="small">
                  <InputLabel id="project-flutter-version-label">Flutter Version</InputLabel>
                  <Select
                    labelId="project-flutter-version-label"
                    value={form.flutter_version || projectFlutterVersion}
                    label="Flutter Version"
                    disabled={loadingFlutterVersions}
                    onChange={e => handleChange('flutter_version', e.target.value)}
                    renderValue={(value) => {
                      const selected = flutterVersions.find((item) => item.version === value);
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', pr: 1 }}>
                          <Typography fontWeight={600}>{value}</Typography>
                          {selected?.channel && <Chip size="small" label={selected.channel} />}
                        </Box>
                      );
                    }}
                  >
                    {loadingFlutterVersions ? (
                      <MenuItem disabled value="">Loading...</MenuItem>
                    ) : flutterVersions.length > 0 ? (
                      [
                        !flutterVersions.some((item) => item.version === (form.flutter_version || projectFlutterVersion)) && (form.flutter_version || projectFlutterVersion) ? (
                          <MenuItem key="current" value={form.flutter_version || projectFlutterVersion}>
                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                              <Typography fontWeight={600}>{form.flutter_version || projectFlutterVersion}</Typography>
                              <Chip size="small" label="current" />
                            </Box>
                          </MenuItem>
                        ) : null,
                        ...flutterVersions.map((item) => (
                          <MenuItem key={`${item.channel}-${item.version}`} value={item.version}>
                            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                              <Typography fontWeight={600}>{item.version}</Typography>
                              <Chip size="small" label={item.channel} />
                            </Box>
                          </MenuItem>
                        )),
                      ]
                    ) : (
                      <MenuItem value={form.flutter_version || projectFlutterVersion}>{form.flutter_version || projectFlutterVersion}</MenuItem>
                    )}
                  </Select>
                  <FormHelperText>Choisis une version disponible depuis l’API Flutter.</FormHelperText>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  size="small"
                  value={projectFlutterVersion}
                  InputProps={{ readOnly: true }}
                  sx={{ input: { color: theme.palette.text.primary } }}
                />
              )}
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
