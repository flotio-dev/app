import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useApi } from "@/hooks/useApi";
import type { BuildDTO } from "@/lib/api/types";

interface BuildsOverviewProps {
  projectId?: string;
}

const BuildsOverview: React.FC<BuildsOverviewProps> = ({ projectId }) => {
  const theme = useTheme();
  const { client } = useApi();
  const [totalBuilds, setTotalBuilds] = useState(0);
  const [successBuilds, setSuccessBuilds] = useState(0);
  const [failedBuilds, setFailedBuilds] = useState(0);
  const [successRate, setSuccessRate] = useState(0);
  const [lastBuildLog, setLastBuildLog] = useState<string>("No recent activity.");

  useEffect(() => {
    if (projectId) {
      const fetchBuildsAndLogs = async () => {
        try {
          const data = await client.builds.list(Number(projectId));
          const builds: BuildDTO[] = (data.builds ?? []).sort((a, b) =>
            new Date(b.created_at ?? "").getTime() - new Date(a.created_at ?? "").getTime()
          );

          const total = builds.length;
          const success = builds.filter((build) => build.status?.toLowerCase() === "success").length;
          const failed = builds.filter((build) => build.status?.toLowerCase() === "failed").length;
          const rate = total > 0 ? Math.round((success / total) * 100) : 0;

          setTotalBuilds(total);
          setSuccessBuilds(success);
          setFailedBuilds(failed);
          setSuccessRate(rate);

          // Fetch last build logs if available
          if (builds.length > 0) {
            const lastBuild = builds[0];
            try {
              const logsData = await client.builds.logs(Number(projectId), Number(lastBuild.id));
              const logs = logsData.logs ?? [];
              const prefix = `Build #${lastBuild.id} (${(lastBuild.status ?? "").toUpperCase()}): `;
              if (logs.length > 0) {
                setLastBuildLog(`${prefix}${logs[logs.length - 1]}`);
              } else {
                setLastBuildLog(`${prefix}No logs available.`);
              }
            } catch (logError) {
              console.error("Failed to fetch last build logs", logError);
              setLastBuildLog("Failed to load last build logs.");
            }
          }
        } catch (error) {
          console.error("Failed to fetch builds overview", error);
        }
      };

      fetchBuildsAndLogs();
    }
  }, [projectId, client]);

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
        Overview
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
            TOTAL BUILDS
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
              SUCCESS
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
              FAILED
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
          Last build log
        </Typography>
        <Typography 
          variant="body2" 
          fontWeight={500} 
          sx={{ 
            fontFamily: 'monospace', 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          {lastBuildLog}
        </Typography>
      </Paper>
    </Paper>
  );
};

export default BuildsOverview;
