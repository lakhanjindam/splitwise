import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Login | SplitEase',
  description: 'Login to your SplitEase account',
};

export default function LoginPage() {
  return <LoginForm />;
}
