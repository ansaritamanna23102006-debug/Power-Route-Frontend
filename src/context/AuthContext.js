'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getApiBaseUrl } from '../services/apiClient';
import { getToken, getRefreshToken, setToken, clearToken, initializeToken } from '../services/tokenStorage';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = useCallback(async () => {
    initializeToken();

    const accessToken = getToken();
    const refreshToken = getRefreshToken();

    if (!accessToken && !refreshToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (accessToken) {
      try {
        const res = await api('/auth/me');
        setUser(res.data?.user ?? null);
        setLoading(false);
        return;
      } catch {
        // Fall through
      }
    }

    if (refreshToken) {
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/auth/refresh-token`, {
          method: 'POST',
          headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.data?.accessToken) {
          setToken(json.data.accessToken, json.data.refreshToken || refreshToken);
          try {
            const meRes = await api('/auth/me');
            setUser(meRes.data?.user ?? null);
            setLoading(false);
            return;
          } catch {
            // me request failed
          }
        }
      } catch {
        // Refresh failed
      }
    }

    clearToken();
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const storeTokens = useCallback((res) => {
    const accessToken = res.token || res.data?.accessToken;
    const refreshToken = res.data?.refreshToken;
    setToken(accessToken, refreshToken);
  }, []);

  const signup = useCallback(async (name, email, phone, password) => {
    await api('/auth/signup', {
      method: 'POST',
      body: { name, email, phone, password },
      auth: false,
    });
  }, []);

  const verifyEmail = useCallback(async (email, otp) => {
    const res = await api('/auth/verify-email', {
      method: 'POST',
      body: { email, otp },
      auth: false,
    });
    storeTokens(res);
    setUser(res.data?.user ?? null);
  }, [storeTokens]);

  const resendOtp = useCallback(async (email) => {
    await api('/auth/resend-otp', { method: 'POST', body: { email }, auth: false });
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    storeTokens(res);
    setUser(res.data?.user ?? null);
  }, [storeTokens]);

  const socialLogin = useCallback(async (email, name, id, provider) => {
    const res = await api('/auth/social-login', {
      method: 'POST',
      body: { email, name, id, provider },
      auth: false,
    });
    storeTokens(res);
    setUser(res.data?.user ?? null);
  }, [storeTokens]);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      signup,
      verifyEmail,
      resendOtp,
      logout,
      socialLogin,
      isAuthenticated: Boolean(user),
      refreshUser: bootstrap,
    }),
    [user, loading, login, signup, verifyEmail, resendOtp, logout, socialLogin, bootstrap]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
