"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

interface BuildLogProps {
  logs: string[];
}

const BuildLog: React.FC<BuildLogProps> = ({ logs }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 0,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        height: "600px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          background: theme.palette.mode === "dark" ? "#1a1a1a" : "#f5f5f5",
        }}
      >
        <Typography variant="subtitle2" fontWeight={600}>
          Build Log
        </Typography>
      </Box>
      
      <Box
        sx={{
          flex: 1,
          p: 2,
          overflow: "auto",
          background: theme.palette.mode === "dark" ? "#0d0d0d" : "#1a1a1a",
          fontFamily: "monospace",
          fontSize: "0.75rem",
          lineHeight: 1.6,
        }}
      >
        {logs.map((log, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              gap: 2,
              "&:hover": {
                background: "rgba(255, 255, 255, 0.05)",
              },
            }}
          >
            <Typography
              component="span"
              sx={{
                color: "#666",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                minWidth: "60px",
                userSelect: "none",
              }}
            >
              {String(index + 1).padStart(3, " ")}
            </Typography>
            <Typography
              component="span"
              sx={{
                color: log.includes("error") || log.includes("✗")
                  ? "#ef4444"
                  : log.includes("warning") || log.includes("⚠")
                  ? "#f59e0b"
                  : log.includes("✓") || log.includes("success")
                  ? "#10b981"
                  : log.includes("->")
                  ? "#3b82f6"
                  : "#e5e5e5",
                fontFamily: "monospace",
                fontSize: "0.75rem",
                flex: 1,
              }}
            >
              {log}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default BuildLog;
