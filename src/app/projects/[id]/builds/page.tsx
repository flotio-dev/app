"use client";

import { useParams } from "next/navigation";
import BuildsCharts from "@/components/builds/BuildsCharts";
import BuildsPageLayout from "@/components/builds/BuildsPageLayout";

export default function ProjectBuildsPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <BuildsPageLayout
      title={`Builds - Project ${projectId}`}
      projectId={projectId}
    >
      <div className="mb-8">
        <BuildsCharts projectId={projectId} />
      </div>
    </BuildsPageLayout>
  );
}
