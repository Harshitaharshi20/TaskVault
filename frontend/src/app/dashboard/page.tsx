'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, User as UserIcon, Loader2, Sparkles, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { todosApi } from '@/lib/api';
import { Todo } from '@/types';
import TodoList from '@/components/TodoList';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function DashboardPage() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [todos, setTodos]       = useState<Todo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      const data = await todosApi.getAll();
      setTodos(data);
    } catch (err: any) {
      if (err.message.includes('Network Error')) {
        toast.error('Cannot connect to the backend. Please check if the server is running on port 4000.', { duration: 6000 });
      } else {
        toast.error('Failed to load tasks from your vault');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login');
      } else {
        fetchTodos();
      }
    }
  }, [user, authLoading, router, fetchTodos]);

  const handleCreate = async (title: string, description?: string) => {
    setCreating(true);
    try {
      const newTodo = await todosApi.create({ title, description });
      setTodos((prev) => [newTodo, ...prev]);
      toast.success('Task added to your vault!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await todosApi.toggle(id);
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err: any) {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await todosApi.delete(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      toast.success('Task removed');
    } catch (err: any) {
      toast.error('Deletion failed');
    }
  };

  const handleUpdate = async (id: string, title: string, description?: string) => {
    try {
      const updated = await todosApi.update(id, { title, description });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success('Task updated');
    } catch (err: any) {
      toast.error('Update failed');
    }
  };

  if (authLoading || (loading && !todos.length)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
          <div className="absolute inset-0 blur-xl bg-indigo-400/20 rounded-full animate-pulse"></div>
        </div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em] animate-pulse">Synchronizing Vault</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col animate-in">
      {/* Navbar */}
      <header className="glass-nav border-white/20 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-slate-900 leading-none tracking-tight">TaskVault</span>
              <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">Secure Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/50 rounded-2xl border border-white/40 shadow-inner">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center">
                <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <span className="text-xs font-bold text-slate-700 max-w-[150px] truncate">
                {user.email}
              </span>
              <div className={clsx(
                "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter border",
                user.authMethod === 'SUPABASE' 
                  ? "bg-amber-50 text-amber-600 border-amber-100" 
                  : "bg-indigo-50 text-indigo-600 border-indigo-100"
              )}>
                {user.authMethod}
              </div>
            </div>
            
            <button
              onClick={logout}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
              title="Secure Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 animate-in stagger-1">
          <div>
            <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              My Tasks
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </h2>
            <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              You have <span className="text-slate-900 font-bold">{todos.filter(t => !t.completed).length}</span> items remaining in your vault
            </p>
          </div>
          
          <div className="hidden md:block">
             <div className="p-3 glass-card !rounded-2xl flex items-center gap-4 pr-6">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400">
                  {Math.round((todos.filter(t => t.completed).length / (todos.length || 1)) * 100)}%
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Completion Rate</span>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000" 
                      style={{ width: `${(todos.filter(t => t.completed).length / (todos.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="animate-in stagger-2">
          <TodoList
            todos={todos}
            creating={creating}
            onCreate={handleCreate}
            onToggle={handleToggle}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 text-center mt-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          <Plus className="w-3 h-3" /> Encrypted via TaskVault Kernel 1.0
        </div>
        <p className="text-[10px] text-slate-400 mt-4 font-bold tracking-tighter">
          &copy; 2024 TASKVAULT SYSTEMS. ALL RIGHTS RESERVED.
        </p>
      </footer>
    </div>
  );
}
