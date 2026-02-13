"use client";

import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import StepContent from "@mui/material/StepContent";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CircularProgress from "@mui/material/CircularProgress";
import { StepIconProps } from "@mui/material/StepIcon";

interface BuildStep {
  name: string;
  status: "pending" | "running" | "success" | "failed";
  duration?: string;
}

interface BuildStepsProps {
  steps: BuildStep[];
}

// Custom step icon component
const StepIconComponent = (props: StepIconProps & { status?: string }) => {
  const { status } = props;

  if (status === "running") {
    return (
      <CircularProgress
        size={24}
        sx={{
          color: "#f59e0b",
        }}
      />
    );
  }

  if (status === "failed") {
    return (
      <CancelIcon
        sx={{
          color: "#ef4444",
          fontSize: 28,
        }}
      />
    );
  }

  if (props.completed) {
    return (
      <CheckCircleIcon
        sx={{
          color: "#10b981",
          fontSize: 28,
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        border: `2px solid ${props.active ? "#f59e0b" : "#cbd5e1"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: props.active ? "rgba(245, 158, 11, 0.1)" : "transparent",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          color: props.active ? "#f59e0b" : "#cbd5e1",
        }}
      >
        {props.icon}
      </Typography>
    </Box>
  );
};

const BuildSteps: React.FC<BuildStepsProps> = ({ steps }) => {
  const theme = useTheme();

  // Find the active step (first non-completed step)
  const activeStep = steps.findIndex(
    (step) => step.status === "pending" || step.status === "running"
  );

  // Check if build has any failed steps
  const hasFailed = steps.some((step) => step.status === "failed");

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: theme.palette.mode === "dark" ? "rgba(15, 23, 42, 0.5)" : "rgba(248, 250, 252, 0.5)",
      }}
    >
      <Typography variant="h6" fontWeight={700} mb={3}>
        Étapes du Build
      </Typography>

      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Stepper
          activeStep={activeStep === -1 ? steps.length - 1 : activeStep}
          orientation="vertical"
          sx={{
            "& .MuiStepLabel-root": {
              padding: 0,
              cursor: "default",
            },
            "& .MuiStepContent-root": {
              borderColor: theme.palette.divider,
              marginTop: 1,
            },
          }}
        >
          {steps.map((step, index) => {
            const isCompleted = step.status === "success";
            const isFailed = step.status === "failed";
            const isRunning = step.status === "running";

            return (
              <Step
                key={index}
                completed={isCompleted}
                sx={{
                  "& .MuiStepLabel-label": {
                    fontWeight: isRunning ? 600 : 500,
                    color:
                      step.status === "failed"
                        ? "#ef4444"
                        : step.status === "running"
                          ? "#f59e0b"
                          : step.status === "success"
                            ? "#10b981"
                            : "inherit",
                  },
                }}
              >
                <StepLabel
                  StepIconComponent={(props) => (
                    <StepIconComponent {...props} status={step.status} />
                  )}
                  error={isFailed}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: isRunning ? 600 : 500,
                        color:
                          step.status === "failed"
                            ? "#ef4444"
                            : step.status === "running"
                              ? "#f59e0b"
                              : step.status === "success"
                                ? "#10b981"
                                : "inherit",
                      }}
                    >
                      {step.name}
                    </Typography>
                    {step.duration && (
                      <Typography variant="caption" color="text.secondary">
                        ({step.duration})
                      </Typography>
                    )}
                  </Box>
                </StepLabel>
                {isRunning && (
                  <StepContent>
                    <Typography variant="caption" color="text.secondary">
                      En cours...
                    </Typography>
                  </StepContent>
                )}
                {isFailed && (
                  <StepContent>
                    <Typography variant="caption" sx={{ color: "#ef4444" }}>
                      Étape échouée
                    </Typography>
                  </StepContent>
                )}
              </Step>
            );
          })}
        </Stepper>
      </Box>
    </Paper>
  );
};

export default BuildSteps;
