"use client";
import React, { useContext } from "react";
import { Paper, Box, Typography, Stack, Radio, useTheme } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import { ThemeModeContext } from "./ThemeModeProvider";

export default function ThemeSwitcher() {
  const theme = useTheme();
  const { mode, setMode } = useContext(ThemeModeContext) ;

  return (
    <>
      <Box sx={{ p: { xs: 0, md: 0 }, width: '100%', display: 'flex', justifyContent: 'center' }}>
        <Paper
          sx={{
            bgcolor: theme.palette.background.paper,
            border: `1.5px solid ${theme.palette.divider}`,
            borderRadius: '14px',
            px: { xs: 3, md: 6 },
            py: { xs: 2, md: 3 },
            boxShadow: '0 2px 16px 0 rgba(0,0,0,0.18)',
            width: '100%',
          }}
        >
          <Box sx={{ mt: '24px !important'}}>
            <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '1.18rem', mb: 0.5 }}>
              Theme & appearance
            </Typography>
            <Typography sx={{ color: theme.palette.text.secondary, fontSize: '1rem', mb: 3 }}>
              Choose between light and dark themes for the Flotio interface.
            </Typography>
          </Box>
          <Stack direction="row" sx={{ gap: '24px !important', px: '40px !important', my: '20px !important' }}>
            {/* Light mode card */}
            <Box
              onClick={() => setMode('light')}
              sx={{
                flex: 1,
                py: 4,
                px: 5,
                minHeight: 120,
                borderRadius: '14px',
                border: mode === 'light' ? `1px solid ${theme.palette.primary.light}` : '2px solid transparent',
                bgcolor: mode === 'light' ? theme.palette.background.default : theme.palette.background.paper,
                boxShadow: mode === 'light' ? `0 0 0 2px ${theme.palette.divider}` : 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                outline: mode === 'light' ? `2px solid ${theme.palette.primary.main}` : 'none',
                outlineOffset: mode === 'light' ? '0px' : '0px',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              <LightModeIcon sx={{ color: '#b3b3c6', mr: 1.5, fontSize: 28 }} />
              <Box>
                <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '1.05rem' }}>Light</Typography>
                <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.97rem' }}>
                  Light interface, suitable for bright environments.
                </Typography>
              </Box>
              <Radio
                checked={mode === 'light'}
                value="light"
                sx={{
                  ml: 'auto',
                  color: theme.palette.primary.main,
                  '&.Mui-checked': {
                    color: theme.palette.primary.main,
                  },
                }}
                onChange={() => setMode('light')}
              />
            </Box>
            {/* Dark mode card */}
            <Box
              onClick={() => setMode('dark')}
              sx={{
                flex: 1,
                py: 4,
                px: 5,
                minHeight: 120,
                borderRadius: '14px',
                border: mode === 'dark' ? `1px solid ${theme.palette.primary.light}` : '2px solid transparent',
                bgcolor: mode === 'dark' ? theme.palette.background.default : theme.palette.background.paper,
                boxShadow: mode === 'dark' ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                outline: mode === 'dark' ? `2px solid ${theme.palette.primary.main}` : 'none',
                outlineOffset: mode === 'dark' ? '0px' : '0px',
                transition: 'all 0.2s',
                position: 'relative',
              }}
            >
              <DarkModeIcon sx={{ color: '#a78bfa', mr: 1.5, fontSize: 28 }} />
              <Box>
                <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '1.05rem' }}>Dark</Typography>
                <Typography sx={{ color: theme.palette.text.secondary, fontSize: '0.97rem' }}>
                  Dark interface with purple accents (recommended).
                </Typography>
              </Box>
              <Radio
                checked={mode === 'dark'}
                value="dark"
                sx={{
                  ml: 'auto',
                  color: theme.palette.primary.main,
                  '&.Mui-checked': {
                    color: theme.palette.primary.main,
                  },
                }}
                onChange={() => setMode('dark')}
              />
            </Box>
          </Stack>
          <Box sx={{ borderTop: `1.5px solid ${theme.palette.divider}` }}>
            <Box sx={{ my: '20px !important'}}>
              <Typography sx={{ color: theme.palette.text.primary, fontWeight: 600, fontSize: '1.18rem', mb: 0.5 }}>
                Theme description
              </Typography>
              <Typography sx={{ color: theme.palette.text.secondary, fontSize: '1rem', mb: 3 }}>
                {mode === 'dark'
                  ? "The dark theme is designed to reduce eye strain in low-light environments."
                  : "The light theme is ideal for use in bright environments."}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
      <Box sx={{ height: '48px' }} />
    </>
  );
}