"use client";

import React, { useState, useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import { useTheme } from "@mui/material/styles";
import { usePathname, useRouter } from "next/navigation";
import GridViewIcon from "@mui/icons-material/GridView";
import FolderIcon from "@mui/icons-material/Folder";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import BuildIcon from "@mui/icons-material/Build";
import { useAuth } from "@/auth/AuthContext";
import { useDashboardData } from "@/components/dashboard/DashboardDataProvider";
import { useApi } from "@/hooks/useApi";

const menuItems = [
  { label: "Overview", icon: <GridViewIcon />, href: "/dashboard" },
  { label: "Projects", icon: <FolderIcon />, href: "/projects" },
  { label: "Preferences", icon: <SettingsIcon />, href: "/preferences" },
];


function SideMenu() {
  const theme = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuth();
  let projects: any[] = [];
  try {
    const dashboardData = useDashboardData();
    projects = dashboardData?.projects ?? [];
  } catch (err) {
    projects = [];
  }
  const { request } = useApi();
  const [localProjects, setLocalProjects] = React.useState<any[]>([]);

  React.useEffect(() => {
    let mounted = true;
    let fetchedAlready = false;

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
    if (!apiBaseUrl) return;

    const doFetch = async () => {
      // If dashboard already provides projects, don't fetch
      if (projects && projects.length > 0) return;
      if (fetchedAlready) return;
      fetchedAlready = true;

      try {
        const res = await request(`${apiBaseUrl}/project`);
        if (!res.ok) return;
        const data = await res.json();
        let fetched: any[] = [];
        if (Array.isArray(data)) fetched = data;
        else if (data && typeof data === 'object') fetched = Array.isArray((data as any).projects) ? (data as any).projects : [];
        if (mounted) setLocalProjects(fetched);
      } catch (e) {
        // ignore
      }
    };

    // Run once on mount only to avoid re-fetching when `request` identity changes
    doFetch();

    return () => { mounted = false; };
  }, []);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Extraire l'ID du projet à partir de l'URL
  const projectIdMatch = pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;
  const isProjectPath = Boolean(projectId);

  const [selectedProject, setSelectedProject] = React.useState<string | number | null>(null);
  React.useEffect(() => {
    setSelectedProject(projectId ?? null);
  }, [projectId]);

  // Vérifier si un lien est actif
  const isActiveLink = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/" || pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  // Obtenir les initiales de l'utilisateur
  const getInitials = (email?: string) => {
    if (!email) return "A";
    return email.charAt(0).toUpperCase();
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // Keep client-side logout behavior even if the API call fails.
    }

    clearAuth();
    router.replace("/auth/login");
  };

  const recentProjects = useMemo(() => {
    const source = (projects && projects.length > 0) ? projects : localProjects;
    if (!source || source.length === 0) return [];
    const sorted = [...source]
      .sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 3);

    if (!projectId) {
      return sorted;
    }

    const activeProject = source.find((project) => `${project.id ?? project.project_id}` === `${projectId}`);
    const activeAlreadyListed = sorted.some((project) => `${project.id ?? project.project_id}` === `${projectId}`);

    if (activeAlreadyListed) {
      return sorted;
    }

    const activeEntry = activeProject ?? {
      id: projectId,
      project_id: projectId,
      name: `Project ${projectId}`,
    };

    return [activeEntry, ...sorted.slice(0, 2)];
  }, [projects, localProjects, projectId]);


  return (
    <Box
      component="nav"
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        py: 4,
        px: 2,
        width: 256,
        borderRight: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        zIndex: 30,
      }}
    >
      <Box>
        {/* Logo */}
        <Box
          component={"a"}
          href="/dashboard"
          sx={{
            fontWeight: 700,
            color: `${theme.palette.text.primary}!important`,
            textDecoration: 'none',
            fontSize: '1.1rem',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 0.8,
            mb: 4,
            transition: 'color 0.2s',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #818cf8 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#fff',
              boxShadow: '0 2px 8px 0 rgba(129,140,248,0.10)',
              mr: 0.5,
              flexShrink: 0,
            }}
          >
            F
          </Box>
          <Typography
            variant="h5"
            fontWeight={700}
            sx={{
              color: theme.palette.mode === 'dark' ? theme.palette.text.primary : '#111',
              fontSize: '1.5rem',
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            Flotio
          </Typography>
        </Box>
        <List>
          {menuItems.map((item) => {
            const isActive = isActiveLink(item.href);
            return (
              <Box key={item.label}>
                <ListItem disablePadding sx={{ mb: 0.5, borderRadius: 1.5 }}>
                  <Button
                    href={item.href}
                    startIcon={item.icon}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                      background: isActive ? theme.palette.action.selected : 'transparent',
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: isActive ? 600 : 500,
                      px: 2,
                      py: 1.2,
                      '&:hover': {
                        background: theme.palette.action.hover,
                        color: theme.palette.primary.main,
                      },
                    }}
                  >
                    {item.label}
                  </Button>
                </ListItem>

                {/* Builds will be shown under the selected project in the recent list. */}
                {/* Derniers projets (5) */}
                {item.label === "Projects" && recentProjects.length > 0 && (
                  <Box sx={{ pl: 3, pr: 0, mt: 0.5 }}>
                    {recentProjects.map((proj) => {
                      const pid = proj.id ?? proj.project_id;
                      return (
                        <Box key={pid} sx={{ width: '100%' }}>
                          <ListItem disablePadding sx={{ mb: 0.25, borderRadius: 1.5 }}>
                            <Button
                              onClick={() => {
                                if (!pid) return;
                                setSelectedProject(pid);
                                router.push(`/projects/${pid}`);
                              }}
                              fullWidth
                              sx={{
                                justifyContent: 'flex-start',
                                color: selectedProject === `${pid}` || pathname === `/projects/${pid}` ? theme.palette.primary.main : theme.palette.text.primary,
                                background: selectedProject === `${pid}` || pathname === `/projects/${pid}` ? theme.palette.action.selected : 'transparent',
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontWeight: selectedProject === `${pid}` || pathname === `/projects/${pid}` ? 600 : 500,
                                fontSize: '0.95rem',
                                px: 2,
                                py: 0.6,
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                                textOverflow: 'ellipsis',
                                width: 'calc(100% + 24px)',
                                maxWidth: 'calc(100% + 24px)',
                                '&:hover': {
                                  background: theme.palette.action.hover,
                                  color: theme.palette.primary.main,
                                },
                              }}
                            >
                              {proj.name || `Project ${pid}`}
                            </Button>
                          </ListItem>

                          {selectedProject !== null && `${selectedProject}` === `${pid}` && (
                            <ListItem
                              disablePadding
                              sx={{
                                mb: 0.25,
                                borderRadius: 1.25,
                                ml: 3,
                                overflow: 'hidden',
                                '&:hover > button': {
                                  background: theme.palette.action.hover,
                                  color: theme.palette.primary.main,
                                },
                              }}
                            >
                              <Button
                                onClick={() => router.push(`/projects/${pid}/configuration`)}
                                startIcon={<SettingsIcon />}
                                fullWidth
                                sx={{
                                  justifyContent: 'flex-start',
                                  color: pathname.includes(`/projects/${pid}/configuration`) ? theme.palette.primary.main : theme.palette.text.primary,
                                  background: pathname.includes(`/projects/${pid}/configuration`) ? theme.palette.action.selected : 'transparent',
                                  borderRadius: 1.25,
                                  textTransform: 'none',
                                  fontWeight: pathname.includes(`/projects/${pid}/configuration`) ? 600 : 500,
                                  fontSize: '0.9rem',
                                  px: 2,
                                  py: 0.6,
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  width: 'calc(100% - 24px)',
                                  maxWidth: 'calc(100% - 24px)',
                                }}
                              >
                                Configuration
                              </Button>
                            </ListItem>
                          )}
                          {selectedProject !== null && `${selectedProject}` === `${pid}` && (
                            <ListItem
                              disablePadding
                              sx={{
                                mb: 0.25,
                                borderRadius: 1.25,
                                ml: 3,
                                overflow: 'hidden',
                                // apply hover styles to the container so the rounded background looks correct
                                '&:hover > button': {
                                  background: theme.palette.action.hover,
                                  color: theme.palette.primary.main,
                                },
                              }}
                            >
                              <Button
                                onClick={() => router.push(`/projects/${pid}/builds`)}
                                startIcon={<BuildIcon />}
                                fullWidth
                                sx={{
                                  justifyContent: 'flex-start',
                                  color: pathname.includes(`/projects/${pid}/builds`) ? theme.palette.primary.main : theme.palette.text.primary,
                                  background: pathname.includes(`/projects/${pid}/builds`) ? theme.palette.action.selected : 'transparent',
                                  borderRadius: 1.25,
                                  textTransform: 'none',
                                  fontWeight: pathname.includes(`/projects/${pid}/builds`) ? 600 : 500,
                                  fontSize: '0.9rem',
                                  px: 2,
                                  py: 0.6,
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                  width: 'calc(100% - 24px)',
                                  maxWidth: 'calc(100% - 24px)',
                                }}
                              >
                                Builds
                              </Button>
                            </ListItem>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            );
          })}
        </List>
      </Box>
      <Box>
        <Divider sx={{ my: 3 }} />
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{
              width: 36,
              height: 36,
              border: `2px solid ${theme.palette.primary.main}`,
              fontWeight: 700,
              fontSize: 20,
              bgcolor: theme.palette.primary.main,
              color: theme.palette.getContrastText(theme.palette.primary.main),
            }}
          >
            {mounted ? getInitials(user?.email) : ''}
          </Avatar>
          <Typography color={theme.palette.text.primary} fontWeight={500}>
            {mounted ? (user?.username || "Username") : ''}
          </Typography>
          <IconButton
            onClick={handleMenu}
            sx={{ ml: 'auto', color: theme.palette.text.secondary }}
            aria-label="Options"
          >
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            PaperProps={{
              sx: {
                minWidth: 140,
                borderRadius: 2,
                boxShadow: 3,
                background: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            <MenuItem onClick={handleLogout} sx={{ color: theme.palette.text.primary }}>
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
}

export default SideMenu;
