'use client';

import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';
import { Toaster } from '@/components/ui/toaster';

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider {...props}>
      {children}
      <Toaster />
    </NextThemeProvider>
  );
}
