'use client';

import { useState } from 'react';
import { Check, Trash2, Pencil, X, Save, Loader2, Calendar, MoreVertical } from 'lucide-react';
import { Todo } from '@/types';
import clsx from 'clsx';

interface TodoItemProps {
  todo: Todo;
  onToggle:  (id: string) => Promise<void>;
  onDelete:  (id: string) => Promise<void>;
  onUpdate:  (id: string, title: string, description?: string) => Promise<void>;
}

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [editing, setEditing]   = useState(false);
  const [title, setTitle]       = useState(todo.title);
  const [desc, setDesc]         = useState(todo.description || '');
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(todo.id); } finally { setToggling(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await onDelete(todo.id); } finally { setDeleting(false); }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onUpdate(todo.id, title.trim(), desc.trim() || undefined);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTitle(todo.title);
    setDesc(todo.description || '');
    setEditing(false);
  };

  return (
    <li className={clsx(
      'glass-card group px-6 py-5 flex gap-4 items-start transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100/50 hover:border-white/80',
      todo.completed && 'bg-slate-50/50 opacity-70 border-transparent shadow-none',
      editing && 'ring-2 ring-indigo-500/20 !border-indigo-500/50 shadow-2xl'
    )}>
      {/* Complete checkbox */}
      <button
        onClick={handleToggle}
        disabled={toggling || deleting}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        className={clsx(
          'mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all duration-300 transform active:scale-90',
          todo.completed
            ? 'bg-gradient-to-br from-indigo-500 to-violet-500 border-transparent shadow-md'
            : 'border-slate-200 bg-white hover:border-indigo-400 hover:shadow-inner',
        )}
      >
        {toggling
          ? <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
          : todo.completed && <Check className="w-4 h-4 text-white" strokeWidth={3} />
        }
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="space-y-4 animate-in">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Task Title"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full bg-white/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-600 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
              placeholder="Description (Optional)"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCancel();
              }}
            />
            <div className="flex gap-3">
              <button 
                onClick={handleSave} 
                disabled={saving || !title.trim()} 
                className="btn-primary !py-2 !px-4 !text-[10px] !rounded-lg uppercase tracking-widest font-black"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Sync Changes
              </button>
              <button 
                onClick={handleCancel} 
                className="btn-secondary !py-2 !px-4 !text-[10px] !rounded-lg uppercase tracking-widest font-black"
              >
                <X className="w-3.5 h-3.5" /> Abort
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <h4 className={clsx(
              'text-base font-bold text-slate-900 tracking-tight transition-all duration-500',
              todo.completed && 'text-slate-400 line-through decoration-indigo-500/30'
            )}>
              {todo.title}
            </h4>
            {todo.description && (
              <p className={clsx(
                'text-xs text-slate-500 font-medium leading-relaxed',
                todo.completed && 'opacity-50'
              )}>
                {todo.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3">
               <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-md">
                 <Calendar className="w-3 h-3 text-slate-400" />
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                   {new Date(todo.createdAt).toLocaleDateString('en-US', {
                     month: 'short', day: 'numeric'
                   })}
                 </span>
               </div>
               {todo.completed && (
                 <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-md">
                   <Check className="w-3 h-3 text-green-500" />
                   <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter">Verified</span>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!editing && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setEditing(true)}
            aria-label="Edit"
            className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all active:scale-90"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete"
            className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white shadow-sm transition-all active:scale-90"
          >
            {deleting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Trash2 className="w-4 h-4" />
            }
          </button>
        </div>
      )}
    </li>
  );
}
