import React from "react";
import Box from "@mui/material/Box";
import BuildsOverview from "./BuildsOverview";
import BuildParameters from "./BuildParameters";
import BuildsList from "./BuildsList";

interface BuildsChartsProps {
  projectId?: string;
}

const BuildsCharts: React.FC<BuildsChartsProps> = ({ projectId }) => {
  return (
    <Box display="flex" flexDirection="column" gap={3}>
      {/* Top Section: Overview and Parameters */}
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: '2fr 1fr' }} gap={3}>
        <BuildsOverview projectId={projectId} />
        <BuildParameters />
      </Box>

      {/* Bottom Section: Builds List */}
      <BuildsList projectId={projectId} />
    </Box>
  );
};

export default BuildsCharts;

