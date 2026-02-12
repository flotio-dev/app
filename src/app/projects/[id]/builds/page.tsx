"use client";

import { useParams } from "next/navigation";
import BuildsCharts from "@/components/builds/BuildsCharts";
import BuildHeader from "@/components/builds/BuildHeader";

export default function ProjectBuildsPage() {
  const params = useParams();
  const projectId = params.id as string;

  return (
    <BuildHeader projectId={projectId}>
      <div className="mb-8">
        <BuildsCharts projectId={projectId} />
      </div>
    </BuildHeader>
  );
}
