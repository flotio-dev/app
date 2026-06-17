"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SideMenu from "@/components/common/SideMenu";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useProjectConfig } from '@/context/ProjectConfigContext';

interface ProjectConfigurationHeaderProps {
  children: React.ReactNode;
}

const ProjectConfigurationHeader: React.FC<ProjectConfigurationHeaderProps> = ({ children }) => {
  const theme = useTheme();
  const params = useParams();
  const [projectName, setProjectName] = useState<string>("");
  const { project, config } = useProjectConfig();

  useEffect(() => {
    setProjectName(project?.name || config?.project_path || (params.id as string | undefined) || '');
  }, [project, config, params.id]);

  const projectId = params.id as string | undefined;

  return (
    <div className="min-h-screen flex">
      <div className="fixed left-0 top-0 h-screen w-64 z-30">
        <SideMenu />
      </div>
      <main className="flex-1 flex flex-col min-h-screen" style={{ paddingLeft: 256 }}>
        <header
          className="h-16 flex items-center px-6"
          style={{ borderBottom: `1px solid ${theme.palette.divider}` }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            color={theme.palette.text.primary}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <Link href="/projects" style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}>
              Projects
            </Link>
            <ArrowForwardIosIcon sx={{ fontSize: 20, verticalAlign: "middle" }} />
            <Link
              href={projectId ? `/projects/${projectId}` : "#"}
              style={{ color: "inherit", textDecoration: "none", cursor: "pointer" }}
            >
              {projectName}
            </Link>
            <ArrowForwardIosIcon sx={{ fontSize: 20, verticalAlign: "middle" }} />
            <span>Configuration</span>
          </Typography>
        </header>
        <div style={{ flex: 1, padding: 24 }}>{children}</div>
      </main>
    </div>
  );
};

export default ProjectConfigurationHeader;
