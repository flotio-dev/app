"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";
import type { ApiClient, BuildDTO, BuildsResponse, Project } from "@/lib/api/types";

type DashboardData = {
  projects: Project[];
  builds: BuildDTO[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const DashboardDataContext = createContext<DashboardData | null>(null);

let cachedData: { projects: Project[]; builds: BuildDTO[] } | null = null;
let inFlight: Promise<{ projects: Project[]; builds: BuildDTO[] }> | null = null;

async function fetchDashboardData(client: ApiClient): Promise<{ projects: Project[]; builds: BuildDTO[] }> {
  const projectsData = await client.projects.list();
  const projects = projectsData.projects ?? [];

  const projectIds = projects
    .map((project) => project.id)
    .filter((id): id is number => id !== undefined && id !== null);

  if (projectIds.length === 0) {
    return { projects, builds: [] };
  }

  const buildsResults = await Promise.allSettled(
    projectIds.map((projectId) => client.builds.list(projectId))
  );

  const builds: BuildDTO[] = buildsResults
    .filter(
      (result): result is PromiseFulfilledResult<BuildsResponse> =>
        result.status === "fulfilled"
    )
    .flatMap((result) => result.value.builds ?? []);

  return { projects, builds };
}

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const { client } = useApi();
  const [projects, setProjects] = useState<Project[]>([]);
  const [builds, setBuilds] = useState<BuildDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadData = useCallback(
    async (force = false) => {
      if (!force && cachedData) {
        if (isMountedRef.current) {
          setProjects(cachedData.projects);
          setBuilds(cachedData.builds);
          setLoading(false);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);

      let current: Promise<{ projects: Project[]; builds: BuildDTO[] }> | null = null;
      try {
        if (!inFlight || force) {
          inFlight = fetchDashboardData(client);
        }
        current = inFlight;
        const result = await current;
        cachedData = result;
        if (isMountedRef.current) {
          setProjects(result.projects);
          setBuilds(result.builds);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMountedRef.current) {
          setProjects([]);
          setBuilds([]);
          setLoading(false);
          setError(err instanceof Error ? err.message : "Failed to load dashboard data");
        }
      } finally {
        if (current && inFlight === current) {
          inFlight = null;
        }
      }
    },
    [client]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const value = useMemo(
    () => ({
      projects,
      builds,
      loading,
      error,
      refresh: () => loadData(true),
    }),
    [projects, builds, loading, error, loadData]
  );

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>;
}

export function useDashboardData() {
  const context = useContext(DashboardDataContext);
  if (!context) {
    throw new Error("useDashboardData must be used within DashboardDataProvider");
  }
  return context;
}
