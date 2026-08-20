"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { parseAnsiLine, stripAnsi } from "@/lib/ansiParser";
import type { ParsedBuildStep } from "@/lib/buildLogParser";
import { Badge } from "@/components/ui/Badge";
import {
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiCircle,
  FiChevronDown,
  FiChevronRight,
  FiCopy,
  FiDownload,
  FiTerminal,
  FiCheck,
} from "react-icons/fi";

export interface BuildStep {
  name: string;
  status: "pending" | "running" | "success" | "failed";
  duration?: string;
  logs?: string[];
  startIndex?: number;
  endIndex?: number;
  stepNumber?: number;
}

interface BuildStepsAndLogsProps {
  steps: (BuildStep | ParsedBuildStep)[];
  logs: string[];
}

const AnsiLogLine: React.FC<{ line: string; className?: string }> = ({ line, className }) => {
  const segments = useMemo(() => parseAnsiLine(line), [line]);
  return (
    <div className={className}>
      {segments.map((segment, idx) => (
        <span
          key={idx}
          style={{
            color: segment.color || undefined,
            fontWeight: segment.bold ? 600 : undefined,
          }}
        >
          {segment.text}
        </span>
      ))}
    </div>
  );
};

const BuildStepsAndLogs: React.FC<BuildStepsAndLogsProps> = ({ steps, logs }) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([0]));
  const [copied, setCopied] = useState(false);
  const [stepCopied, setStepCopied] = useState<number | null>(null);
  const stepRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Find running or failed step index
  const currentRunningStepIndex = steps.findIndex((s) => s.status === "running");
  const failedStepIndex = steps.findIndex((s) => s.status === "failed");

  // Auto-expand current running step or failed step
  useEffect(() => {
    if (failedStepIndex !== -1) {
      setExpandedSteps((prev) => new Set(prev).add(failedStepIndex));
    } else if (currentRunningStepIndex !== -1) {
      setExpandedSteps((prev) => new Set(prev).add(currentRunningStepIndex));
    }
  }, [currentRunningStepIndex, failedStepIndex]);

  const getStepLogs = (stepIndex: number): string[] => {
    const step = steps[stepIndex];
    if (step && "logs" in step && Array.isArray(step.logs)) {
      return step.logs;
    }

    if (step && typeof step.startIndex === "number" && typeof step.endIndex === "number") {
      return logs.slice(step.startIndex, step.endIndex);
    }

    return stepIndex === 0 ? logs : [];
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

  const handleCopyLogs = async () => {
    try {
      const plainLogs = logs.map((l) => stripAnsi(l)).join("\n");
      await navigator.clipboard.writeText(plainLogs);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy logs:", err);
    }
  };

  const handleDownloadLogs = () => {
    const plainLogs = logs.map((l) => stripAnsi(l)).join("\n");
    const blob = new Blob([plainLogs], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `build-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (status: BuildStep["status"]) => {
    switch (status) {
      case "success":
        return <FiCheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />;
      case "failed":
        return <FiXCircle className="h-4 w-4 text-rose-400 shrink-0" />;
      case "running":
        return <FiLoader className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />;
      case "pending":
      default:
        return <FiCircle className="h-4 w-4 text-zinc-600 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Steps Accordion Header & Global Actions */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 pb-1">
          <div className="flex items-center gap-2">
            <FiTerminal className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Pipeline Stages</h3>
            <span className="text-xs text-zinc-500 font-mono">({logs.length} log lines)</span>
          </div>

          <div className="flex items-center gap-2 text-xs flex-wrap">
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
            <span className="text-zinc-700">•</span>

            <button
              type="button"
              onClick={handleCopyLogs}
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
              title="Copy all logs"
            >
              {copied ? (
                <>
                  <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <FiCopy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <span className="text-zinc-700">•</span>

            <button
              type="button"
              onClick={handleDownloadLogs}
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-colors"
              title="Download all logs"
            >
              <FiDownload className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Steps Accordion */}
        {steps.map((step, index) => {
          const isExpanded = expandedSteps.has(index);
          const stepLogs = getStepLogs(index);

          return (
            <div
              key={index}
              ref={(el) => {
                if (el) stepRefs.current.set(index, el);
                else stepRefs.current.delete(index);
              }}
              className="rounded-lg border border-zinc-800 bg-zinc-900/50 overflow-hidden transition-colors"
            >
              {/* Step Header Button */}
              <div className="flex items-center justify-between px-4 py-3 hover:bg-zinc-800/40 transition-colors">
                <button
                  type="button"
                  onClick={() => toggleStep(index)}
                  className="flex items-center gap-3 min-w-0 pr-2 flex-1 text-left cursor-pointer"
                >
                  <span className="flex items-center justify-center h-5 w-5 rounded bg-zinc-800 text-[10px] font-mono font-semibold text-zinc-400 shrink-0">
                    {index + 1}
                  </span>
                  {getStepIcon(step.status)}
                  <span
                    className={`text-xs font-mono font-medium truncate ${
                      step.status === "running"
                        ? "text-cyan-300"
                        : step.status === "failed"
                        ? "text-rose-300"
                        : step.status === "success"
                        ? "text-zinc-200"
                        : "text-zinc-400"
                    }`}
                  >
                    {step.name}
                  </span>
                </button>

                <div className="flex items-center gap-2.5 shrink-0">
                  {stepLogs.length > 0 && (
                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded">
                      {stepLogs.length} {stepLogs.length === 1 ? "line" : "lines"}
                    </span>
                  )}
                  {step.status === "running" && (
                    <Badge variant="running" size="sm" dot>
                      Running
                    </Badge>
                  )}
                  {step.status === "failed" && (
                    <Badge variant="failed" size="sm">
                      Failed
                    </Badge>
                  )}
                  {step.duration && (
                    <span className="text-[11px] font-mono text-zinc-500">
                      {step.duration}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      try {
                        const plainLogs = stepLogs.map((l) => stripAnsi(l)).join("\n");
                        await navigator.clipboard.writeText(plainLogs);
                        setStepCopied(index);
                        setTimeout(() => setStepCopied(null), 2000);
                      } catch {
                        // ignore
                      }
                    }}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Copy step logs"
                  >
                    {stepCopied === index ? (
                      <FiCheck className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <FiCopy className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleStep(index)}
                    className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <FiChevronDown className="h-4 w-4 text-zinc-400" />
                    ) : (
                      <FiChevronRight className="h-4 w-4 text-zinc-600" />
                    )}
                  </button>
                </div>
              </div>

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
                        <AnsiLogLine
                          key={lIdx}
                          line={log}
                          className="leading-relaxed text-zinc-300 whitespace-pre-wrap break-all select-text"
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
    </div>
  );
};

export default BuildStepsAndLogs;
