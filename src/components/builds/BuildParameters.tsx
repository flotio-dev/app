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
        Default Paramater
      </Typography>

      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Environment
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            Release
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Flutter Channel
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            Stable
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Build Target
          </Typography>
          <Typography variant="body2" fontWeight={500} color={theme.palette.text.secondary}>
            APK
          </Typography>
        </Box>

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Git ref
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            main
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

export default BuildParameters;
