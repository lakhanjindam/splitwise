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

  useEffect(() => {
    let ignore = false;

    const checkAuth = async () => {
      try {
        // Skip auth check for public paths
        if (publicPaths.includes(pathname)) {
          setIsLoading(false);
          return;
        }

        const response = await api.getCurrentUser();
        if (!ignore) {
          if (response.data?.data) {
            setUser(response.data.data);
          } else {
            setUser(null);
            if (!publicPaths.includes(pathname)) {
              router.push('/auth/login');
            }
          }
        }
      } catch (error) {
        if (!ignore) {
          console.error('Auth check failed:', error);
          setUser(null);
          if (!publicPaths.includes(pathname)) {
            router.push('/auth/login');
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      ignore = true;
    };
  }, [pathname, router]);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.login(username, password);
      if (response.data?.data) {
        setUser(response.data.data);
        router.push('/dashboard');
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await api.logout();
      setUser(null);
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
