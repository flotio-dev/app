"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CircularProgress from "@mui/material/CircularProgress";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";

interface BuildStep {
  name: string;
  status: "pending" | "running" | "success" | "failed";
  duration?: string;
}

interface BuildStepsProps {
  steps: BuildStep[];
}

const BuildSteps: React.FC<BuildStepsProps> = ({ steps }) => {
  const theme = useTheme();

  const getStepIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />;
      case "failed":
        return <CancelIcon sx={{ color: "#ef4444", fontSize: 20 }} />;
      case "running":
        return <CircularProgress size={20} sx={{ color: "#f59e0b" }} />;
      default:
        return <RadioButtonUncheckedIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />;
    }
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case "success":
        return "#10b981";
      case "failed":
        return "#ef4444";
      case "running":
        return "#f59e0b";
      default:
        return theme.palette.text.disabled;
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        height: "fit-content",
      }}
    >
      <Typography variant="h6" fontWeight={700} mb={3}>
        Étapes du Build
      </Typography>
      
      <Box display="flex" flexDirection="column" gap={2}>
        {steps.map((step, index) => (
          <Box key={index} display="flex" alignItems="center" gap={2}>
            {getStepIcon(step.status)}
            <Box flex={1}>
              <Typography
                variant="body2"
                fontWeight={step.status === "running" ? 600 : 500}
                color={getStepColor(step.status)}
              >
                {step.name}
              </Typography>
            </Box>
            {step.duration && (
              <Typography variant="caption" color="text.secondary">
                {step.duration}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default BuildSteps;
