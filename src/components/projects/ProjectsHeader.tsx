
'use client';

import React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import SearchIcon from "@mui/icons-material/Search";
import BoutonCLI from "../common/BoutonCLI";


import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

interface ProjectsHeaderProps {
	search: string;
	onSearchChange: (value: string) => void;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ search, onSearchChange }) => {
	const theme = useTheme();
	const router = useRouter();
	return (
		<Box display="flex" alignItems="center" justifyContent="space-between" width="100%" height={64}>
			<Box display="flex" alignItems="center" gap={2}>
				<Typography variant="h6" fontWeight={700} color={theme.palette.text.primary}>
					Projects
				</Typography>
			</Box>
			<Box display="flex" alignItems="center" gap={1.5}>
				<TextField
					size="small"
					placeholder="Search projects..."
					value={search}
					onChange={e => onSearchChange(e.target.value)}
					sx={{ minWidth: 180, background: theme.palette.background.paper, borderRadius: 1 }}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon sx={{ color: theme.palette.text.secondary }} />
							</InputAdornment>
						),
					}}
				/>
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
					startIcon={<AddIcon />}
					sx={{ ml: 2, borderRadius: 1, fontWeight: 600, textTransform: 'none', px: 3, py: 1 }}
					onClick={() => router.push('/new-project')}
				>
					New Project
				</Button>
			</Box>
		</Box>
	);
};

export default ProjectsHeader;
