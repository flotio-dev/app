"use client";

import React from "react";

export type BadgeVariant =
  | "success"
  | "running"
  | "building"
  | "failed"
  | "error"
  | "warning"
  | "info"
  | "neutral"
  | "queued"
  | "default";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = "",
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string; dotBg: string; pulse?: boolean }> = {
    success: {
      bg: "bg-emerald-950/40",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      dotBg: "bg-emerald-400",
    },
    running: {
      bg: "bg-amber-950/40",
      text: "text-amber-400",
      border: "border-amber-500/30",
      dotBg: "bg-amber-400",
      pulse: true,
    },
    building: {
      bg: "bg-amber-950/40",
      text: "text-amber-400",
      border: "border-amber-500/30",
      dotBg: "bg-amber-400",
      pulse: true,
    },
    failed: {
      bg: "bg-rose-950/40",
      text: "text-rose-400",
      border: "border-rose-500/30",
      dotBg: "bg-rose-400",
    },
    error: {
      bg: "bg-rose-950/40",
      text: "text-rose-400",
      border: "border-rose-500/30",
      dotBg: "bg-rose-400",
    },
    warning: {
      bg: "bg-yellow-950/40",
      text: "text-yellow-400",
      border: "border-yellow-500/30",
      dotBg: "bg-yellow-400",
    },
    info: {
      bg: "bg-blue-950/40",
      text: "text-blue-400",
      border: "border-blue-500/30",
      dotBg: "bg-blue-400",
    },
    neutral: {
      bg: "bg-zinc-900",
      text: "text-zinc-400",
      border: "border-zinc-800",
      dotBg: "bg-zinc-500",
    },
    queued: {
      bg: "bg-zinc-900",
      text: "text-zinc-300",
      border: "border-zinc-700/50",
      dotBg: "bg-zinc-400",
    },
    default: {
      bg: "bg-zinc-900",
      text: "text-zinc-300",
      border: "border-zinc-800",
      dotBg: "bg-zinc-400",
    },
  };

  const currentVariant = variantStyles[variant] || variantStyles.default;
  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border transition-colors ${currentVariant.bg} ${currentVariant.text} ${currentVariant.border} ${sizeStyles} ${className}`}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full ${currentVariant.dotBg} ${
            currentVariant.pulse ? "animate-pulse" : ""
          }`}
        />
      )}
      {children}
    </span>
  );
}
