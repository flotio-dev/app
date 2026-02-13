
import React, { useEffect, useState } from "react";
import { useApi } from '@/hooks/useApi';
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
  const { request } = useApi();
  const [hasInstallation, setHasInstallation] = useState<boolean | null>(null);
  const GITHUB_INSTALL_URL = "https://github.com/apps/flotio-app/installations/new";

  useEffect(() => {
    const checkInstallation = async () => {
      try {
        const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/github/installations`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to check installation');
        const data = await res.json();
        console.log(data);
        setHasInstallation(data.details && data.details.installation_id ? true : false);
      } catch {
        setHasInstallation(false);
      }
    };
    checkInstallation();
  }, [request]);

  const handleConnect = () => {
    window.location.href = GITHUB_INSTALL_URL;
  };

  const handleDisconnect = async () => {
    try {
      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/github/disconnect`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Erreur lors de la déconnexion de GitHub');
      setHasInstallation(false);
    } catch (err) {
      alert('Erreur lors de la déconnexion de GitHub');
    }
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
        {hasInstallation === null ? (
          <Button disabled sx={{ ml: 2 }}>Loading...</Button>
        ) : hasInstallation ? (
          <Button
            variant="contained"
            color="error"
            onClick={handleDisconnect}
            startIcon={<GitHubIcon />}
            sx={{ px: 3, py: 1.5, fontWeight: 500, fontSize: '0.95rem', borderRadius: 1, boxShadow: 'none', textTransform: 'none', ml: 2 }}
          >
            Connected (Disconnect)
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            onClick={handleConnect}
            startIcon={<GitHubIcon />}
            sx={{ px: 3, py: 1.5, fontWeight: 500, fontSize: '0.95rem', borderRadius: 1, boxShadow: 'none', textTransform: 'none', ml: 2 }}
          >
            Connect with GitHub
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default GithubConnect;
