"use client";

import ProjectConfigurationContent from "@/components/projects/configuration/ProjectConfigurationContent";
import ProjectConfigurationHeader from "@/components/projects/configuration/ProjectConfigurationHeader";

export default function ProjectConfigurationPage() {
  return (
    <ProjectConfigurationHeader>
      <ProjectConfigurationContent />
    </ProjectConfigurationHeader>
  );
}
