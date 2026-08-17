"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { parseAnsiLine, stripAnsi } from "@/lib/ansiParser";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiCircle,
  FiChevronDown,
  FiChevronRight,
  FiCopy,
  FiDownload,
  FiSearch,
  FiTerminal,
  FiCheck,
} from "react-icons/fi";

interface BuildStep {
  name: string;
  status: "pending" | "running" | "success" | "failed";
  duration?: string;
}

interface BuildStepsAndLogsProps {
  steps: BuildStep[];
  logs: string[];
}

const BuildStepsAndLogs: React.FC<BuildStepsAndLogsProps> = ({ steps, logs }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Find running step index
  const currentRunningStepIndex = steps.findIndex((s) => s.status === "running");

  // Auto-expand current running step
  useEffect(() => {
    if (currentRunningStepIndex !== -1) {
      setExpandedSteps((prev) => new Set(prev).add(currentRunningStepIndex));
    }
  }, [currentRunningStepIndex]);

  // Auto-scroll when new logs arrive if autoScroll is on
  useEffect(() => {
    if (autoScroll) {
      terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  // Extract step markers from logs
  const stepMarkers = useMemo(() => {
    const markers: Record<number, number> = {};
    steps.forEach((step, index) => {
      const match = step.name.match(/\[(\d+\/\d+)\]/);
      const stepLabel = match ? match[1] : null;
      if (stepLabel) {
        const logIndex = logs.findIndex((log) =>
          stripAnsi(log).includes(`[${stepLabel}]`)
        );
        if (logIndex !== -1) {
          markers[index] = logIndex;
        }
      }
    });
    return markers;
  }, [steps, logs]);

  const getStepLogs = (stepIndex: number): string[] => {
    if (stepMarkers[stepIndex] === undefined) {
      return [];
    }

    const startIndex = stepMarkers[stepIndex];
    const nextStepIndex = stepIndex + 1;
    const endIndex =
      nextStepIndex in stepMarkers && stepMarkers[nextStepIndex] !== undefined
        ? stepMarkers[nextStepIndex]
        : logs.length;

    return logs.slice(startIndex, endIndex);
  };

  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedSteps(new Set(steps.map((_, i) => i)));
  };

  const handleCollapseAll = () => {
    setExpandedSteps(new Set());
  };

  const handleCopyLogs = () => {
    const rawText = logs.map((l) => stripAnsi(l)).join("\n");
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const rawText = logs.map((l) => stripAnsi(l)).join("\n");
    const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `build-logs-${Date.now()}.log`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (status: BuildStep["status"]) => {
    switch (status) {
      case "success":
        return <FiCheckCircle className="h-4 w-4 text-emerald-400" />;
      case "failed":
        return <FiXCircle className="h-4 w-4 text-rose-400" />;
      case "running":
        return <FiLoader className="h-4 w-4 text-amber-400 animate-spin" />;
      default:
        return <FiCircle className="h-4 w-4 text-zinc-600" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Step Accordion List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-2">
            <FiTerminal className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Pipeline Stages</h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleExpandAll}
              className="text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
            >
              Expand all
            </button>
            <span className="text-zinc-700">•</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
            >
              Collapse all
            </button>
          </div>
        </div>

        {steps.map((step, idx) => {
          const isExpanded = expandedSteps.has(idx);
          const stepLogs = getStepLogs(idx);

          return (
            <div
              key={step.name + idx}
              ref={(el) => {
                if (el) stepRefs.current.set(idx, el);
              }}
              className={`rounded-xl border transition-all duration-150 overflow-hidden ${
                step.status === "running"
                  ? "border-amber-500/40 bg-zinc-950"
                  : step.status === "failed"
                  ? "border-rose-500/40 bg-zinc-950"
                  : "border-zinc-800/80 bg-zinc-950/60"
              }`}
            >
              {/* Header */}
              <button
                type="button"
                onClick={() => toggleStep(idx)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-zinc-900/40 transition-colors select-none cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">{getStepIcon(step.status)}</div>
                  <span className="text-xs font-semibold text-zinc-100 truncate font-mono">
                    {step.name}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {step.status === "running" && (
                    <Badge variant="running" size="sm" dot>
                      Running
                    </Badge>
                  )}
                  {step.duration && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {step.duration}
                    </span>
                  )}
                  {isExpanded ? (
                    <FiChevronDown className="h-4 w-4 text-zinc-400" />
                  ) : (
                    <FiChevronRight className="h-4 w-4 text-zinc-600" />
                  )}
                </div>
              </button>

              {/* Step Logs Body */}
              {isExpanded && (
                <div className="border-t border-zinc-800/60 bg-black p-4 font-mono text-xs overflow-x-auto max-h-96">
                  {stepLogs.length === 0 ? (
                    <div className="text-zinc-600 py-2 italic text-[11px]">
                      {step.status === "pending"
                        ? "Waiting for previous step..."
                        : "No logs emitted for this step."}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      {stepLogs.map((log, lIdx) => (
                        <div
                          key={lIdx}
                          className="leading-relaxed text-zinc-300 whitespace-pre-wrap break-all select-text"
                          dangerouslySetInnerHTML={{
                            __html: parseAnsiLine(log),
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Global Terminal Card */}
      <Card className="p-0 overflow-hidden mt-6 border-zinc-800 bg-black">
        {/* Terminal Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-zinc-950 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-500/80" />
              <span className="h-3 w-3 rounded-full bg-amber-500/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-mono font-semibold text-zinc-300 ml-2">
              Live Console Output ({logs.length} lines)
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Auto scroll toggle */}
            <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0 cursor-pointer"
              />
              <span>Auto-scroll</span>
            </label>

            {/* Copy & Download actions */}
            <button
              type="button"
              onClick={handleCopyLogs}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <FiCheck className="h-3 w-3 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="h-3 w-3" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadLogs}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
            >
              <FiDownload className="h-3 w-3" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Terminal Body */}
        <div className="p-4 font-mono text-xs overflow-y-auto max-h-[500px] min-h-[260px] bg-black">
          {logs.length === 0 ? (
            <div className="text-zinc-600 py-8 text-center italic">
              Awaiting console output stream...
            </div>
          ) : (
            <div className="space-y-0.5">
              {logs.map((log, idx) => (
                <div
                  key={idx}
                  className="leading-relaxed text-zinc-300 whitespace-pre-wrap break-all select-text hover:bg-zinc-900/40 px-1 -mx-1 rounded"
                  dangerouslySetInnerHTML={{
                    __html: parseAnsiLine(log),
                  }}
                />
              ))}
              <div ref={terminalEndRef} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default BuildStepsAndLogs;
