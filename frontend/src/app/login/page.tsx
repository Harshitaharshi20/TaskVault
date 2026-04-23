'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users away from the login page
  useEffect(() => {
    if (!isLoading && user) router.replace('/dashboard');
  }, [user, isLoading, router]);

  if (isLoading) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-200/20 blur-[120px] rounded-full"></div>
      
      <AuthForm mode="login" />
    </main>
  );
}
