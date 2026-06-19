import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import BoutonCLI from "../common/BoutonCLI";

const NewProjectHeader: React.FC = () => {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" height={64}>
      <Typography variant="h6" fontWeight={700} color="text.primary">
        New Project
      </Typography>
      <BoutonCLI />
    </Box>
  );
};

export default NewProjectHeader;
