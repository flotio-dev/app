import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

const BuildsOverview: React.FC = () => {
  const theme = useTheme();

  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        p: 3,
        boxShadow: 1,
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
      }}
    >
      <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
        Aperçu
      </Typography>

      {/* Stats Cards */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }} gap={2} sx={{ mb: 3 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            textAlign: 'center',
          }}
        >
          <Typography variant="caption" color={theme.palette.text.secondary}>
            TOTAL DES BUILDS
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
            73
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            textAlign: 'center',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <Typography variant="caption" color={theme.palette.text.secondary}>
              SUCCÈS
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} sx={{ mt: 1 }}>
            <CheckCircleIcon sx={{ color: '#10b981', fontSize: 28 }} />
            <Box>
              <Typography variant="h6" fontWeight={700}>
                66
              </Typography>
              <Typography variant="caption" color={theme.palette.success.main}>
                90%
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            borderRadius: 2,
            p: 2,
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            textAlign: 'center',
          }}
        >
          <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
            <Typography variant="caption" color={theme.palette.text.secondary}>
              ÉCHEC
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" justifyContent="center" gap={1} sx={{ mt: 1 }}>
            <CancelIcon sx={{ color: '#ef4444', fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700}>
              5
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Last Activity Description */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          p: 2,
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.background.paper,
        }}
      >
        <Typography variant="body2" color={theme.palette.text.secondary} sx={{ mb: 1 }}>
          Description de la dernière activité
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          Build #42 from main deployed to preview.
        </Typography>
      </Paper>
    </Paper>
  );
};

export default BuildsOverview;
