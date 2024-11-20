import { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Register | SplitEase',
  description: 'Create your SplitEase account',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
