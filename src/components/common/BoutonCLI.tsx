"use client";

import React from "react";
import Button from "@mui/material/Button";
import TerminalIcon from "@mui/icons-material/Terminal";
import { useTheme } from "@mui/material/styles";
import { useParams } from "next/navigation";
import { useCliModal } from "@/context/CliModalContext";

export default function BoutonCLI() {
  const theme = useTheme();
  const params = useParams();
  const { toggleCli, isOpen: isCliModalOpen } = useCliModal();

  // Extract project ID if it exists in the URL parameters
  const projectId = params?.id ? String(params.id) : null;

  const handleClick = () => {
    toggleCli(projectId);
  };

  return (
    <Button
      color="inherit"
      onClick={handleClick}
      sx={{
        minWidth: 40,
        p: 1,
        borderRadius: 1,
        background: isCliModalOpen ? theme.palette.action.selected : "transparent",
        color: isCliModalOpen ? theme.palette.primary.main : theme.palette.text.secondary,
        "&:hover": {
          background: theme.palette.action.hover,
          color: theme.palette.primary.main,
        },
      }}
      title="Open CLI Terminal"
      aria-label="CLI Terminal"
    >
      <TerminalIcon />
    </Button>
  );
}
