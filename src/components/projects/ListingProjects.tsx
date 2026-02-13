"use client";
import { useTheme } from '@mui/material/styles';
import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useApi } from '@/hooks/useApi';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';




interface ListingProjectsProps {
	search: string;
}

type APIProject = {
	id: number;
	name: string;
	git_repo?: string | null;
	git_username?: string | null;
	updated_at?: string | null;
	status?: string | null;
};

type ProjectRow = {
	id: number;
	name: string;
	repoUrl: string;
	status: string;
	statusKey: string;
	icon: string;
	lastDeployment: string;
	author: string;
};

function extractProjects(payload: unknown): APIProject[] {
	if (Array.isArray(payload)) {
		return payload as APIProject[];
	}

	if (!payload || typeof payload !== 'object') {
		return [];
	}

	const data = payload as {
		projects?: APIProject[];
		Projects?: APIProject[];
		data?: { projects?: APIProject[]; Projects?: APIProject[] };
		details?: { projects?: APIProject[]; Projects?: APIProject[] };
	};

	return (
		data.projects ||
		data.Projects ||
		data.data?.projects ||
		data.data?.Projects ||
		data.details?.projects ||
		data.details?.Projects ||
		[]
	);
}

function StatusBadge({ status }: { status: string }) {
	const getStatusColor = (s: string) => {
		switch (s?.toLowerCase()) {
			case "success":
				return { bg: "#d1fae5", text: "#047857", label: "Success" };
			case "failed":
				return { bg: "#fee2e2", text: "#dc2626", label: "Failed" };
			case "building":
			case "running":
				return { bg: "#fef3c7", text: "#d97706", label: "Running" };
			case "waiting":
				return { bg: "#e0f2fe", text: "#0284c7", label: "Waiting" };
			case "pending":
				return { bg: "#e0f2fe", text: "#0284c7", label: "Pending" };
			case "cancelled":
				return { bg: "#e0f2fe", text: "#0284c7", label: "Cancelled" };
			default:
				return { bg: "#f3f4f6", text: "#374151", label: "Any build" };
		}
	};

	const { bg, text, label } = getStatusColor(status);

	return (
		<span style={{
			background: bg,
			color: text,
			padding: '0.25rem 0.75rem',
			borderRadius: '8px',
			fontSize: '0.75rem',
			fontWeight: 600,
			display: 'inline-block',
			minWidth: '120px',
			textAlign: 'center'
		}}>
			{label}
		</span>
	);
}

function getStatusLabelForFilter(status: string) {
	switch (status?.toLowerCase()) {
		case "success": return "Succès";
		case "failed": return "Échec";
		case "building":
		case "running": return "En cours";
		case "waiting":
		case "pending": return "En attente";
		case "aucun build": return "Aucun build";
		default: return status || "Aucun build";
	}
}

export default function ListingProjects({ search }: ListingProjectsProps) {
	const theme = useTheme();
	const router = useRouter();
	const { request } = useApi();
	const hasLoadedProjectsRef = useRef(false);
	const isFetchingProjectsRef = useRef(false);
	const [openMenuId, setOpenMenuId] = useState<number | null>(null);
	useEffect(() => {
		if (openMenuId === null) return;
		const handleClick = (e: MouseEvent) => {
			const menu = document.getElementById('project-actions-menu');
			if (menu && !menu.contains(e.target as Node)) {
				setOpenMenuId(null);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [openMenuId]);
	const [projects, setProjects] = useState<ProjectRow[]>([]);
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

	useEffect(() => {
		if (hasLoadedProjectsRef.current || isFetchingProjectsRef.current) {
			return;
		}

		let isMounted = true;
		isFetchingProjectsRef.current = true;

		const fetchProjects = async () => {
			try {
				const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				});
				if (!res.ok) throw new Error('Failed to fetch projects');
				const data = await res.json();

				// Fetch last build status for each project
				const projectsData = extractProjects(data);
				const projectsWithStatus = await Promise.all(projectsData.map(async (p: APIProject) => {
					try {
						const buildsRes = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${p.id}/builds`);
						if (buildsRes.ok) {
							const buildsData = await buildsRes.json();
							// Access "builds" array exactly as specified in the response type
							if (buildsData && Array.isArray(buildsData.builds) && buildsData.builds.length > 0) {
								// Start by sorting builds by ID descending to get the very last one
								const sortedBuilds = buildsData.builds.sort((a: any, b: any) => b.id - a.id);
								return { ...p, status: sortedBuilds[0].status };
							}
						}
						return { ...p, status: null };
					} catch {
						return { ...p, status: null };
					}
				}));

				if (!isMounted) {
					return;
				}
				setProjects(
					projectsWithStatus.map((p: APIProject): ProjectRow => ({
						id: p.id,
						name: p.name,
						repoUrl: p.git_repo || '',
						status: p.status || 'Aucun build',
						statusKey: '',
						icon: p.name ? p.name[0].toUpperCase() : '?',
						lastDeployment: p.updated_at || '',
						author: p.git_username || '',
					}))
				);
				hasLoadedProjectsRef.current = true;
			} catch (error) {
				console.error('Failed to fetch projects:', error);
			} finally {
				isFetchingProjectsRef.current = false;
			}
		};
		fetchProjects();
		return () => {
			isMounted = false;
			isFetchingProjectsRef.current = false;
		};
	}, [request]);

	const [statusFilter, setStatusFilter] = useState<string>("");
	const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
	const openStatusMenu = Boolean(statusAnchorEl);
	const allStatuses = Array.from(new Set(projects.map(p => p.status)));
	const filteredProjects = projects.filter(p => {
		const matchesSearch =
			p.name.toLowerCase().includes(search.toLowerCase()) ||
			p.repoUrl.toLowerCase().includes(search.toLowerCase()) ||
			p.author.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter ? p.status === statusFilter : true;
		return matchesSearch && matchesStatus;
	});

	const handleMenuOpen = (id: number) => {
		setOpenMenuId(id);
	};

	const handleDelete = async (id: number) => {
		try {
			const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project/${id}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!res.ok) throw new Error('Failed to delete project');
			setProjects(projects.filter(p => p.id !== id));
		} catch {
			// Optionally handle error (e.g., show a toast)
		} finally {
			setOpenMenuId(null);
			setConfirmDeleteId(null);
		}
	};

	return (
		<div className="w-full max-w-5xl mx-auto mt-6">
			<div className="flex flex-wrap gap-4 mb-4 items-center">
				<div style={{ color: theme.palette.text.secondary }} className="text-sm">Showing {filteredProjects.length} projects</div>
			</div>
			<div style={{ background: theme.palette.background.paper }} className="overflow-x-auto rounded-lg">
				<table className="min-w-full text-left text-sm" style={{ color: theme.palette.text.primary }}>
					<thead>
						<tr style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
							<th className="px-6 py-4 font-semibold tracking-wider">PROJECT</th>
							<th className="px-6 py-4 font-semibold tracking-wider">DEPOT GIT</th>
							<th className="px-6 py-4 font-semibold tracking-wider">LAST UPDATE</th>
							<th className="px-6 py-4 font-semibold tracking-wider">
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span>STATUS</span>
									<Button
										variant="text"
										size="small"
										sx={{ minWidth: 0, p: 0, fontSize: '0.85em', textTransform: 'none' }}
										onClick={e => setStatusAnchorEl(e.currentTarget)}
									>
										{statusFilter ? statusFilter : 'All'}
									</Button>
									<Menu
										anchorEl={statusAnchorEl}
										open={openStatusMenu}
										onClose={() => setStatusAnchorEl(null)}
									>
										<MenuItem
											selected={statusFilter === ""}
											onClick={() => { setStatusFilter(""); setStatusAnchorEl(null); }}
										>
											All Statuses
										</MenuItem>
										{allStatuses.map(status => (
											<MenuItem
												key={status}
												selected={statusFilter === status}
												onClick={() => { setStatusFilter(status); setStatusAnchorEl(null); }}
											>
												{getStatusLabelForFilter(status)}
											</MenuItem>
										))}
									</Menu>
								</div>
							</th>
							<th className="px-6 py-4 font-semibold tracking-wider">ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{filteredProjects.map((project) => (
							<tr
								key={project.id}
								style={{ borderBottom: `1px solid ${theme.palette.divider}`, cursor: 'pointer' }}
								className="hover:bg-opacity-70 transition"
								onMouseOver={e => (e.currentTarget.style.background = theme.palette.action.hover)}
								onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
								onClick={e => {
									// Ne pas déclencher la navigation si clic sur le bouton actions
									if ((e.target as HTMLElement).closest('button')) return;
									router.push(`/projects/${project.id}`);
								}}
							>
								<td className="flex items-center gap-3 px-6 py-4">
									<span style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, fontWeight: 700, fontSize: 18, background: theme.palette.primary.main, color: theme.palette.getContrastText(theme.palette.primary.main) }}>{project.icon}</span>
									<div>
										<div className="font-semibold text-base leading-tight">{project.name}</div>
										<div className="text-xs" style={{ color: theme.palette.text.secondary }}>By {project.author}</div>
									</div>
								</td>
								<td className="px-6 py-4">
									<span className="font-medium">{project.repoUrl}</span>
								</td>
								<td className="px-6 py-4">
									<div className="font-medium">
										{project.lastDeployment
											? (() => {
												try {
													// Try to parse as ISO, fallback to string if invalid
													const date = parseISO(project.lastDeployment);
													if (!isNaN(date.getTime())) {
														return formatDistanceToNow(date, { addSuffix: true });
													}
												} catch {
													// ignore
												}
												return project.lastDeployment;
											})()
											: 'N/A'}
									</div>
								</td>
								<td className="px-6 py-4">
									<StatusBadge status={project.status} />
								</td>
								<td className="px-6 py-4" style={{ position: 'relative' }}>
									<button className="p-2 rounded" style={{ background: 'none' }} onClick={e => { e.stopPropagation(); handleMenuOpen(project.id); }}>
										<span className="sr-only">Actions</span>
										<svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5" fill="#888" /><circle cx="10" cy="10" r="1.5" fill="#888" /><circle cx="10" cy="16" r="1.5" fill="#888" /></svg>
									</button>
									{openMenuId === project.id && (
										<div
											id="project-actions-menu"
											style={{ position: 'absolute', right: 0, top: '2.5rem', zIndex: 10, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 120 }}
										>
											<button
												onClick={() => setConfirmDeleteId(project.id)}
												style={{ color: theme.palette.error.main, padding: '0.5rem 1rem', width: '100%', textAlign: 'left', background: 'none', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 500 }}
												onMouseDown={e => e.preventDefault()}
											>
												Supprimer
											</button>
										</div>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<Dialog
				open={confirmDeleteId !== null}
				onClose={() => setConfirmDeleteId(null)}
			>
				<DialogTitle>Confirm Deletion</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Are you sure you want to permanently delete this project? This action cannot be undone.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmDeleteId(null)} color="primary">
						Cancel
					</Button>
					<Button onClick={() => confirmDeleteId !== null && handleDelete(confirmDeleteId)} color="error" variant="contained">
						Delete
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}
