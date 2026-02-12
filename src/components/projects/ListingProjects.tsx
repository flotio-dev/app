"use client";
import { useTheme } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
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

function StatusBadge({ status, color }: { status: string; color: string }) {
	return (
		<span style={{ background: color, color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
			{status}
		</span>
	);
}

export default function ListingProjects({ search }: ListingProjectsProps) {
	const theme = useTheme();
	const router = useRouter();
	const [openMenuId, setOpenMenuId] = useState<number | null>(null);
	// Close menu on outside click
	useEffect(() => {
		if (openMenuId === null) return;
		const handleClick = (e: MouseEvent) => {
			// Only close if click is outside any menu
			const menu = document.getElementById('project-actions-menu');
			if (menu && !menu.contains(e.target as Node)) {
				setOpenMenuId(null);
			}
		};
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [openMenuId]);
	const [projects, setProjects] = useState<any[]>([]);
	const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
	const { request } = useApi();

	useEffect(() => {
		const fetchProjects = async () => {
			try {
				const res = await request(`${process.env.NEXT_PUBLIC_API_URL}/project`, {
					method: 'GET',
					headers: { 'Content-Type': 'application/json' },
				});
				if (!res.ok) throw new Error('Failed to fetch projects');
				const data = await res.json();
				// Map API response to UI format if needed
				setProjects(
					(data.projects || []).map((p: any) => ({
						id: p.id,
						name: p.name,
						repoUrl: p.git_repo,
						branch: p.git_username || '',
						status: 'Healthy', // Default, adapt if you have a status field
						statusKey: 'success', // Default, adapt if you have a status field
						icon: p.name ? p.name[0].toUpperCase() : '?',
						lastDeployment: p.updated_at || '',
						author: p.git_username || '',
					}))
				);
			} catch (e) {
				setProjects([]);
			}
		};
		fetchProjects();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);
	const statusColors: Record<string, string> = {
		success: theme.palette.success.main,
		error: theme.palette.error.main,
		warning: theme.palette.warning.main,
		info: theme.palette.info.main,
	};
	const [statusFilter, setStatusFilter] = useState<string>("");
	const [branchFilter, setBranchFilter] = useState<string>("");
	const [statusAnchorEl, setStatusAnchorEl] = useState<null | HTMLElement>(null);
	const [branchAnchorEl, setBranchAnchorEl] = useState<null | HTMLElement>(null);
	const openStatusMenu = Boolean(statusAnchorEl);
	const openBranchMenu = Boolean(branchAnchorEl);

	// Récupérer toutes les valeurs uniques de status et de branch
	const allStatuses = Array.from(new Set(projects.map(p => p.status)));
	const allBranches = Array.from(new Set(projects.map(p => p.branch)));

	const filteredProjects = projects.filter(p => {
		const matchesSearch =
			p.name.toLowerCase().includes(search.toLowerCase()) ||
			p.repoUrl.toLowerCase().includes(search.toLowerCase()) ||
			p.author.toLowerCase().includes(search.toLowerCase());
		const matchesStatus = statusFilter ? p.status === statusFilter : true;
		const matchesBranch = branchFilter ? p.branch === branchFilter : true;
		return matchesSearch && matchesStatus && matchesBranch;
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
		} catch (e) {
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
							<th className="px-6 py-4 font-semibold tracking-wider">LAST DEPLOYMENT</th>
							<th className="px-6 py-4 font-semibold tracking-wider">
								<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
									<span>BRANCH</span>
									<Button
										variant="text"
										size="small"
										sx={{ minWidth: 0, p: 0, fontSize: '0.85em', textTransform: 'none' }}
										onClick={e => setBranchAnchorEl(e.currentTarget)}
									>
										{branchFilter ? branchFilter : 'All'}
									</Button>
									<Menu
										anchorEl={branchAnchorEl}
										open={openBranchMenu}
										onClose={() => setBranchAnchorEl(null)}
									>
										<MenuItem
											selected={branchFilter === ""}
											onClick={() => { setBranchFilter(""); setBranchAnchorEl(null); }}
										>
											All Branches
										</MenuItem>
										{allBranches.map(branch => (
											<MenuItem
												key={branch}
												selected={branchFilter === branch}
												onClick={() => { setBranchFilter(branch); setBranchAnchorEl(null); }}
											>
												{branch}
											</MenuItem>
										))}
									</Menu>
								</div>
							</th>
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
												{status}
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
										<div className="text-xs" style={{ color: theme.palette.text.secondary }}>{project.repoUrl}</div>
									</div>
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
									<div className="text-xs" style={{ color: theme.palette.text.secondary }}>By {project.author}</div>
								</td>
								<td className="px-6 py-4">
									<span className="font-medium">{project.branch}</span>
								</td>
								<td className="px-6 py-4">
									<StatusBadge status={project.status} color={statusColors[project.statusKey] || theme.palette.info.main} />
								</td>
								<td className="px-6 py-4" style={{ position: 'relative' }}>
									<button className="p-2 rounded" style={{ background: 'none' }} onClick={e => { e.stopPropagation(); handleMenuOpen(project.id); }}>
										<span className="sr-only">Actions</span>
										<svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5" fill="#888"/><circle cx="10" cy="10" r="1.5" fill="#888"/><circle cx="10" cy="16" r="1.5" fill="#888"/></svg>
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
