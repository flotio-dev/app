
import React from "react";
import GitHubIcon from "@mui/icons-material/GitHub";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { useTheme } from "@mui/material/styles";

const GithubConnect: React.FC = () => {
  const theme = useTheme();
  const GITHUB_AUTH_URL = process.env.NEXT_PUBLIC_GITHUB_AUTH_URL || "https://github.com/login/oauth/authorize";

  const handleConnect = () => {
    window.location.href = GITHUB_AUTH_URL;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 3,
        p: 4,
        mb: 4,
        boxShadow: 2,
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        transition: 'background 0.2s, border 0.2s',
      }}
    >
      <Box display="flex" alignItems="center" gap={2}>
        <Box flex={1}>
          <Typography variant="h6" fontWeight={600} mb={1} color={theme.palette.text.primary}>
            GitHub Connection
          </Typography>
          <Typography variant="body2" color={theme.palette.text.secondary}>
            Connect your GitHub account to enable continuous integration and advanced features.
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConnect}
          startIcon={<GitHubIcon />}
          sx={{
            px: 3,
            py: 1.5,
            fontWeight: 500,
            fontSize: '0.95rem',
            borderRadius: 1,
            boxShadow: 'none',
            textTransform: 'none',
            ml: 2,
          }}
        >
          Connect with GitHub
        </Button>
      </Box>
    </Paper>
  );
};

export default GithubConnect;
