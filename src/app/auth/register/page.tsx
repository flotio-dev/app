'use client';

import { Box, useTheme } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuthForm } from '@/hooks/useAuthForm';
import { AuthForm } from '@/components/auth';
import { useAuth } from '@/auth/AuthContext';

interface AuthResponse {
  access_token?: string;
}

interface CurrentUser {
  id: string | number;
  email: string;
  username: string;
}

export default function RegisterPage() {
  const theme = useTheme();
  const router = useRouter();
  const { setUserAndToken } = useAuth();
  const { formData, loading, handleChange, handleSubmit, error } = useAuthForm('register');

  const register = async (data: { email: string; username: string; password: string }) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      throw new Error('Register failed');
    }

    const authData = (await res.json()) as AuthResponse;
    if (!authData.access_token) {
      throw new Error('Missing access token');
    }

    const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/@me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${authData.access_token}` },
    });

    if (!meRes.ok) {
      throw new Error('Unable to load profile');
    }

    const me = (await meRes.json()) as CurrentUser;

    setUserAndToken(
      {
        id: String(me.id),
        email: me.email,
        username: me.username,
      },
      authData.access_token
    );

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
          mode="register"
          loading={loading}
          email={formData.email}
          username={formData.username}
          password={formData.password}
          confirmPassword={formData.confirmPassword}
          onEmailChange={(value) => handleChange('email', value)}
          onUsernameChange={(value) => handleChange('username', value)}
          onPasswordChange={(value) => handleChange('password', value)}
          onConfirmPasswordChange={(value) => handleChange('confirmPassword', value)}
          onSubmit={(e) =>
            handleSubmit(e, async (submitted) =>
              register({
                email: submitted.email,
                username: submitted.username ?? '',
                password: submitted.password,
              })
            )
          }
          error={error}
        />
      </Box>
    </Box>
  );
}
