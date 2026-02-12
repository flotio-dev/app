import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

const NewProjectHeader: React.FC = () => {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" height={64}>
      <Typography variant="h6" fontWeight={700} color="text.primary">
        New Project
      </Typography>
    </Box>
  );
};

export default NewProjectHeader;
