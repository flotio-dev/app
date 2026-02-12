"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import SideMenu from "@/components/common/SideMenu";
import BuildDetailsHeader from "@/components/builds/BuildDetailsHeader";
import BuildSteps from "@/components/builds/BuildSteps";
import BuildLog from "@/components/builds/BuildLog";
import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

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

export default function BuildDetailsPage() {
  const params = useParams();
  const buildId = params.buildId as string;
  const projectId = params.id as string;
  const { request } = useApi();
  const [build, setBuild] = useState<APIBuild | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Empêche le scroll horizontal global
  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    };
  }, []);

  // Fetch builds using the API
  useEffect(() => {
    if (projectId && buildId) {
      const fetchBuild = async () => {
        try {
          // We fetch all builds because there is currently no endpoint for a single build
          const response = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/builds`);
          if (response.ok) {
            const data = await response.json();
            const foundBuild = (data.builds || []).find((b: APIBuild) => b.id.toString() === buildId);
            setBuild(foundBuild || null);
          }
        } catch (error) {
          console.error("Failed to fetch build:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBuild();
    }
  }, [projectId, buildId, request]);

  // Define the expected build steps
  const stepsDefinitions = [
    { key: "[1/8]", label: "Cloning repository..." },
    { key: "[2/8]", label: "Detecting required Flutter/Dart version..." },
    { key: "[3/8]", label: "Processing environment files..." },
    { key: "[4/8]", label: "Skipping keystore setup" },
    { key: "[5/8]", label: "Getting Flutter dependencies..." },
    { key: "[6/8]", label: "Building Flutter application..." },
    { key: "[7/8]", label: "Generating build information..." },
    { key: "[8/8]", label: "Uploading artifacts to S3..." },
  ];

  // Dynamic build steps based on logs
  const buildSteps = stepsDefinitions.map((step) => {
    const isPresent = logs.some((log) => log.includes(step.key));
    return {
      name: `${step.key} ${step.label}`,
      status: isPresent ? ("success" as const) : ("pending" as const),
    };
  });

  // Fetch logs logic
  useEffect(() => {
    if (!build) return;

    let isMounted = true;
    let pollInterval: NodeJS.Timeout;

    const fetchLogs = async () => {
      try {
        const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/build/${buildId}/logs`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setLogs(data.logs || []);
            
            // If building or running, poll for updates
            const isRunning = ["building", "running", "pending"].includes(build.status.toLowerCase());
            if (isRunning) {
              let currentLastLine = (data.logs || []).length;
              
              pollInterval = setInterval(async () => {
                if (!isMounted) return;
                try {
                  const syncRes = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/build/${buildId}/logs/sync?last_line=${currentLastLine}`);
                  if (syncRes.ok) {
                    const syncData = await syncRes.json();
                    
                    if (syncData.logs && syncData.logs.length > 0) {
                      setLogs(prev => [...prev, ...syncData.logs]);
                    }
                    
                    if (typeof syncData.last_line === 'number') {
                      currentLastLine = syncData.last_line;
                    } else {
                      currentLastLine += (syncData.logs?.length || 0);
                    }

                    // Update build status and duration if changed
                    if (syncData.status || typeof syncData.elapsed_time === 'number') {
                       setBuild(prev => {
                          if (!prev) return null;
                          const updated = { ...prev };
                          let changed = false;

                          if (syncData.status && syncData.status !== prev.status) {
                             updated.status = syncData.status;
                             changed = true;
                          }
                          if (typeof syncData.elapsed_time === 'number' && syncData.elapsed_time !== prev.duration) {
                             updated.duration = syncData.elapsed_time;
                             changed = true;
                          }
                          
                          return changed ? updated : prev;
                       });
                    }
                  }
                } catch (error) {
                  console.error("Sync error:", error);
                }
              }, 3000);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch logs:", error);
      }
    };

    fetchLogs();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [build?.id, build?.status, projectId, buildId, request]);

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <SideMenu />
        <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
          <Box>Chargement...</Box>
        </Box>
      </Box>
    );
  }

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
    <div className="min-h-screen flex">
      <div className="fixed left-0 top-0 h-screen w-64 z-30">
        <SideMenu />
      </div>
      <Box component="main" sx={{ flexGrow: 1, p: 4, marginLeft: '256px' }}>
        <BuildDetailsHeader
          buildId={build.id.toString()}
          status={build.status}
          commit="HEAD"
          branch="main"
          message={`Build #${build.id}`}
          startTime={format(new Date(build.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
          duration={build.duration}
        />

        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: '1fr 2fr' }}
          gap={3}
          alignItems="stretch"
          sx={{ minHeight: "clamp(320px, 60vh, 520px)" }}
        >
          <Box sx={{ height: '100%' }}>
            <BuildSteps steps={buildSteps} />
          </Box>
          <Box sx={{ height: '100%', maxHeight: '450px' }}>
            <BuildLog logs={logs} />
          </Box>
        </Box>
      </Box>
    </div>
  );
}
