"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";
import { useParams } from "next/navigation";
import type { Project, ProjectConfig } from "@/lib/api/types";

type ProjectConfigContextValue = {
  project: Project | null;
  config: ProjectConfig | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
};

const ProjectConfigContext = createContext<ProjectConfigContextValue | undefined>(undefined);

export const ProjectConfigProvider: React.FC<{ projectId?: string; children: React.ReactNode }> = ({ projectId: projectIdProp, children }) => {
  const params = useParams();
  const { client } = useApi();
  const projectId = projectIdProp || (params?.id as string | undefined);
  const [project, setProject] = useState<Project | null>(null);
  const [config, setConfig] = useState<ProjectConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const fetchedRef = useRef(false);

  const doFetch = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      // ProjectConfigResponse = { config } — there is no `project` key on the
      // wire shape (P-4); project metadata comes from a separate GET /project/{id}.
      const data = await client.projects.getConfig(Number(projectId));
      const cfg = data.config ?? null;
      setConfig(cfg);

      let payloadProject: Project | null = null;
      try {
        const meta = await client.projects.get(Number(projectId));
        payloadProject = meta.project ?? null;
      } catch {
        payloadProject = null;
      }

      setProject(payloadProject);
      fetchedRef.current = true;
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
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
