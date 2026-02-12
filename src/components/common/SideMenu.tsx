"use client";

import React, { useState } from "react";
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
import GridViewIcon from "@mui/icons-material/GridView";
import FolderIcon from "@mui/icons-material/Folder";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/auth/AuthContext";

const menuItems = [
  { label: "Overview", icon: <GridViewIcon />, href: "/dashboard" },
  { label: "Projects", icon: <FolderIcon />, href: "/projects" },
  { label: "Deployments", icon: <ShowChartIcon />, href: "/deployments" },
  { label: "Team", icon: <GroupIcon />, href: "/team" },
  { label: "Preferences", icon: <SettingsIcon />, href: "/preferences" },
];


function SideMenu() {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const { user } = useAuth();

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    alert("Déconnexion !");
    handleClose();
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
        <List sx={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
          {menuItems.map((item) => (
            <ListItem
              key={item.label}
              disablePadding
              sx={{ mb: 0.5, borderRadius: 2 }}
            >
              <Button
                href={item.href}
                startIcon={item.icon}
                fullWidth
                sx={{
                  justifyContent: 'flex-start',
                  color: theme.palette.text.primary,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500,
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
          ))}
        </List>
      </Box>
      <Box>
        <Divider sx={{ my: 3 }} />
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar
            sx={{ width: 36, height: 36, border: `2px solid ${theme.palette.primary.main}`, fontWeight: 700, fontSize: 20, bgcolor: theme.palette.primary.main, color: theme.palette.getContrastText(theme.palette.primary.main) }}
          >
            A
          </Avatar>
          <Typography color={theme.palette.text.primary} fontWeight={500}>
            {user?.email || "Utilisateur"}
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
              Se déconnecter
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </Box>
  );
}

export default SideMenu;
