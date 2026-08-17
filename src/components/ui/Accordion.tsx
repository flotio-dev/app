"use client";

import React, { useState } from "react";

export interface AccordionSectionProps {
  id?: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export function AccordionSection({
  title,
  description,
  badge,
  icon,
  defaultOpen = false,
  isOpen: controlledIsOpen,
  onToggle,
  children,
  className = "",
}: AccordionSectionProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const nextState = !open;
    if (!isControlled) {
      setInternalIsOpen(nextState);
    }
    if (onToggle) {
      onToggle(nextState);
    }
  };

  return (
    <div
      className={`rounded-xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden transition-all duration-200 ${
        open ? "border-zinc-700/80 bg-zinc-950" : "hover:border-zinc-800"
      } ${className}`}
    >
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-zinc-900/40 select-none cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500"
      >
        <div className="flex items-center gap-3.5 min-w-0 pr-4">
          {icon && (
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 className="text-sm font-semibold text-zinc-100">{title}</h4>
              {badge}
            </div>
            {description && (
              <p className="text-xs text-zinc-400 mt-0.5 truncate">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <svg
            className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${
              open ? "rotate-180 text-zinc-100" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-zinc-800/50">
          {children}
        </div>
      )}
    </div>
  );
}

export function AccordionGroup({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`space-y-3 ${className}`}>{children}</div>;
}
