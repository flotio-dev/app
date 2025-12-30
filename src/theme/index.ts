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
  // Secondary - Pink
  secondary: {
    main: '#ec4899',
    light: '#f472b6',
    dark: '#db2777',
  },
  // Text colors
  text: {
    dark: {
      primary: '#fafafa',
      secondary: 'rgba(255, 255, 255, 0.7)',
      muted: 'rgba(255, 255, 255, 0.5)',
      disabled: 'rgba(255, 255, 255, 0.3)',
    },
    light: {
      primary: '#09090b',
      secondary: 'rgba(9, 9, 11, 0.7)',
      muted: 'rgba(9, 9, 11, 0.5)',
      disabled: 'rgba(9, 9, 11, 0.3)',
    },
  },
  // Background colors
  background: {
    dark: {
      default: '#181920',
      paper: '#1f2027',
      elevated: '#150d24',
      card: 'rgba(255, 255, 255, 0.02)',
      cardHover: 'rgba(255, 255, 255, 0.04)',
    },
    light: {
      default: '#fafafa',
      paper: '#ffffff',
      elevated: '#f5f5f5',
      card: 'rgba(0, 0, 0, 0.02)',
      cardHover: 'rgba(0, 0, 0, 0.04)',
    },
  },
  // Border colors
  border: {
    dark: {
      default: 'rgba(255, 255, 255, 0.1)',
      light: 'rgba(255, 255, 255, 0.06)',
      hover: 'rgba(255, 255, 255, 0.15)',
      grid: '#7c3aed', // violet grid for dark mode
    },
    light: {
      default: 'rgba(0, 0, 0, 0.1)',
      light: 'rgba(0, 0, 0, 0.06)',
      hover: 'rgba(0, 0, 0, 0.15)',
      grid: 'rgba(124, 58, 237, 0.10)', // violet très pâle pour le light mode
    },
  },
  // Status colors
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
  heroBackground: {
    dark: 'linear-gradient(180deg, #181920 0%, #1f2027 40%, #150d24 60%, #181920 100%)',
    light: 'linear-gradient(180deg, #fafafa 0%, #f8e6ff 40%, #f3e8ff 60%, #fafafa 100%)',
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
