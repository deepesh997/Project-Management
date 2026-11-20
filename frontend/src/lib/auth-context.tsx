'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Hydrate session from localStorage
    try {
      const storedToken = localStorage.getItem('ws_token');
      const storedUser = localStorage.getItem('ws_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Default seed fallback for seamless preview if not logged in
        const defaultOwner: User = {
          id: 'usr-owner-1',
          email: 'owner@acme.com',
          fullName: 'Elena Vance',
          role: 'org_owner',
          orgId: 'org-acme-101',
        };
        setUser(defaultOwner);
        setToken('mock-session-token');
        localStorage.setItem('ws_user', JSON.stringify(defaultOwner));
        localStorage.setItem('ws_token', 'mock-session-token');
      }
    } catch {
      // Ignore storage errors
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string = 'Password123!') => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errData.error?.message || 'Invalid email or password',
        };
      }

      const data = await res.json();
      const authenticatedUser: User = {
        id: data.user.id,
        email: data.user.email,
        fullName: data.user.fullName,
        role: data.user.role,
        orgId: data.user.orgId || 'org-acme-101',
      };

      setToken(data.accessToken);
      setUser(authenticatedUser);

      localStorage.setItem('ws_token', data.accessToken);
      localStorage.setItem('ws_refresh_token', data.refreshToken);
      localStorage.setItem('ws_user', JSON.stringify(authenticatedUser));
      localStorage.setItem('ws_tenant', authenticatedUser.orgId);

      router.push('/');
      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: 'Unable to connect to backend API server on port 4000',
      };
    }
  };

  const logout = async () => {
    try {
      const currentToken = token || localStorage.getItem('ws_token');
      if (currentToken && !currentToken.startsWith('mock-')) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${currentToken}`,
          },
        }).catch(() => {});
      }
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('ws_token');
      localStorage.removeItem('ws_refresh_token');
      localStorage.removeItem('ws_user');
      router.push('/login');
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'platform_admin') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
