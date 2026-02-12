"use client";

import React, { useState, useEffect } from "react";
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
import { usePathname } from "next/navigation";
import GridViewIcon from "@mui/icons-material/GridView";
import FolderIcon from "@mui/icons-material/Folder";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import BuildIcon from "@mui/icons-material/Build";
import { useAuth } from "@/auth/AuthContext";
import { useApi } from '@/hooks/useApi';

const menuItems = [
  { label: "Overview", icon: <GridViewIcon />, href: "/dashboard" },
  { label: "Projects", icon: <FolderIcon />, href: "/projects" },
  { label: "Preferences", icon: <SettingsIcon />, href: "/preferences" },
];


function SideMenu() {
  const theme = useTheme();
  const pathname = usePathname();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { request } = useApi();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Extraire l'ID du projet à partir de l'URL
  const projectIdMatch = pathname.match(/\/projects\/([^/]+)/);
  const projectId = projectIdMatch ? projectIdMatch[1] : null;
  const isProjectPath = Boolean(projectId);

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
                <ListItem disablePadding sx={{ mb: 0.5, borderRadius: 2 }}>
                  <Button
                    href={item.href}
                    startIcon={item.icon}
                    fullWidth
                    sx={{
                      justifyContent: 'flex-start',
                      color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                      background: isActive ? theme.palette.action.selected : 'transparent',
                      borderRadius: 2,
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

                {/* Sous-menu Builds pour Projects */}
                {item.label === "Projects" && isProjectPath && (
                  <ListItem
                    disablePadding
                    sx={{
                      mb: 0.5,
                      borderRadius: 2,
                      ml: 3,
                      overflow: 'hidden',
                      maxWidth: 'calc(100% - 24px)', // pour éviter de dépasser le menu
                    }}
                  >
                    <Button
                      href={`/projects/${projectId}/builds`}
                      startIcon={<BuildIcon />}
                      fullWidth
                      sx={{
                        justifyContent: 'flex-start',
                        color: pathname.includes('/builds')
                          ? theme.palette.primary.main
                          : theme.palette.text.primary,
                        background: pathname.includes('/builds')
                          ? theme.palette.action.selected
                          : 'transparent',
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: pathname.includes('/builds') ? 600 : 500,
                        fontSize: '0.95rem',
                        px: 2,
                        py: 1,
                        maxWidth: '100%',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                        '&:hover': {
                          background: theme.palette.action.hover,
                          color: theme.palette.primary.main,
                        },
                      }}
                    >
                      Builds
                    </Button>
                  </ListItem>
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
            <MenuItem onClick={() => { }} sx={{ color: theme.palette.text.primary }}>
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
