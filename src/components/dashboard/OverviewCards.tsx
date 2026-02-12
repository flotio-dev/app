
import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

const cards = [
  {
    label: "Total Deployments",
    value: "1,284",
    change: "+12% from last week",
    changeColor: "success.main",
  },
  {
    label: "Success Rate",
    value: "99.8%",
    change: "+0.2% improvement",
    changeColor: "success.main",
  },
  {
    label: "Avg Build Time",
    value: "42s",
    change: "Stable performance",
    changeColor: "text.secondary",
  },
];

const OverviewCards: React.FC = () => {
  const theme = useTheme();
  return (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={3}>
      {cards.map((card) => (
        <Paper
          key={card.label}
          elevation={1}
          sx={{
            borderRadius: 2,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            boxShadow: 1,
            border: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.paper,
            transition: 'background 0.2s, border 0.2s',
          }}
        >
          <Typography variant="body2" color={theme.palette.text.secondary}>
            {card.label}
          </Typography>
          <Typography variant="h4" fontWeight={700} color={theme.palette.text.primary}>
            {card.value}
          </Typography>
          <Typography variant="caption" color={card.changeColor}>
            {card.change}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
};

export default OverviewCards;
