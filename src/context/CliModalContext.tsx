"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import CliTerminal from "@/components/cli/CliTerminal";

interface CliModalContextType {
  isOpen: boolean;
  projectId: string | null;
  openCli: (projectId?: string | null) => void;
  closeCli: () => void;
  toggleCli: (projectId?: string | null) => void;
  setProjectId: (projectId: string | null) => void;
}

const CliModalContext = createContext<CliModalContextType | undefined>(undefined);

export function CliModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const match = pathname.match(/\/projects\/([^/]+)/);
    if (match) {
      setProjectId(match[1]);
    } else {
      setProjectId(null);
    }
  }, [pathname]);

  const openCli = (pid?: string | null) => {
    if (pid !== undefined) {
      setProjectId(pid);
    }
    setIsOpen(true);
  };
  const closeCli = () => setIsOpen(false);
  const toggleCli = (pid?: string | null) => {
    setIsOpen((prev) => {
      const nextOpen = !prev;
      if (nextOpen && pid !== undefined) {
        setProjectId(pid);
      }
      return nextOpen;
    });
  };

  // Hotkey listener: Ctrl + ` or Cmd + ` (commonly used for terminals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "`") {
        e.preventDefault();
        toggleCli();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <CliModalContext.Provider value={{ isOpen, projectId, openCli, closeCli, toggleCli, setProjectId }}>
      {children}
      {isOpen && <CliTerminal onClose={closeCli} />}
    </CliModalContext.Provider>
  );
}

export function useCliModal() {
  const context = useContext(CliModalContext);
  if (!context) {
    throw new Error("useCliModal must be used within a CliModalProvider");
  }
  return context;
}
