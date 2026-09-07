"use client";

import React, { useState, useRef, useEffect } from "react";
import { FiActivity, FiServer, FiCpu, FiExternalLink, FiChevronDown } from "react-icons/fi";
import { SiKubernetes, SiPrometheus, SiGrafana } from "react-icons/si";

export function ClusterStatusMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-text-secondary bg-surface-elevated/70 border border-border-subtle hover:text-text-primary hover:bg-surface-hover hover:border-border-default transition-all cursor-pointer shadow-xs"
        title="View Kubernetes cluster & monitoring telemetry"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-mono text-[11px] text-emerald-400 font-semibold">K8S Cluster</span>
        <FiChevronDown className={`h-3 w-3 text-text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl bg-surface border border-border-default p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-subtle">
            <div className="flex items-center gap-1.5">
              <SiKubernetes className="h-4 w-4 text-[#326CE5]" />
              <span className="text-xs font-bold text-text-primary">Flotio Dedicated Cluster</span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Operational
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-2 rounded-lg bg-surface-elevated/60 border border-border-subtle space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1.5">
                  <FiServer className="h-3 w-3" /> Android Runner Nodes
                </span>
                <span className="font-mono text-text-primary font-medium">Dedicated K8S</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1.5">
                  <FiCpu className="h-3 w-3" /> Build Isolation
                </span>
                <span className="font-mono text-emerald-400">Pod per Build</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-text-muted flex items-center gap-1.5">
                  <FiActivity className="h-3 w-3" /> Redundancy
                </span>
                <span className="font-mono text-cyan-400">Multi-Replica HA</span>
              </div>
            </div>

            <div className="pt-1">
              <p className="text-[10px] uppercase font-semibold tracking-wider text-text-muted mb-1.5 px-0.5">
                Observability Stack
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <a
                  href="https://grafana.flotio.ovh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border-subtle text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors group"
                >
                  <span className="flex items-center gap-1.5">
                    <SiGrafana className="h-3.5 w-3.5 text-[#F46800]" />
                    Grafana
                  </span>
                  <FiExternalLink className="h-3 w-3 text-text-muted group-hover:text-text-primary" />
                </a>

                <a
                  href="https://prometheus.flotio.ovh"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border-subtle text-[11px] font-medium text-text-secondary hover:text-text-primary transition-colors group"
                >
                  <span className="flex items-center gap-1.5">
                    <SiPrometheus className="h-3.5 w-3.5 text-[#E6522C]" />
                    Prometheus
                  </span>
                  <FiExternalLink className="h-3 w-3 text-text-muted group-hover:text-text-primary" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClusterStatusMenu;
