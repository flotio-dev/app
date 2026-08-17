'use client';

import { Box, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import { useRouter } from 'next/navigation';
import { useAuthForm } from '@/hooks/useAuthForm';
import { AuthForm } from '@/components/auth';
import { useAuth } from '@/auth/AuthContext';
import { useApi, persistSession, userFromResponse } from '@/hooks/useApi';

export default function LoginPage() {
  const theme = useTheme();
  const router = useRouter();
  const { setUserAndToken } = useAuth();
  const { client } = useApi();
  const { formData, loading, handleChange, handleSubmit, error } = useAuthForm('login');
  const websiteUrl = process.env.NEXT_PUBLIC_WEBSITE_URL?.replace(/\/$/, '') || '/';

  const login = async (email: string, password: string) => {
    const data = await client.auth.login(email, password);

    if (!data.access_token) {
      throw new Error('Missing access token');
    }
    if (!data.refresh_token) {
      throw new Error('Missing refresh token');
    }

    await persistSession(data.refresh_token);

    const me = await client.auth.getMe();

    setUserAndToken(userFromResponse(me), data.access_token);

    router.push('/dashboard');
  };

  return (
    <Box
      sx={{
        bgcolor: theme.palette.background.default,
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Button
        href={websiteUrl}
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 2,
          color: theme.palette.text.secondary,
          textTransform: 'none',
        }}
      >
        Back to website
      </Button>
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `
            linear-gradient(${theme.palette.divider} 1px, transparent 1px),
            linear-gradient(90deg, ${theme.palette.divider} 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
          opacity: 0.25,
          maskImage: 'radial-gradient(ellipse 60% 40% at 50% 20%, black 30%, transparent 100%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'fixed',
          top: '-30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '140%',
          height: '60%',
          background: `radial-gradient(ellipse at center, ${theme.palette.primary.light}26 0%, transparent 60%)`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
          px: 2,
          minHeight: '100vh',
          py: { xs: 4, md: 6 },
        }}
      >
        <AuthForm
          mode="login"
          loading={loading}
          email={formData.email}
          password={formData.password}
          onEmailChange={(value) => handleChange('email', value)}
          onPasswordChange={(value) => handleChange('password', value)}
          onSubmit={(e) =>
            handleSubmit(e, async (submitted) => login(submitted.email, submitted.password))
          }
          error={error}
        />
      </Box>
    </Box>
  );
}
