"use client";

import React, { createContext, useContext, useCallback, useState } from "react";

interface BuildRefreshContextType {
    triggerRefresh: (projectId: string) => void;
    subscribeToRefresh: (projectId: string, callback: () => void) => () => void;
}

const BuildRefreshContext = createContext<BuildRefreshContextType | undefined>(undefined);

export const BuildRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [subscribers, setSubscribers] = useState<Map<string, Set<() => void>>>(new Map());

    const triggerRefresh = useCallback((projectId: string) => {
        const projectSubscribers = subscribers.get(projectId);
        if (projectSubscribers) {
            projectSubscribers.forEach((callback) => callback());
        }
    }, [subscribers]);

    const subscribeToRefresh = useCallback(
        (projectId: string, callback: () => void) => {
            setSubscribers((prev) => {
                const newSubscribers = new Map(prev);
                const projectCallbacks = newSubscribers.get(projectId) || new Set();
                projectCallbacks.add(callback);
                newSubscribers.set(projectId, projectCallbacks);
                return newSubscribers;
            });

            // Return unsubscribe function
            return () => {
                setSubscribers((prev) => {
                    const newSubscribers = new Map(prev);
                    const projectCallbacks = newSubscribers.get(projectId);
                    if (projectCallbacks) {
                        projectCallbacks.delete(callback);
                        if (projectCallbacks.size === 0) {
                            newSubscribers.delete(projectId);
                        } else {
                            newSubscribers.set(projectId, projectCallbacks);
                        }
                    }
                    return newSubscribers;
                });
            };
        },
        []
    );

    return (
        <BuildRefreshContext.Provider value={{ triggerRefresh, subscribeToRefresh }}>
            {children}
        </BuildRefreshContext.Provider>
    );
};

export const useBuildRefresh = () => {
    const context = useContext(BuildRefreshContext);
    if (!context) {
        throw new Error("useBuildRefresh must be used within BuildRefreshProvider");
    }
    return context;
};
