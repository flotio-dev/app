"use client";

import ProjectConfigurationContent from "@/components/projects/configuration/ProjectConfigurationContent";
import ProjectConfigurationHeader from "@/components/projects/configuration/ProjectConfigurationHeader";
import { ProjectConfigProvider } from '@/context/ProjectConfigContext';

export default function ProjectConfigurationPage() {
  return (
    <ProjectConfigProvider>
      <ProjectConfigurationHeader>
        <ProjectConfigurationContent />
      </ProjectConfigurationHeader>
    </ProjectConfigProvider>
  );
}
