'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Couleurs personnalisées
export const colors = {
  // Primary - Violet
  primary: {
    main: '#8b5cf6',
    light: '#a78bfa',
    dark: '#7c3aed',
    gradient: 'linear-gradient(135deg, #818cf8 0%, #a855f7 100%)',
    gradientHover: 'linear-gradient(135deg, #6366f1 0%, #9333ea 100%)',
  },
  // Secondary - Pink / Cyan Accent
  secondary: {
    main: '#ec4899',
    light: '#f472b6',
    dark: '#db2777',
    cyan: '#38bdf8',
  },
  // Text colors
  text: {
    dark: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b',
      disabled: 'rgba(248, 250, 252, 0.3)',
    },
    light: {
      primary: '#0f172a',
      secondary: '#475569',
      muted: '#94a3b8',
      disabled: 'rgba(15, 23, 42, 0.3)',
    },
  },
  // Background colors
  background: {
    dark: {
      default: '#0d0e12',
      paper: '#14151c',
      elevated: '#1b1d27',
      card: 'rgba(255, 255, 255, 0.03)',
      cardHover: 'rgba(255, 255, 255, 0.06)',
    },
    light: {
      default: '#f8fafc',
      paper: '#ffffff',
      elevated: '#f1f5f9',
      card: 'rgba(15, 23, 42, 0.02)',
      cardHover: 'rgba(15, 23, 42, 0.04)',
    },
  },
  // Border colors
  border: {
    dark: {
      default: 'rgba(255, 255, 255, 0.1)',
      light: 'rgba(255, 255, 255, 0.06)',
      hover: 'rgba(255, 255, 255, 0.2)',
      grid: '#7c3aed', // violet grid for dark mode
    },
    light: {
      default: 'rgba(15, 23, 42, 0.1)',
      light: 'rgba(15, 23, 42, 0.06)',
      hover: 'rgba(15, 23, 42, 0.2)',
      grid: 'rgba(124, 58, 237, 0.10)', // violet très pâle pour le light mode
    },
  },
  // Status colors
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#38bdf8',
  heroBackground: {
    dark: 'linear-gradient(180deg, #0d0e12 0%, #14151c 40%, #171226 60%, #0d0e12 100%)',
    light: 'linear-gradient(180deg, #f8fafc 0%, #f5f3ff 40%, #ede9fe 60%, #f8fafc 100%)',
  },
};

// Base theme options communes
const baseThemeOptions: ThemeOptions = {
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.03em',
    },
    h2: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontWeight: 600,
      letterSpacing: '-0.02em',
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
};

// Dark Theme
export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
    },
    background: {
      default: colors.background.dark.default,
      paper: colors.background.dark.paper,
    },
    text: {
      primary: colors.text.dark.primary,
      secondary: colors.text.dark.secondary,
      disabled: colors.text.dark.disabled,
    },
    success: {
      main: colors.success,
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    info: {
      main: colors.info,
    },
    divider: colors.border.dark.default,
  },
});

// Light Theme
export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      main: colors.primary.main,
      light: colors.primary.light,
      dark: colors.primary.dark,
    },
    secondary: {
      main: colors.secondary.main,
      light: colors.secondary.light,
      dark: colors.secondary.dark,
    },
    background: {
      default: colors.background.light.default,
      paper: colors.background.light.paper,
    },
    text: {
      primary: colors.text.light.primary,
      secondary: colors.text.light.secondary,
      disabled: colors.text.light.disabled,
    },
    success: {
      main: colors.success,
    },
    error: {
      main: colors.error,
    },
    warning: {
      main: colors.warning,
    },
    info: {
      main: colors.info,
    },
    divider: colors.border.light.default,
  },
});
