'use client';

import { LoginForm } from '@/components/auth/login-form';
import { LoadingSpinner } from '@/components/ui/loading';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <LoginForm />;
}
