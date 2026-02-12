"use client";

import SideMenu from '@/components/common/SideMenu';
import ProjectDatas from '@/components/projects/ProjectDatas';
import ProjectGitDatas from '@/components/projects/ProjectGitDatas';
import ProjectHeader from '@/components/projects/ProjectOverviewHeader';
import { useTheme } from '@mui/material/styles';

export default function ProjectOverviewPage() {
  const theme = useTheme();
  return (
    <div className="min-h-screen flex">
      <div className="fixed left-0 top-0 h-screen w-64 z-30">
        <SideMenu />
      </div>
      <main className="flex-1 flex flex-col min-h-screen" style={{ paddingLeft: 256 }}>
        <header className="h-16 flex items-center px-6" style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <ProjectHeader/>
        </header>
        <ProjectDatas
          name="marketing-dashboard"
          url="marketing-dashboard.veloce.app"
          github="github.com/veloce/marketing-dashboard"
          status="Active"
          environment="Production"
          description=""
          lastUpdated="2 days ago"
        />
        <ProjectGitDatas 
          gitName="marketing-dashboard"
          repoUrl="https://github.com/veloce/marketing-dashboard"
          branch="main"
        />
      </main>
    </div>
  );
}
