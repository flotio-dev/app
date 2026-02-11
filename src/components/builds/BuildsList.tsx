import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

const buildsData = [
  {
    status: 'building',
    project: 'veloce-dashboard',
    description: 'fix: update sidebar navigation items',
    branch: 'main',
    environment: 'Production',
    duration: 'Building...',
    time: 'Just now',
    avatar: '👤',
  },
  {
    status: 'success',
    project: 'veloce-landing',
    description: 'feat: add new pricing section',
    branch: 'feat/pricing',
    environment: '',
    duration: '1m 45s',
    time: '12m ago',
    avatar: '👤',
  },
  {
    status: 'success',
    project: 'veloce-api',
    description: 'chore: upgrade dependencies',
    branch: 'main',
    environment: 'Production',
    duration: '2m 12s',
    time: '45m ago',
    avatar: '👤',
  },
  {
    status: 'failed',
    project: 'veloce-dashboard',
    description: 'refactor: authentication flow components',
    branch: 'dev',
    environment: '',
    duration: 'Failed',
    time: '2h ago',
    avatar: '👤',
  },
  {
    status: 'success',
    project: 'veloce-landing',
    description: 'content: update blog posts',
    branch: 'main',
    environment: 'Production',
    duration: '58s',
    time: '4h ago',
    avatar: '👤',
  },
];

const BuildsList: React.FC = () => {
  const theme = useTheme();

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <input
            placeholder="Search deployments..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
              fontSize: '14px',
            }}
          />
        </Box>
        <Box display="flex" gap={1}>
          <select
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}
          >
            <option>All Projects</option>
          </select>
          <select
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}
          >
            <option>All Environments</option>
          </select>
          <select
            style={{
              padding: '8px 12px',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '8px',
              background: theme.palette.background.paper,
              color: theme.palette.text.primary,
            }}
          >
            <option>Status</option>
          </select>
        </Box>
      </Box>

      {/* Builds List */}
      <Box>
        {buildsData.map((build, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              '&:last-child': { borderBottom: 'none' },
              cursor: 'pointer',
              transition: 'background 0.2s',
              '&:hover': { background: theme.palette.action.hover },
            }}
          >
            {/* Status Indicator */}
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background:
                  build.status === 'success'
                    ? '#10b981'
                    : build.status === 'failed'
                    ? '#ef4444'
                    : build.status === 'building'
                    ? '#f59e0b'
                    : '#6b7280',
              }}
            />

            {/* Project Info */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" fontWeight={600}>
                {build.project}
              </Typography>
              <Box display="flex" gap={1} sx={{ mt: 0.5 }}>
                <Typography variant="caption" color={theme.palette.text.secondary}>
                  {build.description}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    background: theme.palette.action.hover,
                    px: 1,
                    borderRadius: 1,
                    color: theme.palette.text.secondary,
                  }}
                >
                  {build.branch}
                </Typography>
              </Box>
            </Box>

            {/* Environment */}
            {build.environment && (
              <Typography
                variant="caption"
                sx={{
                  background: '#d1fae5',
                  color: '#047857',
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  fontWeight: 600,
                }}
              >
                {build.environment}
              </Typography>
            )}

            {/* Duration */}
            <Box sx={{ minWidth: '80px' }}>
              <Typography
                variant="caption"
                color={theme.palette.text.secondary}
                sx={{ display: 'block' }}
              >
                DURATION
              </Typography>
              <Typography
                variant="caption"
                fontWeight={500}
                sx={{
                  color:
                    build.status === 'failed'
                      ? '#ef4444'
                      : build.status === 'building'
                      ? '#f59e0b'
                      : theme.palette.text.primary,
                }}
              >
                {build.duration}
              </Typography>
            </Box>

            {/* Time */}
            <Box sx={{ minWidth: '60px' }}>
              <Typography variant="caption" color={theme.palette.text.secondary}>
                TIME
              </Typography>
              <Typography variant="caption" fontWeight={500}>
                {build.time}
              </Typography>
            </Box>

            {/* Avatar */}
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: theme.palette.action.hover,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {build.avatar}
            </Box>

            {/* Arrow */}
            <Typography sx={{ color: theme.palette.text.secondary }}>›</Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default BuildsList;
