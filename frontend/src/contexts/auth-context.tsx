'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api-client';
import type { User } from '@/types/schema';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// List of paths that don't require authentication
const publicPaths = ['/auth/login', '/auth/register', '/'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      const response = await api.getCurrentUser();
      if (response.data?.status === 'success' && response.data?.data?.user) {
        setUser(response.data.data.user);
        // If user is authenticated and on an auth route, redirect to dashboard
        if (pathname && ['/auth/login', '/auth/register'].includes(pathname)) {
          router.replace('/dashboard');
        }
      } else {
        setUser(null);
        // If user is not authenticated and not on a public path, redirect to login
        if (pathname && !publicPaths.includes(pathname)) {
          router.replace('/auth/login');
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      if (pathname && !publicPaths.includes(pathname)) {
        router.replace('/auth/login');
      }
    } finally {
      // Add a small delay before removing loading state to prevent flashing
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login(username, password);
      if (response.data?.status === 'success' && response.data?.data?.user) {
        setUser(response.data.data.user);
        router.replace('/dashboard');
      } else {
        throw new Error(response.data?.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
      setUser(null);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
