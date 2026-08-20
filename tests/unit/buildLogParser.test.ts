import { describe, it, expect } from "vitest";
import { parseBuildLogsToSteps } from "@/lib/buildLogParser";

describe("buildLogParser", () => {
  const sampleLogs = [
    "===========================================",
    "STEP: Provisioning & Environment Information",
    "===========================================",
    '- Java Version: openjdk version "17.0.19" 2026-04-21',
    "- Android SDK: /opt/android-sdk",
    "- Target Flutter Version: y",
    "===========================================",
    "STEP: Cloning Repository",
    "===========================================",
    "Cloning into '/workspace/repo'...",
    "- Working directory: /workspace/repo",
    "===========================================",
    "STEP: Setting up Flutter",
    "===========================================",
    "  Downloading Flutter SDK from https://storage.googleapis.com/...",
    "Flutter 3.35.7 • channel [user-branch]",
    "===========================================",
    "STEP: Restoring Cache",
    "===========================================",
    "  Cache restore disabled",
    "===========================================",
    "STEP: Processing Configuration Files (google-services.json, etc.)",
    "===========================================",
    "- No environment files found",
    "===========================================",
    "STEP: Setting up Android Keystore",
    "===========================================",
    "  • No keystore provided",
    "  ✓ Created empty key.properties (no signing)",
    "===========================================",
    "STEP: Fetching Dependencies",
    "===========================================",
    "Resolving dependencies...",
    "Got dependencies!",
    "===========================================",
    "STEP: Building Application",
    "===========================================",
    "Running Gradle task 'assembleDebug'...",
    "✓ Built build/app/outputs/flutter-apk/app-debug.apk",
    "===========================================",
    "STEP: Collecting Artifacts",
    "===========================================",
    "===========================================",
    "STEP: Uploading Results",
    "===========================================",
    "Completed 1.0 MiB/134.7 MiB (4.0 MiB/s)",
    "upload: ../../outputs/app-29.apk to s3://test/builds/29/app-29.apk",
    "===========================================",
    "STEP: Saving Cache",
    "===========================================",
    "  Cache upload disabled",
    "===========================================",
    "STEP: Build Completed Successfully",
    "===========================================",
  ];

  it("extracts all dynamic steps from core-api logs", () => {
    const steps = parseBuildLogsToSteps(sampleLogs, "success");

    expect(steps.length).toBe(12);
    expect(steps.map((s) => s.name)).toEqual([
      "Provisioning & Environment Information",
      "Cloning Repository",
      "Setting up Flutter",
      "Restoring Cache",
      "Processing Configuration Files (google-services.json, etc.)",
      "Setting up Android Keystore",
      "Fetching Dependencies",
      "Building Application",
      "Collecting Artifacts",
      "Uploading Results",
      "Saving Cache",
      "Build Completed Successfully",
    ]);

    // All steps in a successful run should have status 'success'
    expect(steps.every((s) => s.status === "success")).toBe(true);
  });

  it("correctly partitions logs per step", () => {
    const steps = parseBuildLogsToSteps(sampleLogs, "success");

    // Cloning Repository step
    const cloneStep = steps.find((s) => s.name === "Cloning Repository");
    expect(cloneStep).toBeDefined();
    expect(cloneStep!.logs.some((l) => l.includes("Cloning into '/workspace/repo'"))).toBe(true);
    expect(cloneStep!.logs.some((l) => l.includes("Building Application"))).toBe(false);

    // Building Application step
    const buildStep = steps.find((s) => s.name === "Building Application");
    expect(buildStep).toBeDefined();
    expect(buildStep!.logs.some((l) => l.includes("Running Gradle task 'assembleDebug'"))).toBe(true);
    expect(buildStep!.logs.some((l) => l.includes("Built build/app/outputs/flutter-apk"))).toBe(true);
  });

  it("marks the active step as running when build is in progress", () => {
    const partialLogs = sampleLogs.slice(0, 11); // up to cloning repo
    const steps = parseBuildLogsToSteps(partialLogs, "running");

    expect(steps.length).toBe(2);
    expect(steps[0].name).toBe("Provisioning & Environment Information");
    expect(steps[0].status).toBe("success");
    expect(steps[1].name).toBe("Cloning Repository");
    expect(steps[1].status).toBe("running");
  });

  it("marks the failed step as failed when build status is failed", () => {
    const failedLogs = [
      "===========================================",
      "STEP: Provisioning & Environment Information",
      "===========================================",
      "Java ok",
      "===========================================",
      "STEP: Building Application",
      "===========================================",
      "Running Gradle...",
      "BUILD FAILED in 12s",
      "command failed with exit code 1",
    ];

    const steps = parseBuildLogsToSteps(failedLogs, "failed");
    expect(steps.length).toBe(2);
    expect(steps[0].status).toBe("success");
    expect(steps[1].name).toBe("Building Application");
    expect(steps[1].status).toBe("failed");
  });

  it("handles ANSI escape codes in STEP headers", () => {
    const ansiLogs = [
      "\u001b[0;32m===========================================\u001b[0m",
      "\u001b[0;32mSTEP: Setting up Flutter\u001b[0m",
      "\u001b[0;32m===========================================\u001b[0m",
      "Flutter 3.35.7",
    ];

    const steps = parseBuildLogsToSteps(ansiLogs, "running");
    expect(steps.length).toBe(1);
    expect(steps[0].name).toBe("Setting up Flutter");
    expect(steps[0].status).toBe("running");
  });

  it("handles empty logs gracefully", () => {
    const steps = parseBuildLogsToSteps([], "pending");
    expect(steps.length).toBe(1);
    expect(steps[0].status).toBe("running");
  });
});
