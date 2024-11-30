'use client';

import { RegisterForm } from '@/components/auth/register-form';
import { LoadingSpinner } from '@/components/ui/loading';
import { useAuth } from '@/contexts/auth-context';

export default function RegisterPage() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return <RegisterForm />;
}
