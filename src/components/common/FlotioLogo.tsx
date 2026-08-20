import React from "react";

interface FlotioLogoProps {
  className?: string;
  size?: number | string;
}

export default function FlotioLogo({ className = "h-7 w-7", size }: FlotioLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="flotio-app-brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B4A" />
          <stop offset="50%" stopColor="#FF5722" />
          <stop offset="100%" stopColor="#E11D48" />
        </linearGradient>
      </defs>
      {/* Top horizontal capsule */}
      <rect x="18" y="20" width="64" height="20" rx="10" fill="url(#flotio-app-brand-gradient)" />
      {/* Lower stem & curved hook */}
      <path
        d="M18 48C18 42.477 22.477 38 28 38H52C57.523 38 62 42.477 62 48C62 53.523 57.523 58 52 58H38V72C38 77.523 33.523 82 28 82C22.477 82 18 77.523 18 72V48Z"
        fill="url(#flotio-app-brand-gradient)"
      />
    </svg>
  );
}
