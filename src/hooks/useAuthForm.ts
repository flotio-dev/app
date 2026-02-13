import { useState, type FormEvent } from 'react';

export interface AuthFormFields {
  email: string;
  username?: string;
  password: string;
  confirmPassword?: string;
}

export type AuthMode = 'login' | 'register';

export const useAuthForm = (mode: AuthMode) => {
  const [formData, setFormData] = useState<AuthFormFields>({
    email: '',
    username: '',
    password: '',
    ...(mode === 'register' && { confirmPassword: '' }),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof AuthFormFields, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (
    e: FormEvent,
    onSubmit: (data: AuthFormFields) => Promise<void>
  ) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    loading,
    handleChange,
    handleSubmit,
    error,
  };
};
