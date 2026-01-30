"use client";
import { useTheme } from '@mui/material/styles';
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

function StatusBadge({ status, color }: { status: string; color: string }) {
	return (
		<span style={{ background: color, color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 600 }}>
			{status}
		</span>
	);
}

export default function ListingProjects() {
	const theme = useTheme();
	const statusColors: Record<string, string> = {
		success: theme.palette.success.main,
		error: theme.palette.error.main,
		warning: theme.palette.warning.main,
		info: theme.palette.info.main,
	};
	return (
		<div className="w-full max-w-5xl mx-auto mt-6">
			<div style={{ color: theme.palette.text.secondary }} className="text-sm mb-4">Showing {mockProjects.length} projects</div>
			<div style={{ background: theme.palette.background.paper }} className="overflow-x-auto rounded-lg">
				<table className="min-w-full text-left text-sm" style={{ color: theme.palette.text.primary }}>
					<thead>
						<tr style={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
							<th className="px-6 py-4 font-semibold tracking-wider">PROJECT</th>
							<th className="px-6 py-4 font-semibold tracking-wider">LAST DEPLOYMENT</th>
							<th className="px-6 py-4 font-semibold tracking-wider">BRANCH</th>
							<th className="px-6 py-4 font-semibold tracking-wider">STATUS</th>
							<th className="px-6 py-4 font-semibold tracking-wider">ACTIONS</th>
						</tr>
					</thead>
					<tbody>
						{mockProjects.map((project) => (
							<tr key={project.id} style={{ borderBottom: `1px solid ${theme.palette.divider}` }} className="hover:bg-opacity-70 transition" onMouseOver={e => (e.currentTarget.style.background = theme.palette.action.hover)} onMouseOut={e => (e.currentTarget.style.background = 'transparent')}>
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
								<td className="px-6 py-4">
									<button className="p-2 rounded" style={{ background: 'none' }}>
										<span className="sr-only">Actions</span>
										<svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="4" r="1.5" fill="#888"/><circle cx="10" cy="10" r="1.5" fill="#888"/><circle cx="10" cy="16" r="1.5" fill="#888"/></svg>
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
