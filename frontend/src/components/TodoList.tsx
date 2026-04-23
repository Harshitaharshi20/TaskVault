'use client';

import { useState, FormEvent } from 'react';
import { Plus, Loader2, ClipboardList, Target, CheckCircle2, Circle } from 'lucide-react';
import { Todo } from '@/types';
import TodoItem from './TodoItem';
import clsx from 'clsx';

type Filter = 'all' | 'active' | 'completed';

interface TodoListProps {
  todos:      Todo[];
  creating:   boolean;
  onCreate:   (title: string, description?: string) => Promise<void>;
  onToggle:   (id: string) => Promise<void>;
  onDelete:   (id: string) => Promise<void>;
  onUpdate:   (id: string, title: string, description?: string) => Promise<void>;
}

export default function TodoList({
  todos, creating, onCreate, onToggle, onDelete, onUpdate,
}: TodoListProps) {
  const [title, setTitle]     = useState('');
  const [desc, setDesc]       = useState('');
  const [filter, setFilter]   = useState<Filter>('all');
  const [expanded, setExpanded] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onCreate(title.trim(), desc.trim() || undefined);
    setTitle('');
    setDesc('');
    setExpanded(false);
  };

  const filtered = todos.filter((t) => {
    if (filter === 'active')    return !t.completed;
    if (filter === 'completed') return  t.completed;
    return true;
  });

  const activeCount    = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) =>  t.completed).length;

  return (
    <div className="space-y-8">
      {/* ── Create form ── */}
      <div className="glass-card p-6 border-white/60 shadow-lg group focus-within:shadow-indigo-100 transition-all duration-300">
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); if (e.target.value) setExpanded(true); }}
                onFocus={() => setExpanded(true)}
                placeholder="Secure new objective..."
                className="input-field !bg-transparent !border-none !px-0 !text-lg font-bold placeholder:text-slate-300 focus:ring-0"
                disabled={creating}
              />
            </div>
            <button
              type="submit"
              disabled={creating || !title.trim()}
              className="btn-primary !rounded-xl !p-3 aspect-square shadow-md"
              aria-label="Add todo"
            >
              {creating
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <Plus className="w-5 h-5 stroke-[3]" />
              }
            </button>
          </div>

          <div className={clsx(
            "grid transition-all duration-300 ease-in-out",
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 pointer-events-none"
          )}>
            <div className="overflow-hidden">
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Briefly describe the task parameters..."
                className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-4 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 placeholder:text-slate-400 transition-all"
                rows={2}
                disabled={creating}
              />
            </div>
          </div>
        </form>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center justify-between animate-in stagger-2">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/50 rounded-2xl border border-slate-200/30 backdrop-blur-sm">
          {([ 
            { key: 'all',       label: 'All', icon: Target },
            { key: 'active',    label: 'Pending', icon: Circle },
            { key: 'completed', label: 'Completed', icon: CheckCircle2 },
          ] as { key: Filter; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300',
                filter === key
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-100 scale-[1.02]'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon className={clsx("w-3.5 h-3.5", filter === key ? "text-indigo-500" : "text-slate-400")} />
              {label}
            </button>
          ))}
        </div>
        
        <div className="hidden sm:block text-[10px] font-black text-slate-300 uppercase tracking-widest">
          {filtered.length} Displayed Items
        </div>
      </div>

      {/* ── Todo list ── */}
      {filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-24 text-center animate-in stagger-3">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
            <ClipboardList className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Vault Empty</h3>
          <p className="text-sm font-medium text-slate-400 mt-2 max-w-[200px]">
            {filter === 'all'
              ? 'No task logs found. Initialize a new one above.'
              : filter === 'active'
              ? 'All clear. No pending objectives remain.'
              : 'Archive is empty. Secure some completions first.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-4 animate-in stagger-3 pb-20">
          {filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
