"use client";

import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import Button from "@mui/material/Button";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SideMenu from "@/components/common/SideMenu";
import StartBuildModal from "@/components/builds/StartBuildModal";

interface BuildsPageLayoutProps {
  title: string;
  projectId?: string;
  children: React.ReactNode;
}

const BuildsPageLayout: React.FC<BuildsPageLayoutProps> = ({
  title,
  projectId,
  children,
}) => {
  const theme = useTheme();
  const [openBuildModal, setOpenBuildModal] = useState(false);
  
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
          <h1 className="text-2xl font-bold">{title}</h1>
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

export default BuildsPageLayout;
