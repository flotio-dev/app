"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CircularProgress from "@mui/material/CircularProgress";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { parseAnsiLine, stripAnsi } from "@/lib/ansiParser";

interface BuildStep {
    name: string;
    status: "pending" | "running" | "success" | "failed";
    duration?: string;
}

interface BuildStepsAndLogsProps {
    steps: BuildStep[];
    logs: string[];
}

const BuildStepsAndLogs: React.FC<BuildStepsAndLogsProps> = ({
    steps,
    logs,
}) => {
    const theme = useTheme();
    const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
    const containerRef = useRef<HTMLDivElement>(null);
    const stepRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // Find the current running step
    const currentRunningStepIndex = steps.findIndex(
        (step) => step.status === "running"
    );
    const isRealTime =
        currentRunningStepIndex !== -1 ||
        steps.some((step) => step.status === "pending");

    // Auto-expand and scroll to current running step in real-time
    useEffect(() => {
        if (isRealTime && currentRunningStepIndex !== -1) {
            // Auto-expand current running step
            setExpandedSteps((prev) => {
                const newSet = new Set(prev);
                newSet.add(currentRunningStepIndex);
                return newSet;
            });

            // Scroll to running step
            setTimeout(() => {
                const element = stepRefs.current.get(currentRunningStepIndex);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            }, 100);
        }
    }, [currentRunningStepIndex, isRealTime]);

    // Extract step markers from logs
    const stepMarkers = useMemo(() => {
        const markers: { [key: number]: number } = {};
        steps.forEach((step, index) => {
            const stepLabel = step.name.match(/\[(\d+\/\d+)\]/)?.[1];
            if (stepLabel) {
                const logIndex = logs.findIndex((log) =>
                    stripAnsi(log).includes(`[${stepLabel}]`)
                );
                if (logIndex !== -1) {
                    markers[index] = logIndex;
                }
            }
        });
        return markers;
    }, [steps, logs]);

    // Get logs for a specific step
    const getStepLogs = (stepIndex: number): string[] => {
        if (!stepMarkers[stepIndex]) {
            return [];
        }

        const startIndex = stepMarkers[stepIndex];
        const nextStepIndex = stepIndex + 1;
        const endIndex =
            nextStepIndex in stepMarkers && stepMarkers[nextStepIndex]
                ? stepMarkers[nextStepIndex]
                : logs.length;

        return logs.slice(startIndex, endIndex);
    };

    const getStepIcon = (status: string) => {
        if (status === "running") {
            return (
                <CircularProgress
                    size={20}
                    sx={{
                        color: "#f59e0b",
                    }}
                />
            );
        }

        if (status === "failed") {
            return <CancelIcon sx={{ color: "#ef4444", fontSize: 20 }} />;
        }

        if (status === "success") {
            return <CheckCircleIcon sx={{ color: "#10b981", fontSize: 20 }} />;
        }

        return (
            <RadioButtonUncheckedIcon sx={{ color: theme.palette.text.disabled, fontSize: 20 }} />
        );
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

    const handleChange = (stepIndex: number) => () => {
        setExpandedSteps((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(stepIndex)) {
                newSet.delete(stepIndex);
            } else {
                newSet.add(stepIndex);
            }
            return newSet;
        });
    };

    const toggleAllSteps = () => {
        if (expandedSteps.size === steps.length) {
            // Close all
            setExpandedSteps(new Set());
        } else {
            // Open all
            setExpandedSteps(new Set(steps.map((_, i) => i)));
        }
    };

    return (
        <Paper
            elevation={0}
            sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                background:
                    theme.palette.mode === "dark"
                        ? "rgba(15, 23, 42, 0.5)"
                        : "rgba(248, 250, 252, 0.5)",
            }}
        >
            <Box
                sx={{
                    p: 3,
                    pb: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography variant="h6" fontWeight={700}>
                    Étapes du Build
                </Typography>
                <Button
                    size="small"
                    onClick={toggleAllSteps}
                    sx={{
                        textTransform: "none",
                        fontSize: "0.875rem",
                    }}
                >
                    {expandedSteps.size === steps.length ? "Tout replier" : "Tout ouvrir"}
                </Button>
            </Box>

            <Box
                ref={containerRef}
                sx={{
                    flex: 1,
                    overflow: "auto",
                }}
            >
                {steps.map((step, index) => {
                    const stepLogs = getStepLogs(index);
                    const isExpanded = expandedSteps.has(index);

                    return (
                        <div
                            key={index}
                            ref={(el) => {
                                if (el) {
                                    stepRefs.current.set(index, el);
                                } else {
                                    stepRefs.current.delete(index);
                                }
                            }}
                        >
                            <Accordion
                                expanded={isExpanded}
                                onChange={handleChange(index)}
                                sx={{
                                    border: "none",
                                    borderBottom: `1px solid ${theme.palette.divider}`,
                                    "&:last-child": {
                                        borderBottom: "none",
                                    },
                                    "&.Mui-expanded": {
                                        margin: 0,
                                    },
                                    "& .MuiAccordionSummary-root": {
                                        padding: "12px 16px",
                                        minHeight: "auto",
                                    },
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        "& .MuiAccordionSummary-content": {
                                            margin: 0,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 2,
                                        },
                                    }}
                                >
                                    {getStepIcon(step.status)}
                                    <Box display="flex" alignItems="center" gap={2} flex={1}>
                                        <Typography
                                            variant="body2"
                                            fontWeight={step.status === "running" ? 600 : 500}
                                            color={getStepColor(step.status)}
                                        >
                                            {step.name}
                                        </Typography>
                                        {step.duration && (
                                            <Typography variant="caption" color="text.secondary">
                                                ({step.duration})
                                            </Typography>
                                        )}
                                    </Box>
                                </AccordionSummary>

                                <AccordionDetails
                                    sx={{
                                        padding: 0,
                                        background:
                                            theme.palette.mode === "dark" ? "#0d0d0d" : "#1a1a1a",
                                        borderTop: `1px solid ${theme.palette.divider}`,
                                        maxHeight: "400px",
                                        overflow: "auto",
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {stepLogs.length > 0 ? (
                                        <Box sx={{ width: "100%", p: 2 }}>
                                            {stepLogs.map((log, logIndex) => {
                                                const segments = parseAnsiLine(log);

                                                return (
                                                    <Box
                                                        key={logIndex}
                                                        sx={{
                                                            display: "flex",
                                                            gap: 2,
                                                            marginBottom:
                                                                logIndex === stepLogs.length - 1 ? 0 : 1,
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
                                                                flexShrink: 0,
                                                            }}
                                                        >
                                                            {String(logIndex + 1).padStart(3, " ")}
                                                        </Typography>
                                                        <Typography
                                                            component="span"
                                                            sx={{
                                                                fontFamily: "monospace",
                                                                fontSize: "0.75rem",
                                                                flex: 1,
                                                                whiteSpace: "pre-wrap",
                                                                wordBreak: "break-word",
                                                                display: "flex",
                                                                flexWrap: "wrap",
                                                                gap: 0,
                                                            }}
                                                        >
                                                            {segments.map((segment, segIndex) => (
                                                                <span
                                                                    key={segIndex}
                                                                    style={{
                                                                        color: segment.color || "#e5e5e5",
                                                                        fontWeight: segment.bold
                                                                            ? "bold"
                                                                            : "normal",
                                                                    }}
                                                                >
                                                                    {segment.text}
                                                                </span>
                                                            ))}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    ) : (
                                        <Box sx={{ p: 2 }}>
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ fontStyle: "italic" }}
                                            >
                                                Aucun log pour cette étape
                                            </Typography>
                                        </Box>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        </div>
                    );
                })}
            </Box>
        </Paper>
    );
};

export default BuildStepsAndLogs;

