'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Brand Flame & Coral Theme Colors (matching official Flotio Logo)
export const colors = {
  // Primary - Vibrant Flame Coral to Crimson
  primary: {
    main: '#ff5722',
    light: '#ff7a50',
    dark: '#e64a19',
    gradient: 'linear-gradient(135deg, #ff6b4a 0%, #ff5722 50%, #e11d48 100%)',
    gradientHover: 'linear-gradient(135deg, #ff7d5e 0%, #f4511e 50%, #be123c 100%)',
  },
  // Secondary - Rose / Crimson Accent
  secondary: {
    main: '#e11d48',
    light: '#f43f5e',
    dark: '#be123c',
    cyan: '#ff7043',
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
      primary: '#1c1917',
      secondary: '#57534e',
      muted: '#8c827a',
      disabled: 'rgba(28, 25, 23, 0.3)',
    },
  },
  // Background colors
  background: {
    dark: {
      default: '#080a0f',
      paper: '#0f1219',
      elevated: '#151923',
      card: 'rgba(255, 255, 255, 0.03)',
      cardHover: 'rgba(255, 255, 255, 0.06)',
    },
    light: {
      default: '#faf8f5',
      paper: '#ffffff',
      elevated: '#f4f0e8',
      card: '#ffffff',
      cardHover: '#f5f1ea',
    },
  },
  // Border colors
  border: {
    dark: {
      default: 'rgba(255, 255, 255, 0.1)',
      light: 'rgba(255, 255, 255, 0.06)',
      hover: 'rgba(255, 255, 255, 0.2)',
      grid: 'rgba(255, 87, 34, 0.08)',
    },
    light: {
      default: 'rgba(44, 34, 24, 0.10)',
      light: 'rgba(44, 34, 24, 0.06)',
      hover: 'rgba(44, 34, 24, 0.18)',
      grid: 'rgba(255, 87, 34, 0.06)',
    },
  },
  // Status colors
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
  info: '#38bdf8',
  heroBackground: {
    dark: 'linear-gradient(180deg, #080a0f 0%, #0f1219 40%, #171115 60%, #080a0f 100%)',
    light: 'linear-gradient(180deg, #faf8f5 0%, #fff7ed 40%, #ffedd5 60%, #faf8f5 100%)',
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
    text: {
      primary: colors.text.dark.primary,
      secondary: colors.text.dark.secondary,
      disabled: colors.text.dark.disabled,
    },
    background: {
      default: colors.background.dark.default,
      paper: colors.background.dark.paper,
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
    text: {
      primary: colors.text.light.primary,
      secondary: colors.text.light.secondary,
      disabled: colors.text.light.disabled,
    },
    background: {
      default: colors.background.light.default,
      paper: colors.background.light.paper,
    },
    divider: colors.border.light.default,
  },
});
