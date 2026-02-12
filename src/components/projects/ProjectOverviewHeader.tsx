
'use client';
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Link from "next/link";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useApi } from '@/hooks/useApi';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";

import AddIcon from "@mui/icons-material/Add";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SearchIcon from "@mui/icons-material/Search";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import PublishIcon from "@mui/icons-material/Publish";


import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";


const ProjectsHeader: React.FC = () => {
	const theme = useTheme();
	const router = useRouter();
	const params = useParams();
	const { request } = useApi();
	const [projectName, setProjectName] = useState<string>("");

	useEffect(() => {
		const fetchProject = async () => {
			const projectId = params.id;
			if (!projectId) return;
			try {
				const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${projectId}`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				});
				if (!res.ok) throw new Error('Failed to fetch project');
				const data = await res.json();
				setProjectName(data.project?.name || '');
			} catch {
				setProjectName('');
			}
		};
		fetchProject();
	}, [params.id, request]);

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

				<Button
					color="inherit"
					sx={{ minWidth: 40, p: 1, borderRadius: 1 }}
				>
					<NotificationsNoneIcon sx={{ color: theme.palette.text.secondary }} />
				</Button>
				<Button
					variant="contained"
					color="primary"
					startIcon={<PublishIcon />}
					sx={{ ml: 2, borderRadius: 1, fontWeight: 600, textTransform: 'none', px: 3, py: 1 }}
					onClick={() => router.push('/new-project')}
				>
					Redeploy build
				</Button>
				<Button
					variant="contained"
					color="primary"
					startIcon={<CloudDownloadIcon />}
					sx={{ ml: 2, borderRadius: 1, fontWeight: 600, textTransform: 'none', px: 3, py: 1 }}
					onClick={() => router.push('/new-project')}
				>
					Download project
				</Button>
			</Box>
		</Box>
	);
};

export default ProjectsHeader;