export interface Build {
  id: string;
  projectId: string;
  status: "success" | "failed" | "building";
  startTime: string;
  endTime: string;
  description: string;
}

export const mockBuildsData: Build[] = [
  {
    id: "build_0080",
    projectId: "123",
    status: "success",
    startTime: "12 feb. 2026, 14:30",
    endTime: "12 feb. 2026, 14:45",
    description: "Commit f5e2c1a – Update README",
  },
  {
    id: "build_0078",
    projectId: "123",
    status: "success",
    startTime: "12 feb. 2026, 11:00",
    endTime: "12 feb. 2026, 11:18",
    description: "Commit 2a7c5e3 – Fix styling issues",
  },
  {
    id: "build_0076",
    projectId: "123",
    status: "failed",
    startTime: "11 feb. 2026, 15:20",
    endTime: "11 feb. 2026, 15:35",
    description: "Commit 9c3a1f8 – Add error handling",
  },
  {
    id: "build_0075",
    projectId: "123",
    status: "success",
    startTime: "11 feb. 2026, 10:10",
    endTime: "11 feb. 2026, 10:27",
    description: "Commit 5b6d2e1 – Optimize images",
  },
  {
    id: "build_0073",
    projectId: "123",
    status: "success",
    startTime: "24 juil. 2025, 11:30",
    endTime: "24 juil. 2025, 11:47",
    description: "Commit 9afc1e1 – Optimize images",
  },
  {
    id: "build_0072",
    projectId: "123",
    status: "failed",
    startTime: "23 juil. 2025, 17:12",
    endTime: "23 juil. 2025, 17:25",
    description: "Commit 1b23cde – Fix env var typo",
  },
  {
    id: "build_0070",
    projectId: "123",
    status: "success",
    startTime: "21 juil. 2025, 09:30",
    endTime: "21 juil. 2025, 09:45",
    description: "Commit c3e4d9f – Update dependencies",
  },
  {
    id: "build_0069",
    projectId: "123",
    status: "failed",
    startTime: "20 juil. 2025, 16:20",
    endTime: "20 juil. 2025, 16:35",
    description: "Commit 2f7g8h9 – Refactor utils",
  },
];
