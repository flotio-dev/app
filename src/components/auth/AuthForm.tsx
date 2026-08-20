'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link as MuiLink,
  useTheme,
} from '@mui/material';
import { colors } from '@/theme';
import type { AuthMode } from '@/hooks/useAuthForm';

interface AuthFormProps {
  mode: AuthMode;
  loading: boolean;
  username?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  onEmailChange: (value: string) => void;
  onUsernameChange?: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange?: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  error: string | null;
}

const authCopy = {
  login: {
    title: 'Welcome back',
    subtitle: 'Sign in to access your dashboard',
    buttonText: 'Sign in',
    buttonLoadingText: 'Signing in...',
    linkText: "Don't have an account? ",
    linkLabel: 'Create one',
    linkHref: '/auth/register',
  },
  register: {
    title: 'Create account',
    subtitle: 'Start deploying your Flutter apps',
    buttonText: 'Create account',
    buttonLoadingText: 'Creating account...',
    linkText: 'Already have an account? ',
    linkLabel: 'Sign in',
    linkHref: '/auth/login',
  },
} as const;

export default function AuthForm({
  mode,
  loading,
  email,
  username,
  password,
  confirmPassword,
  onEmailChange,
  onUsernameChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  error,
}: AuthFormProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const config = authCopy[mode];

  const textFieldProps = {
    fullWidth: true,
    variant: 'outlined' as const,
    InputProps: {
      sx: {
        height: '50px',
        borderRadius: '12px',
        bgcolor: isDark
          ? colors.background.dark.paper
          : colors.background.light.paper,
        display: 'flex',
        alignItems: 'center',
        '& fieldset': {
          borderColor: theme.palette.divider,
        },
        '& input': {
          padding: 0,
          paddingLeft: '28px',
          paddingRight: '16px',
          color: theme.palette.text.primary,
          fontSize: '1rem',
          textAlign: 'left' as const,
          textIndent: '12px',
        },
      },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '16px',
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: isDark
          ? colors.background.dark.card
          : colors.background.light.card,
        backdropFilter: 'blur(12px)',
        width: '100%',
        maxWidth: '520px',
      }}
    >
      <form onSubmit={onSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, p: { xs: 3, sm: 5 } }}>
          <Box textAlign="center">
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                fontSize: { xs: '2rem', sm: '2.2rem' },
                mb: 1,
              }}
            >
              {config.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '0.95rem',
              }}
            >
              {config.subtitle}
            </Typography>
          </Box>

          <TextField
            {...textFieldProps}
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
          />

          {mode === 'register' && onUsernameChange && (
            <TextField
              {...textFieldProps}
              placeholder="Username"
              type="text"
              autoComplete="username"
              value={username || ''}
              onChange={(e) => onUsernameChange(e.target.value)}
            />
          )}

          <TextField
            {...textFieldProps}
            placeholder="Password"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />

          {mode === 'register' && (
            <TextField
              {...textFieldProps}
              placeholder="Confirm password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword || ''}
              onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
            />
          )}

          {error && (
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.error.main,
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              {error}
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading}
            sx={{
              borderRadius: '12px',
              py: 1.75,
              fontWeight: 600,
              fontSize: '1rem',
              background: colors.primary.gradient,
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(255, 87, 34, 0.3)',
              textTransform: 'none',
              '&:hover': {
                background: colors.primary.gradientHover,
                boxShadow: '0 6px 20px rgba(255, 87, 34, 0.45)',
              },
              '&:disabled': {
                opacity: 0.6,
              },
            }}
          >
            {loading ? config.buttonLoadingText : config.buttonText}
          </Button>

          <Typography
            variant="body2"
            textAlign="center"
            sx={{ color: theme.palette.text.secondary, fontSize: '0.9rem' }}
          >
            {config.linkText}
            <MuiLink
              component={Link}
              href={config.linkHref}
              sx={{
                fontWeight: 600,
                color: colors.primary.light,
                transition: 'all 0.3s ease',
                '&:hover': {
                  color: colors.primary.main,
                },
                textDecoration: 'none',
              }}
            >
              {config.linkLabel}
            </MuiLink>
          </Typography>
        </Box>
      </form>
    </Paper>
  );
}
