"use client";
import { useTheme } from '@mui/material/styles';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import Button from '@mui/material/Button';
const mockProjects = [
	{
		id: 1,
		name: 'marketing-dashboard',
		repoUrl: 'github.com/veloce/marketing-dashboard',
		lastDeployment: '5 min ago',
		author: 'Alex Chen',
		branch: 'main',
		status: 'Healthy',
		statusKey: 'success',
		icon: 'M',
	},
	{
		id: 2,
		name: 'website-main',
		repoUrl: 'gitlab.com/company/website',
		lastDeployment: '23 min ago',
		author: 'Marie Dubois',
		branch: 'production',
		status: 'Building',
		statusKey: 'warning',
		icon: 'W',
	},
	{
		id: 3,
		name: 'admin-backoffice',
		repoUrl: 'self-hosted-git/infra/admin',
		lastDeployment: '1 h ago',
		author: 'CI Bot',
		branch: 'develop',
		status: 'Failed',
		statusKey: 'error',
		icon: 'A',
	},
	{
		id: 4,
		name: 'landing-page',
		repoUrl: 'github.com/veloce/landing',
		lastDeployment: 'Yesterday',
		author: 'Alex Chen',
		branch: 'main',
		status: 'Healthy',
		statusKey: 'success',
		icon: 'L',
	},
	{
		id: 5,
		name: 'analytics-service',
		repoUrl: 'gitlab.company.local/analytics',
		lastDeployment: '2 days ago',
		author: 'CI Bot',
		branch: 'main',
		status: 'Paused',
		statusKey: 'info',
		icon: 'A',
	},
	{
		id: 6,
		name: 'experiments-app',
		repoUrl: 'github.com/veloce/experiments',
		lastDeployment: '3 days ago',
		author: 'Alex Chen',
		branch: 'feature/ab-tests',
		status: 'Healthy',
		statusKey: 'success',
		icon: 'E',
	},
];



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
	const [projects, setProjects] = useState(mockProjects);
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
	const handleMenuClose = () => {
		setOpenMenuId(null);
	};
	const handleDelete = (id: number) => {
		setProjects(projects.filter(p => p.id !== id));
		setOpenMenuId(null);
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
									<div className="font-medium">{project.lastDeployment}</div>
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
										<div style={{ position: 'absolute', right: 0, top: '2.5rem', zIndex: 10, background: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', minWidth: 120 }}>
											<button
												onClick={() => handleDelete(project.id)}
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
		</div>
	);
}
