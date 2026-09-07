import React from "react";
import { SiAndroid } from "react-icons/si";

interface AndroidBadgeProps {
  target?: "apk" | "aab" | string;
  size?: "sm" | "md";
  className?: string;
}

export function AndroidBadge({ target = "apk", size = "sm", className = "" }: AndroidBadgeProps) {
  const isAab = target.toLowerCase() === "aab";

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-md border transition-all ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-mono ${className}`}
    >
      <SiAndroid className={size === "sm" ? "h-3 w-3 text-[#3DDC84]" : "h-3.5 w-3.5 text-[#3DDC84]"} />
      <span className="font-semibold text-emerald-300">Android</span>
      <span className="text-emerald-500/60">•</span>
      <span className="uppercase text-emerald-200/90 font-bold">{isAab ? "AAB" : "APK"}</span>
    </span>
  );
}

export default AndroidBadge;
