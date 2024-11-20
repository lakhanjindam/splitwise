'use client'

import { ReactNode } from 'react';
import { Logo } from '@/components/ui/logo';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Left side - Auth form */}
      <div className="flex w-full flex-col justify-center lg:w-1/2">
        <div className="mx-auto w-full max-w-md">
          <div className="flex justify-center mb-8">
            <Logo />
          </div>
          {children}
        </div>
      </div>

      {/* Right side - Gradient background */}
      <div className="hidden lg:block lg:w-1/2">
        <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/30 to-primary/20">
          <div className="flex h-full items-center justify-center">
            <div className="max-w-2xl px-8 text-center">
              <h1 className="text-4xl font-bold text-primary">Split expenses with friends</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Share bills, track balances, and make life easier with SplitEase
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
