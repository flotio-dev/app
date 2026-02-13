import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useApi } from "@/hooks/useApi";

interface APIBuild {
  apk_url: string;
  container_id: string;
  created_at: string;
  duration: number;
  id: number;
  platform: string;
  project_id: number;
  status: string;
  updated_at: string;
}

interface BuildsOverviewProps {
  projectId?: string;
}

const BuildsOverview: React.FC<BuildsOverviewProps> = ({ projectId }) => {
  const theme = useTheme();
  const { request } = useApi();
  const [totalBuilds, setTotalBuilds] = useState(0);
  const [successBuilds, setSuccessBuilds] = useState(0);
  const [failedBuilds, setFailedBuilds] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  useEffect(() => {
    if (projectId) {
      const fetchBuilds = async () => {
        try {
          const response = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/builds`);
          if (response.ok) {
            const data = await response.json();
            const builds: APIBuild[] = data.builds || [];

            const total = builds.length;
            const success = builds.filter((build) => build.status.toLowerCase() === "success").length;
            const failed = builds.filter((build) => build.status.toLowerCase() === "failed").length;
            const rate = total > 0 ? Math.round((success / total) * 100) : 0;

            setTotalBuilds(total);
            setSuccessBuilds(success);
            setFailedBuilds(failed);
            setSuccessRate(rate);
          }
        } catch (error) {
          console.error("Failed to fetch builds overview", error);
        }
      };

      fetchBuilds();
    }
  }, [projectId, request]);

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
            {totalBuilds}
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
                {successBuilds}
              </Typography>
              <Typography variant="caption" color={theme.palette.success.main}>
                {successRate}%
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
              {failedBuilds}
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
