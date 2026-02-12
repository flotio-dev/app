import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

const BuildParameters: React.FC = () => {
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
        Paramètres de build
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Provider
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            Custom Runner
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Branche
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            main
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Dossier de sortie
          </Typography>
          <Typography variant="body2" fontWeight={500} color={theme.palette.text.secondary}>
            —
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Node version
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            20
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default BuildParameters;
