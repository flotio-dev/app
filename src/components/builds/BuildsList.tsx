"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import MoreVertIcon from "@mui/icons-material/MoreVert";
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

interface BuildsListProps {
  projectId?: string;
}

function extractBuilds(payload: unknown): APIBuild[] {
  if (Array.isArray(payload)) {
    return payload as APIBuild[];
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as {
    builds?: APIBuild[];
    Builds?: APIBuild[];
    data?: { builds?: APIBuild[]; Builds?: APIBuild[] };
    details?: { builds?: APIBuild[]; Builds?: APIBuild[] };
    project?: { builds?: APIBuild[]; Builds?: APIBuild[] };
  };

  return (
    data.builds ||
    data.Builds ||
    data.data?.builds ||
    data.data?.Builds ||
    data.details?.builds ||
    data.details?.Builds ||
    data.project?.builds ||
    data.project?.Builds ||
    []
  );
}

const BuildsList: React.FC<BuildsListProps> = ({ projectId }) => {
  const theme = useTheme();
  const router = useRouter();
  const { request } = useApi();
  const [builds, setBuilds] = useState<APIBuild[]>([]);
  const loadedProjectIdRef = useRef<string | null>(null);
  const fetchingProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!projectId) {
      setBuilds([]);
      loadedProjectIdRef.current = null;
      fetchingProjectIdRef.current = null;
      return;
    }

    if (
      loadedProjectIdRef.current === projectId ||
      fetchingProjectIdRef.current === projectId
    ) {
      return;
    }

    let isMounted = true;
    fetchingProjectIdRef.current = projectId;

    const fetchBuilds = async () => {
      try {
        const response = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/builds`);
        if (!response.ok) throw new Error("Failed to fetch builds");
        const data = await response.json();
        if (isMounted) {
          setBuilds(extractBuilds(data));
          loadedProjectIdRef.current = projectId;
        }
      } catch (error) {
        console.error("Failed to fetch builds:", error);
      } finally {
        if (fetchingProjectIdRef.current === projectId) {
          fetchingProjectIdRef.current = null;
        }
      }
    };

    fetchBuilds();

    return () => {
      isMounted = false;
      if (fetchingProjectIdRef.current === projectId) {
        fetchingProjectIdRef.current = null;
      }
    };
  }, [projectId, request]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return { bg: "#d1fae5", text: "#047857", label: "Succès" };
      case "failed":
        return { bg: "#fee2e2", text: "#dc2626", label: "Échec" };
      case "building":
      case "pending":
      case "running":
        return { bg: "#fef3c7", text: "#d97706", label: "En cours" };
      default:
        return { bg: "#f3f4f6", text: "#374151", label: "Inconnu" };
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Builds List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {builds.length === 0 ? (
          <Typography color="textSecondary" align="center">
            Aucun build trouvé.
          </Typography>
        ) : (
          builds.map((build) => {
            const statusColor = getStatusColor(build.status);
            return (
              <Paper
                key={build.id}
                elevation={0}
                onClick={() => router.push(`/projects/${projectId}/builds/${build.id}`)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  p: 2,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    background: theme.palette.action.hover,
                    boxShadow: 1,
                  },
                }}
              >
                {/* ID */}
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{
                    color: theme.palette.primary.main,
                    minWidth: '100px',
                    cursor: 'pointer',
                  }}
                >
                  #{build.id}
                </Typography>

                {/* Status Chip */}
                <Chip
                  label={statusColor.label}
                  size="small"
                  sx={{
                    background: statusColor.bg,
                    color: statusColor.text,
                    fontWeight: 600,
                    height: 24,
                    borderRadius: 0.75,
                    minWidth: '100px',
                  }}
                />

                {/* Start Time */}
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    minWidth: '150px',
                    paddingLeft: 20,
                  }}
                >
                  {new Date(build.created_at).toLocaleString()}
                </Typography>

                {/* End Time / Updated */}
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    minWidth: '150px',
                    paddingLeft: 5,
                  }}
                >
                  {build.updated_at ? new Date(build.updated_at).toLocaleString() : '-'}
                </Typography>

                {/* Description / Platform */}
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    paddingLeft: 10,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {build.platform}
                </Typography>

                {/* Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                  <IconButton
                    size="small"
                    sx={{
                      color: theme.palette.text.secondary,
                      '&:hover': { background: theme.palette.action.hover },
                    }}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default BuildsList;
