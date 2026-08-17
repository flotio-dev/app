"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useCliModal } from "@/context/CliModalContext";
import { FiTerminal } from "react-icons/fi";

export default function BoutonCLI() {
  const params = useParams();
  const { toggleCli, isOpen: isCliModalOpen } = useCliModal();
  const projectId = params?.id ? String(params.id) : null;

  const handleClick = () => {
    toggleCli(projectId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Open Flotio CLI"
      aria-label="CLI Terminal"
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
        isCliModalOpen
          ? "bg-cyan-950/40 border-cyan-500/50 text-cyan-300 shadow-xs"
          : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700"
      }`}
    >
      <FiTerminal className="h-3.5 w-3.5 text-cyan-400" />
      <span>CLI</span>
    </button>
  );
}
