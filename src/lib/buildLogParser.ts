import { stripAnsi } from "@/lib/ansiParser";

export interface ParsedBuildStep {
  id: string;
  name: string;
  stepNumber: number;
  status: "pending" | "running" | "success" | "failed";
  logs: string[];
  startIndex: number;
  endIndex: number;
  duration?: string;
}

/**
 * Parses build logs into dynamic steps based on core-api log_step format:
 * ===========================================
 * STEP: <Step Name>
 * ===========================================
 * Also supports legacy [X/Y] and [cache] step markers.
 */
export function parseBuildLogsToSteps(
  logs: string[] = [],
  buildStatus: string = "running"
): ParsedBuildStep[] {
  const normalizedStatus = (buildStatus || "").toLowerCase();
  const isBuildFailed = ["failed", "error", "cancelled"].includes(normalizedStatus);
  const isBuildRunning = ["building", "running", "pending"].includes(normalizedStatus);

  interface RawMarker {
    name: string;
    lineIndex: number;
  }

  const rawMarkers: RawMarker[] = [];

  for (let i = 0; i < logs.length; i++) {
    const rawLine = logs[i];
    const plain = stripAnsi(rawLine).trim();

    // Match "STEP: <Step Name>" (from core-api script.go)
    const stepMatch = plain.match(/^STEP:\s*(.+)$/i);
    if (stepMatch) {
      const stepName = stepMatch[1].trim();
      rawMarkers.push({
        name: stepName,
        lineIndex: i > 0 && stripAnsi(logs[i - 1]).trim().startsWith("=====") ? i - 1 : i,
      });
      continue;
    }

    // Match legacy "[1/8] Cloning repository..."
    const legacyMatch = plain.match(/^\[(\d+\/\d+|cache)\]\s*(.+)$/i);
    if (legacyMatch) {
      rawMarkers.push({
        name: legacyMatch[2].trim(),
        lineIndex: i,
      });
    }
  }

  // If no step markers were found
  if (rawMarkers.length === 0) {
    if (logs.length === 0) {
      return [
        {
          id: "step-init",
          name: "Provisioning & Environment Information",
          stepNumber: 1,
          status: isBuildRunning ? "running" : isBuildFailed ? "failed" : "success",
          logs: [],
          startIndex: 0,
          endIndex: 0,
        },
      ];
    }

    return [
      {
        id: "step-1",
        name: "Build Output",
        stepNumber: 1,
        status: isBuildFailed ? "failed" : isBuildRunning ? "running" : "success",
        logs,
        startIndex: 0,
        endIndex: logs.length,
      },
    ];
  }

  const parsedSteps: ParsedBuildStep[] = [];

  for (let idx = 0; idx < rawMarkers.length; idx++) {
    const current = rawMarkers[idx];
    const next = rawMarkers[idx + 1];

    const startIndex = current.lineIndex;
    const endIndex = next ? next.lineIndex : logs.length;
    const stepLogs = logs.slice(startIndex, endIndex);

    const isLastStep = idx === rawMarkers.length - 1;
    const isCompletionMarker =
      current.name.toLowerCase().includes("build completed") ||
      current.name.toLowerCase().includes("completed successfully");

    let status: ParsedBuildStep["status"] = "success";

    if (isLastStep) {
      if (isCompletionMarker) {
        status = "success";
      } else if (isBuildFailed) {
        status = "failed";
      } else if (isBuildRunning) {
        status = "running";
      } else {
        status = "success";
      }
    } else {
      // Step already finished, but check if there were fatal errors and build failed
      const hasFatalError = stepLogs.some((l) => {
        const p = stripAnsi(l).toLowerCase();
        return (
          p.includes("✗ failed") ||
          p.includes("fatal: ") ||
          p.includes("build failed") ||
          p.includes("command failed with exit code")
        );
      });

      if (hasFatalError && isBuildFailed && idx === rawMarkers.length - 2) {
        status = "failed";
      } else {
        status = "success";
      }
    }

    parsedSteps.push({
      id: `step-${idx + 1}`,
      name: current.name,
      stepNumber: idx + 1,
      status,
      logs: stepLogs,
      startIndex,
      endIndex,
    });
  }

  return parsedSteps;
}
