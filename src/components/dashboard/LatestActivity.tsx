
import React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import { useTheme } from "@mui/material/styles";

const activities = [
  {
    type: "Deployment successful",
    project: "commerce-api-v2",
    time: "10:42 AM",
    icon: "✅",
  },
  {
    type: "Alex Chen pushed to main",
    project: null,
    time: "10:38 AM",
    icon: "⬆️",
  },
  {
    type: "New environment variable added to chat-websocket",
    project: null,
    time: "09:15 AM",
    icon: "⚙️",
  },
];

const LatestActivity: React.FC = () => {
  const theme = useTheme();
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
      <Typography fontWeight={600} mb={2} color={theme.palette.text.primary}>
        Latest Activity
      </Typography>
      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {activities.map((activity, idx) => (
          <Box
            key={idx}
            component="li"
            display="flex"
            alignItems="center"
            gap={2}
            fontSize={15}
            color={theme.palette.text.secondary}
            mb={1.5}
          >
            <Box fontSize={20} component="span">
              {activity.icon}
            </Box>
            <Box flex={1} display="flex" alignItems="center">
              <Typography variant="body2" color={theme.palette.text.primary}>
                {activity.type}
              </Typography>
              {activity.project && (
                <Chip
                  label={activity.project}
                  size="small"
                  sx={{
                    ml: 1,
                    fontSize: 12,
                    background: theme.palette.background.default,
                    color: theme.palette.text.secondary,
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" color={theme.palette.text.disabled}>
              {activity.time}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default LatestActivity;
