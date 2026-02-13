"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useApi } from "@/hooks/useApi";

type Project = {
    id?: string | number;
    project_id?: string | number;
    name?: string;
    created_at?: string;
    updated_at?: string;
    status?: string;
    git_repo?: string;
    git_username?: string;
};

type Build = {
    id?: number;
    project_id?: string | number;
    status?: string;
    duration?: number;
    created_at?: string;
};

type DashboardData = {
    projects: Project[];
    builds: Build[];
    loading: boolean;
    error: string | null;
    refresh: () => void;
};

const DashboardDataContext = createContext<DashboardData | null>(null);

let cachedData: { projects: Project[]; builds: Build[] } | null = null;
let inFlight: Promise<{ projects: Project[]; builds: Build[] }> | null = null;

function extractProjects(payload: unknown): Project[] {
    if (Array.isArray(payload)) {
        return payload as Project[];
    }

    if (!payload || typeof payload !== "object") {
        return [];
    }

    const data = payload as { projects?: Project[] };
    return Array.isArray(data.projects) ? data.projects : [];
}

function extractBuilds(payload: unknown): Build[] {
    if (Array.isArray(payload)) {
        return payload as Build[];
    }

    if (!payload || typeof payload !== "object") {
        return [];
    }

    const data = payload as { builds?: Build[] };
    return Array.isArray(data.builds) ? data.builds : [];
}

async function fetchDashboardData(request: (input: RequestInfo, init?: RequestInit) => Promise<Response>, apiBaseUrl: string) {
    const projectsRes = await request(`${apiBaseUrl}/project`);
    if (!projectsRes.ok) {
        throw new Error("Failed to fetch projects");
    }

    const projectsData = await projectsRes.json();
    const projects = extractProjects(projectsData);

    const projectIds = projects
        .map((project) => project.id ?? project.project_id)
        .filter((id): id is string | number => id !== undefined && id !== null);

    if (projectIds.length === 0) {
        return { projects, builds: [] };
    }

    const buildsResults = await Promise.allSettled(
        projectIds.map((projectId) => request(`${apiBaseUrl}/project/${projectId}/builds`))
    );

    const buildsArrays = await Promise.all(
        buildsResults
            .filter((result): result is PromiseFulfilledResult<Response> => result.status === "fulfilled")
            .map(async (result) => {
                if (!result.value.ok) return [];
                const data = await result.value.json();
                return extractBuilds(data);
            })
    );

    return { projects, builds: buildsArrays.flat() };
}

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
    const { request } = useApi();
    const [projects, setProjects] = useState<Project[]>([]);
    const [builds, setBuilds] = useState<Build[]>([]);
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
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
            if (!apiBaseUrl) {
                if (isMountedRef.current) {
                    setProjects([]);
                    setBuilds([]);
                    setLoading(false);
                    setError("NEXT_PUBLIC_API_URL is not configured");
                }
                return;
            }

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

            let current: Promise<{ projects: Project[]; builds: Build[] }> | null = null;
            try {
                if (!inFlight || force) {
                    inFlight = fetchDashboardData(request, apiBaseUrl);
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
        [request]
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
