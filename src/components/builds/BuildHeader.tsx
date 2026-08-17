"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApi } from '@/hooks/useApi';
import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Typography from "@mui/material/Typography";
import SideMenu from "@/components/common/SideMenu";
import StartBuildModal from "@/components/builds/StartBuildModal";
import BoutonCLI from "@/components/common/BoutonCLI";

interface BuildHeaderProps {
  projectId?: string;
  children: React.ReactNode;
}

const BuildHeader: React.FC<BuildHeaderProps> = ({
  projectId,
  children,
}) => {
  const theme = useTheme();
  const [openBuildModal, setOpenBuildModal] = useState(false);
  const { client } = useApi();
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        // ProjectConfigResponse has no `project` key (P-11): fetch the project
        // itself for the display name.
        const projectResp = await client.projects.get(Number(projectId));
        setProjectName(projectResp.project?.name || projectId);
      } catch {
        setProjectName(projectId);
      }
    };
    fetchProject();
  }, [projectId, client]);

  const handleStartBuild = () => {
    setOpenBuildModal(true);
  };
   
  const handleModalStartBuild = async () => {
      // The API call is now handled inside StartBuildModal
      setOpenBuildModal(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="fixed left-0 top-0 h-screen w-64 z-30">
        <SideMenu />
      </div>
      <main className="flex-1 flex flex-col min-h-screen" style={{ paddingLeft: 256 }}>
        <header
          className="h-16 flex items-center justify-between px-6"
          style={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Typography variant="h6" fontWeight={700} color={theme.palette.text.primary} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/projects" style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
              Projects
            </Link>
            <ArrowForwardIosIcon sx={{ fontSize: 20, verticalAlign: 'middle' }} />
            <Link href={projectId ? `/projects/${projectId}` : '#'} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
              {projectName}
            </Link>
            <ArrowForwardIosIcon sx={{ fontSize: 20, verticalAlign: 'middle' }} />
            <Link href={projectId ? `/projects/${projectId}/builds` : '#'} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
              Builds
            </Link>
          </Typography>
          <div className="flex items-center gap-3">
            <BoutonCLI />
            <Button
              variant="contained"
              color="primary"
              size="medium"
              startIcon={<PlayArrowIcon />}
              onClick={handleStartBuild}
              sx={{
                textTransform: "uppercase",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              Start build
            </Button>
          </div>
        </header>
        <div style={{ flex: 1, padding: 24 }}>{children}</div>
      </main>
      <StartBuildModal
        open={openBuildModal}
        projectId={projectId}
        onClose={() => setOpenBuildModal(false)}
        onStartBuild={handleModalStartBuild}
      />
    </div>
  );
};

export default BuildHeader;
