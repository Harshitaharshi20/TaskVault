'use client';

import React, { useState, FormEvent } from 'react';
import Link from 'next/link';
import { Mail, Lock, Loader2, Github, Chrome, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface AuthFormProps {
  mode: 'login' | 'register';
}

type AuthTab = 'custom' | 'supabase';

export default function AuthForm({ mode }: AuthFormProps) {
  const {
    loginCustom,
    registerCustom,
    loginWithSupabase,
    loginWithSupabaseEmail,
    registerWithSupabaseEmail,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>('custom');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'github' | null>(null);

  const isLogin = mode === 'login';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      if (activeTab === 'custom') {
        if (isLogin) {
          await loginCustom(email, password);
        } else {
          await registerCustom(email, password);
        }
      } else {
        if (isLogin) {
          await loginWithSupabaseEmail(email, password);
        } else {
          await registerWithSupabaseEmail(email, password);
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    setOauthLoading(provider);
    try {
      await loginWithSupabase(provider);
    } catch (err: any) {
      toast.error(err.message || 'OAuth sign-in failed');
      setOauthLoading(null);
    }
  };

  return (
    <div className="glass-card w-full max-w-md p-8 animate-in">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 mb-4 shadow-inner">
          <ShieldCheck className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h1>
        <p className="text-slate-500 mt-2 font-medium">
          {isLogin ? 'Access your personal task vault' : 'Start your productivity journey today'}
        </p>
      </div>

      {/* Auth method tabs */}
      <div className="flex rounded-2xl border border-slate-200 p-1.5 mb-8 bg-slate-100/50">
        {(['custom', 'supabase'] as AuthTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-300',
              activeTab === tab
                ? 'bg-white text-indigo-600 shadow-md transform scale-[1.02]'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab === 'custom' ? 'Standard' : 'Supabase'}
          </button>
        ))}
      </div>

      {/* Email + password form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="label-text">Email Address</label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              id="email"
              type="email"
              required
              className="input-field pl-12"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="label-text">Password</label>
          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              id="password"
              type="password"
              required
              className="input-field pl-12"
              placeholder={isLogin ? '••••••••' : 'Min. 8 characters'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={8}
            />
          </div>
          {!isLogin && activeTab === 'custom' && (
            <p className="text-[11px] text-slate-400 mt-2 ml-1 leading-relaxed">
              Password must contain at least 8 characters, including one uppercase and one number.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full group mt-2"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> {isLogin ? 'Authenticating...' : 'Provisioning...'}</>
          ) : (
            <span className="flex items-center gap-2">
              {isLogin ? 'Sign In to Vault' : 'Initialize Account'}
            </span>
          )}
        </button>
      </form>

      {/* Divider + OAuth */}
      {activeTab === 'supabase' && (
        <div className="animate-in stagger-1">
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">or secure login via</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={!!oauthLoading}
              className="btn-secondary group"
            >
              {oauthLoading === 'google'
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Chrome className="w-5 h-5 text-red-500 group-hover:scale-110 transition-transform" />
              }
              <span className="text-xs font-bold">Google</span>
            </button>
            <button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={!!oauthLoading}
              className="btn-secondary group"
            >
              {oauthLoading === 'github'
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Github className="w-5 h-5 text-slate-900 group-hover:scale-110 transition-transform" />
              }
              <span className="text-xs font-bold">GitHub</span>
            </button>
          </div>
        </div>
      )}

      {/* Switch page link */}
      <div className="mt-10 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500 font-medium">
          {isLogin ? (
            <>New to TaskVault?{' '}
              <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                Create an account
              </Link>
            </>
          ) : (
            <>Already have a vault?{' '}
              <Link href="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
                Sign in here
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
