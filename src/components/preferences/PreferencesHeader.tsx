import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

const PreferencesHeader: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      width="100%"
      height={64}
      px={0}
      display="flex"
      alignItems="center"
    >
      <Typography variant="h5" fontWeight={700} mr={2} color={theme.palette.text.primary}>
        Preferences
      </Typography>
    </Box>
  );
};

export default PreferencesHeader;
