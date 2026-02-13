"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Box from "@mui/material/Box";
import SideMenu from "@/components/common/SideMenu";
import BuildDetailsHeader from "@/components/builds/BuildDetailsHeader";
import BuildStepsAndLogs from "@/components/builds/BuildStepsAndLogs";
import { useApi } from "@/hooks/useApi";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { stripAnsi } from "@/lib/ansiParser";

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

interface APIProject {
  id: number;
  name: string;
  git_repo?: string;
}

export default function BuildDetailsPage() {
  const params = useParams();
  const buildId = params.buildId as string;
  const projectId = params.id as string;
  const { request } = useApi();
  const [build, setBuild] = useState<APIBuild | null>(null);
  const [project, setProject] = useState<APIProject | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const buildStatusRef = React.useRef<string | undefined>("");

  // Calculate elapsed time from build start date
  const calculateElapsedTime = (createdAt: string): number => {
    const startTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    return Math.floor((currentTime - startTime) / 1000);
  };

  // Empêche le scroll horizontal global
  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    return () => {
      document.body.style.overflowX = '';
      document.documentElement.style.overflowX = '';
    };
  }, []);

  // Keep ref to build status for timer to access current value
  useEffect(() => {
    buildStatusRef.current = build?.status;
  }, [build?.status]);

  // Fetch project details
  useEffect(() => {
    if (projectId) {
      const fetchProject = async () => {
        try {
          // Attempt to fetch specific project details
          // Depending on API, this might be /project/{id} or filtered from list
          const response = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}`);
          if (response.ok) {
            const data = await response.json();
            // Handle different possible response structures
            const projectData = data.project || data.data?.project || data;
            setProject(projectData);
          }
        } catch (error) {
          console.error("Failed to fetch project:", error);
        }
      };
      fetchProject();
    }
  }, [projectId]);

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
            if (foundBuild) {
              setBuild(foundBuild);
              // Initialize elapsed time from build start date
              setElapsedTime(calculateElapsedTime(foundBuild.created_at));
            } else {
              setBuild(null);
            }
          }
        } catch (error) {
          console.error("Failed to fetch build:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchBuild();
    }
  }, [projectId, buildId]);

  // Dynamically extract build steps from logs
  const extractStepsFromLogs = () => {
    const detectedSteps = new Map<string, string>();

    // Parse logs to find step markers
    logs.forEach((log) => {
      const plainLog = stripAnsi(log);
      // Match lines that start with [N/M]
      const stepMatch = plainLog.match(/^\[(\d+\/\d+)\]\s+(.+)$/);
      if (stepMatch) {
        const [, stepKey, label] = stepMatch;
        detectedSteps.set(`[${stepKey}]`, label.trim());
      }
    });

    // Fallback step definitions
    const defaultSteps = [
      { key: "[1/8]", label: "Cloning repository..." },
      { key: "[2/8]", label: "Detecting required Flutter/Dart version..." },
      { key: "[3/8]", label: "Processing environment files..." },
      { key: "[4/8]", label: "Keystore setup" },
      { key: "[5/8]", label: "Getting Flutter dependencies..." },
      { key: "[6/8]", label: "Building Flutter application..." },
      { key: "[7/8]", label: "Generating build information..." },
      { key: "[8/8]", label: "Uploading artifacts to S3..." },
    ];

    // Build the final step list
    const buildSteps = defaultSteps.map((step) => {
      const detected = detectedSteps.has(step.key);
      const detectLabel = detected ? detectedSteps.get(step.key)! : step.label;

      // Determine status
      let status: "pending" | "running" | "success" | "failed" = "pending";

      if (detected) {
        // Check for error in any log line containing this step
        const logsWithStep = logs.filter((log) =>
          stripAnsi(log).includes(step.key)
        );

        const hasError = logsWithStep.some((log) => {
          const plainLog = stripAnsi(log);
          return (
            plainLog.toLowerCase().includes("error") ||
            plainLog.includes("✗") ||
            plainLog.toLowerCase().includes("failed")
          );
        });

        if (hasError) {
          status = "failed";
        } else {
          // Check if this is the last detected step and build is still running
          const lastDetectedStepKey = Array.from(detectedSteps.keys()).pop();
          if (step.key === lastDetectedStepKey && build) {
            status = ["building", "running", "pending"].includes(
              build.status.toLowerCase()
            )
              ? "running"
              : "success";
          } else {
            status = "success";
          }
        }
      }

      return {
        name: `${step.key} ${detectLabel}`,
        status,
      };
    });

    return buildSteps;
  };

  // Dynamic build steps based on logs
  const buildSteps = extractStepsFromLogs();

  // Fetch logs logic
  useEffect(() => {
    if (!build) return;

    let isMounted = true;
    let pollInterval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    // Generate a unique connection ID for this session
    const connectionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

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
                  const syncRes = await request(
                    `${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/build/${buildId}/logs/sync?lastLine=${currentLastLine}&connectionId=${connectionId}`
                  );
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

                    // Update build status from sync response
                    if (isMounted) {
                      setBuild(prev => {
                        if (!prev) return null;
                        let newStatus = prev.status;

                        // If logs are appearing and status is pending, change to running
                        if (syncData.logs && syncData.logs.length > 0 && prev.status.toLowerCase() === "pending") {
                          newStatus = "running";
                        } else if (syncData.status) {
                          // Otherwise use status from sync response if available
                          newStatus = syncData.status;
                        }

                        return newStatus !== prev.status ? { ...prev, status: newStatus } : prev;
                      });
                    }

                    // Update elapsed time from sync response
                    // Removed - timer local handles elapsed time updates


                  }
                } catch (error) {
                  // Reduced logging to avoid spam
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

    // Timer for real-time elapsed time display (only if build is running)
    if (build) {
      timerInterval = setInterval(() => {
        if (isMounted) {
          // Check current status from ref (updated separately)
          const isRunning = ["building", "running"].includes(
            buildStatusRef.current?.toLowerCase() || ""
          );
          if (isRunning) {
            setElapsedTime(t => t + 1);
          }
        }
      }, 1000);
    }

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [build?.id, projectId, buildId, request]);

  // Format time to HH:mm:ss
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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
      <Box component="main" sx={{ flexGrow: 1, p: 4, marginLeft: '256px', display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <BuildDetailsHeader
          buildId={build.id.toString()}
          status={build.status}
          commit="HEAD"
          branch="main"
          message={`Build #${build.id}`}
          startTime={format(new Date(build.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
          repoUrl={project?.git_repo}
          apkUrl={build.apk_url}
        />

        <Box
          sx={{ flex: 1, overflow: 'hidden' }}
        >
          <BuildStepsAndLogs steps={buildSteps} logs={logs} />
        </Box>
      </Box>
    </div>
  );
}
