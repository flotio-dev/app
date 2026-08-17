
'use client';
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Link from "next/link";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from '@/hooks/useApi';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useProjectConfig } from '@/context/ProjectConfigContext';
import type { BuildDTO } from '@/lib/api/types';
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";

import AddIcon from "@mui/icons-material/Add";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SearchIcon from "@mui/icons-material/Search";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import PublishIcon from "@mui/icons-material/Publish";
import ListAltIcon from "@mui/icons-material/ListAlt";
import BoutonCLI from "../common/BoutonCLI";


import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";


const ProjectsHeader: React.FC = () => {
	const theme = useTheme();
	const router = useRouter();
	const params = useParams();
	const { client } = useApi();
	const { project, config } = useProjectConfig();
	const [projectName, setProjectName] = useState<string>("");
	const [latestSuccessBuild, setLatestSuccessBuild] = useState<BuildDTO | null>(null);

	useEffect(() => {
		setProjectName(project?.name || config?.project_path || '');

		const projectId = params.id;
		if (!projectId) return;

		const fetchBuilds = async () => {
			try {
				const buildsData = await client.builds.list(Number(projectId));
				const builds = buildsData.builds || [];
				const sortedBuilds = builds.sort((a, b) =>
					new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime()
				);
				if (sortedBuilds.length > 0) {
					const lastBuild = sortedBuilds[0];
					if (lastBuild.status?.toLowerCase() === 'success') {
						setLatestSuccessBuild(lastBuild);
					}
				}
			} catch (error) {
				console.error("Error fetching builds:", error);
			}
		};

		void fetchBuilds();
	}, [params.id, client, project, config]);

	const handleDownload = async () => {
		if (!latestSuccessBuild || !params.id) {
			alert("No successful build available for download.");
			return;
		}

		try {
			const data = await client.builds.download(Number(params.id), Number(latestSuccessBuild.id));
			if (data.download_url) {
				window.open(data.download_url, "_blank");
			} else {
				alert("Download URL not found.");
			}
		} catch (error) {
			console.error("Error downloading apk:", error);
			alert("An error occurred during download.");
		}
	};

	return (
		<Box display="flex" alignItems="center" justifyContent="space-between" width="100%" height={64}>
			<Box display="flex" alignItems="center" gap={2}>
				<Typography variant="h6" fontWeight={700} color={theme.palette.text.primary} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
					<Link href="/projects" style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
						Projects
					</Link>
					<ArrowForwardIosIcon sx={{ fontSize: 20, verticalAlign: 'middle' }} />
					<Link href={params.id ? `/projects/${params.id}` : '#'} style={{ color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}>
						{projectName}
					</Link>
				</Typography>
			</Box>
			<Box display="flex" alignItems="center" gap={1.5}>
				<BoutonCLI />
				<Button
					color="inherit"
					sx={{ minWidth: 40, p: 1, borderRadius: 1 }}
				>
					<NotificationsNoneIcon sx={{ color: theme.palette.text.secondary }} />
				</Button>
				<Button
					variant="contained"
					color="primary"
					startIcon={<ListAltIcon />}
					sx={{ ml: 2, borderRadius: 1, fontWeight: 600, textTransform: 'none', px: 3, py: 1 }}
					onClick={() => router.push(`/projects/${params.id}/builds`)}
				>
					Go to builds
				</Button>
				<Button
					variant="contained"
					color="primary"
					startIcon={<CloudDownloadIcon />}
					sx={{ ml: 2, borderRadius: 1, fontWeight: 600, textTransform: 'none', px: 3, py: 1 }}
					onClick={handleDownload}
					disabled={!latestSuccessBuild}
				>
					Download APK
				</Button>
			</Box>
		</Box>
	);
};

export default ProjectsHeader;