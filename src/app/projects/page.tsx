
"use client";

import React, { useState } from "react";
import SideMenu from '@/components/common/SideMenu';
import ProjectsHeader from '@/components/projects/ProjectsHeader';
import ListingProjects from '@/components/projects/ListingProjects';
import { useTheme } from "@mui/material/styles";

export default function ProjectsPage() {
  const theme = useTheme();
  const [search, setSearch] = useState("");
  return (
    <div className="min-h-screen flex">
      <div className="fixed left-0 top-0 h-screen w-64 z-30">
        <SideMenu />
      </div>
      <main className="flex-1 flex flex-col min-h-screen" style={{ paddingLeft: 256 }}>
        <header className="h-16 flex items-center px-6" style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <ProjectsHeader search={search} onSearchChange={setSearch} />
        </header>
        <div className="py-10 px-8">
          <ListingProjects search={search} />
        </div>
      </main>
    </div>
  );
}
