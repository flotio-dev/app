"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useApi } from '@/hooks/useApi';
import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import SideMenu from "@/components/common/SideMenu";
import StartBuildModal from "@/components/builds/StartBuildModal";

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
  const { request } = useApi();
  const [projectName, setProjectName] = useState<string>("");

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      try {
        const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!res.ok) throw new Error('Failed to fetch project');
        const data = await res.json();
        setProjectName(data.project?.name || projectId);
      } catch {
        setProjectName(projectId);
      }
    };
    fetchProject();
  }, [projectId, request]);

  const handleStartBuild = (config: any) => {
    console.log(
      `Build started${projectId ? ` for project ${projectId}` : ""}:`,
      config
    );
    // TODO: Add API call to start build
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
          <h1 className="text-2xl font-bold" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href={projectId ? `/projects/${projectId}` : '#'} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
              {projectName}
            </Link>
            <ArrowForwardIosIcon sx={{ fontSize: 20, verticalAlign: 'middle' }} />
            Builds overview
          </h1>
          <Button
            variant="contained"
            color="primary"
            size="medium"
            startIcon={<PlayArrowIcon />}
            onClick={() => setOpenBuildModal(true)}
            sx={{
              textTransform: "uppercase",
              fontWeight: 600,
              letterSpacing: "0.5px",
            }}
          >
            Lancer un build
          </Button>
        </header>
        <div style={{ flex: 1, padding: 24 }}>{children}</div>
      </main>
      <StartBuildModal
        open={openBuildModal}
        projectId={projectId}
        onClose={() => setOpenBuildModal(false)}
        onStartBuild={handleStartBuild}
      />
    </div>
  );
};

export default BuildHeader;
