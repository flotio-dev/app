"use client";

import React from "react";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import SideMenu from "@/components/common/SideMenu";
import BuildDetailsHeader from "@/components/builds/BuildDetailsHeader";
import BuildSteps from "@/components/builds/BuildSteps";
import BuildLog from "@/components/builds/BuildLog";
import { mockBuildsData } from "@/components/builds/mockBuildsData";

export default function BuildDetailsPage() {
  const params = useParams();
  const buildId = params.buildId as string;
  const projectId = params.id as string;

  // Trouver le build correspondant
  const build = mockBuildsData.find((b) => b.id === buildId);

  // Mock data pour les étapes
  const buildSteps = [
    { name: "Initialize Build", status: "success" as const, duration: "2s" },
    { name: "Clone Repository", status: "success" as const, duration: "5s" },
    { name: "Build Application", status: build?.status === "building" ? "running" as const : "success" as const, duration: build?.status === "building" ? undefined : "Running" },
    { name: "Upload Artifacts", status: "pending" as const },
    { name: "Deploy to Edge", status: "pending" as const },
    { name: "Assign Domains", status: "pending" as const },
  ];

  // Mock data pour les logs
  const buildLogs = [
    "10:42:01   -> veloce-dashboard@1.0.0 build",
    "10:42:01   -> vite build",
    "10:42:02   vite v4.0.0 building for production...",
    "10:42:03   transforming...",
    "10:42:05   ✓ 156 modules transformed.",
    "10:42:05   rendering chunks...",
    "10:42:06   computing gzip size...",
    "10:42:06   dist/index.html                    0.45 kB │ gzip:  0.29 kB",
    "10:42:06   dist/assets/index-a3b4c5.css      4.32 kB │ gzip:  1.21 kB",
    "10:42:06   dist/assets/index-5b8e7f.js     143.21 kB │ gzip: 46.12 kB",
    "10:42:07   (!) Some chunks are larger than 500 kBs after minification.",
    "10:42:07   - Using dynamic import() to code-split the application",
    "10:42:07   - Use build.rollupOptions.output.manualChunks to improve chunking",
    "10:42:08   ✓ Built in 6.4s",
    "10:42:09   Running Post-processing...",
    "10:42:10   Optimizing images...",
    "10:42:12   Generating static maps 🗺",
  ];

  if (!build) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <SideMenu />
        <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
          <Box>Build non trouvé</Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <SideMenu />
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <BuildDetailsHeader
          buildId={build.id}
          status={build.status}
          commit={build.description.split(" ")[1] || "abc123"}
          branch="main"
          message={build.description}
          startTime={build.startTime}
        />

        <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }} gap={3}>
          <BuildSteps steps={buildSteps} />
          <BuildLog logs={buildLogs} />
        </Box>
      </Box>
    </Box>
  );
}
