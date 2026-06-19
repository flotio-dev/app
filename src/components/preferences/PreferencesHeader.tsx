import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import BoutonCLI from "../common/BoutonCLI";

const PreferencesHeader: React.FC = () => {
  const theme = useTheme();
  return (
    <Box
      width="100%"
      height={64}
      px={0}
      display="flex"
      alignItems="center"
      justifyContent="space-between"
    >
      <Typography variant="h5" fontWeight={700} mr={2} color={theme.palette.text.primary}>
        Preferences
      </Typography>
      <BoutonCLI />
    </Box>
  );
};

export default PreferencesHeader;
