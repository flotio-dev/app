"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useParams } from "next/navigation";

type ProjectConfig = any;

type ProjectConfigContextValue = {
  project: any | null;
  config: ProjectConfig | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const ProjectConfigContext = createContext<ProjectConfigContextValue | undefined>(undefined);

export const ProjectConfigProvider: React.FC<{ projectId?: string; children: React.ReactNode }> = ({ projectId: projectIdProp, children }) => {
  const params = useParams();
  const { request } = useApi();
  const projectId = projectIdProp || (params?.id as string | undefined);
  const [project, setProject] = useState<any | null>(null);
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  const doFetch = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}/config`);
      if (!res.ok) throw new Error(`Failed to fetch project config (${res.status})`);
      const data = await res.json();
      const cfg = data.config || null;
      setConfig(cfg);

      let payloadProject = null as any;
      if (data.project) {
        payloadProject = data.project;
      } else if (cfg) {
        // try to fetch minimal project metadata (name, id) if API returns only config
        try {
          const metaRes = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}`);
          if (metaRes.ok) {
            const meta = await metaRes.json();
            payloadProject = { ...(meta.project || {}), ...cfg, config: cfg, id: projectId };
          } else {
            payloadProject = { ...cfg, config: cfg, id: projectId };
          }
        } catch {
          payloadProject = { ...cfg, config: cfg, id: projectId };
        }
      }

      setProject(payloadProject);
      fetchedRef.current = true;
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!projectId) return;
    if (fetchedRef.current) return;
    void doFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const refresh = async () => {
    fetchedRef.current = false;
    await doFetch();
  };

  return (
    <ProjectConfigContext.Provider value={{ project, config, loading, error, refresh }}>
      {children}
    </ProjectConfigContext.Provider>
  );
};

export function useProjectConfig() {
  const ctx = useContext(ProjectConfigContext);
  if (!ctx) throw new Error("useProjectConfig must be used within a ProjectConfigProvider");
  return ctx;
}

export default ProjectConfigContext;
