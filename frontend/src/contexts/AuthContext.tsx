'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { authApi } from '@/lib/api';
import { User, AuthMethod, AuthContextType } from '@/types';

const AuthContext = createContext<AuthContextType | null>(null);

// ─────────────────────────────────────────────────────────────────
// Token helpers (localStorage)
// ─────────────────────────────────────────────────────────────────
const TOKEN_KEY = 'accessToken';
const USER_KEY  = 'authUser';

function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getSavedToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function getSavedUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser]             = useState<User | null>(null);
  const [token, setToken]           = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<AuthMethod | null>(null);
  const [isLoading, setIsLoading]   = useState(true);

  // ── Bootstrap: restore session on mount ────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // 1. Try to restore a custom-auth session from localStorage
        const savedToken = getSavedToken();
        const savedUser  = getSavedUser();

        if (savedToken && savedUser && savedUser.authMethod === 'CUSTOM') {
          console.log('AUTH - Restored custom session');
          setToken(savedToken);
          setUser(savedUser);
          setAuthMethod('CUSTOM');
          setIsLoading(false);
          return;
        }

        // 2. Try to restore a Supabase session
        // getSession() checks the local storage for an existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('AUTH - Found Supabase session, syncing...');
          await handleSupabaseSession(session.access_token);
        }
      } catch (err: any) {
        console.error('AUTH - Session restoration failed:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();

    // 3. Listen for Supabase auth state changes (OAuth redirects, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await handleSupabaseSession(session.access_token);
          if (typeof window !== 'undefined' && window.location.pathname.includes('/login')) {
            router.push('/dashboard');
          }
        }
        if (event === 'SIGNED_OUT') {
          clearLocalAuth();
        }
        if (event === 'TOKEN_REFRESHED' && session) {
          // Update the stored token with the refreshed one
          const currentUser = getSavedUser();
          if (currentUser?.authMethod === 'SUPABASE') {
            saveSession(session.access_token, currentUser);
            setToken(session.access_token);
          }
        }
      },
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handle a Supabase access token ─────────────────────────────
  const handleSupabaseSession = useCallback(async (accessToken: string) => {
    try {
      // 1. Validate token
      if (!accessToken || typeof accessToken !== 'string' || accessToken.trim() === '') {
        throw new Error('Authentication failed: invalid or missing token.');
      }
      
      console.log('AUTH - Syncing session with backend...');

      // 2. Clear any old session data from localStorage to ensure 
      // the interceptor doesn't send a stale token if the handshake fails
      clearSession();

      // 3. Provision / fetch user in our backend DB
      const { user: backendUser } = await authApi.supabaseSignIn(accessToken);
      
      // 4. Save to localStorage (so API interceptor can find it)
      saveSession(accessToken, backendUser);
      
      // 4. Update React state
      setToken(accessToken);
      setUser(backendUser);
      setAuthMethod('SUPABASE');
      
      console.log('AUTH - Session synchronized successfully');
    } catch (err: any) {
      console.error('AUTH - Synchronization failed:', err.message);
      
      // Clear everything to prevent broken state
      clearSession();
      setToken(null);
      setUser(null);
      setAuthMethod(null);

      toast.error('Unable to synchronize your session. Please sign in again.');
      
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        router.push('/login?error=sync_failed');
      }
    }
  }, [router]);

  // ── Clear local auth state ──────────────────────────────────────
  const clearLocalAuth = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
    setAuthMethod(null);
    // Force redirect to login on sign out or cleared session
    if (typeof window !== 'undefined' && window.location.pathname === '/dashboard') {
      router.push('/login');
    }
  }, [router]);

  // ── Custom: Register ────────────────────────────────────────────
  const registerCustom = useCallback(async (email: string, password: string) => {
    const { user: newUser, accessToken } = await authApi.register(email, password);
    if (!accessToken) throw new Error('No token returned from server');
    saveSession(accessToken, newUser);
    setToken(accessToken);
    setUser(newUser);
    setAuthMethod('CUSTOM');
    router.push('/dashboard');
    toast.success('Account created! Welcome 🎉');
  }, [router]);

  // ── Custom: Login ───────────────────────────────────────────────
  const loginCustom = useCallback(async (email: string, password: string) => {
    const { user: loggedIn, accessToken } = await authApi.login(email, password);
    if (!accessToken) throw new Error('No token returned from server');
    saveSession(accessToken, loggedIn);
    setToken(accessToken);
    setUser(loggedIn);
    setAuthMethod('CUSTOM');
    router.push('/dashboard');
    toast.success(`Welcome back, ${loggedIn.email}!`);
  }, [router]);

  // ── Supabase: OAuth (Google / GitHub) ──────────────────────────
  const loginWithSupabase = useCallback(async (provider: 'google' | 'github') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw new Error(error.message);
    // The onAuthStateChange listener handles the rest after redirect
  }, []);

  // ── Supabase: Email/Password Sign-In ───────────────────────────
  const loginWithSupabaseEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    if (data.session) {
      await handleSupabaseSession(data.session.access_token);
      router.push('/dashboard');
      toast.success(`Welcome back, ${email}!`);
    }
  }, [handleSupabaseSession, router]);

  // ── Supabase: Email/Password Registration ──────────────────────
  const registerWithSupabaseEmail = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    if (data.session) {
      await handleSupabaseSession(data.session.access_token);
      router.push('/dashboard');
      toast.success('Account created via Supabase! Welcome 🎉');
    } else {
      // Supabase email confirmation is enabled — user must verify email
      toast.success('Check your email to confirm your account!');
    }
  }, [handleSupabaseSession, router]);

  // ── Logout ──────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (authMethod === 'SUPABASE') {
      await supabase.auth.signOut();
    }
    clearLocalAuth();
    router.push('/login');
    toast.success('Signed out successfully');
  }, [authMethod, clearLocalAuth, router]);

  const value: AuthContextType = {
    user,
    token,
    authMethod,
    isLoading,
    registerCustom,
    loginCustom,
    loginWithSupabase,
    loginWithSupabaseEmail,
    registerWithSupabaseEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
