
import React, { useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";

const data = [
  { day: "Mon", value: 120 },
  { day: "Tue", value: 150 },
  { day: "Wed", value: 180 },
  { day: "Thu", value: 160 },
  { day: "Fri", value: 200 },
  { day: "Sat", value: 170 },
  { day: "Sun", value: 140 },
];

export function DeploymentsChart() {
  const theme = useTheme();
  const [selected, setSelected] = useState("7d");
  const periods = ["7d", "30d", "90d"];
  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        p: 3,
        boxShadow: 1,
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        transition: 'background 0.2s, border 0.2s',
      }}
    >
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography fontWeight={600} color={theme.palette.text.primary}>
          Total deployments - Detailed view
        </Typography>
        <Box display="flex" gap={1}>
          {periods.map((period) => (
            <Button
              key={period}
              size="small"
              variant={selected === period ? "contained" : "outlined"}
              color={selected === period ? "primary" : "inherit"}
              sx={{
                minWidth: 40,
                fontSize: 12,
                px: 1.5,
                py: 0.5,
                borderRadius: 2,
                textTransform: 'none',
              }}
              onClick={() => setSelected(period)}
            >
              {period}
            </Button>
          ))}
        </Box>
      </Box>
      <Box width="100%" height={160} display="flex" alignItems="flex-end" gap={1.5}>
        {data.map((d) => (
          <Box key={d.day} display="flex" flexDirection="column" alignItems="center" flex={1}>
            <Box
              width={24}
              borderRadius={1}
              sx={{
                background: theme.palette.primary.main,
                height: `${d.value / 2}px`,
                transition: 'background 0.2s',
              }}
            />
            <Typography variant="caption" mt={1} color={theme.palette.text.secondary}>
              {d.day}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
