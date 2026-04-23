// ─────────────────────────────────────────────────────────────────
// Domain Types
// ─────────────────────────────────────────────────────────────────

export type AuthMethod = 'CUSTOM' | 'SUPABASE';

export interface User {
  id: string;
  email: string;
  authMethod: AuthMethod;
  createdAt?: string;
  _count?: { todos: number };
}

export interface Todo {
  id: string;
  title: string;
  description?: string | null;
  completed: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────
// API Request / Response Types
// ─────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken?: string;
}

export interface CreateTodoPayload {
  title: string;
  description?: string;
}

export interface UpdateTodoPayload {
  title?: string;
  description?: string;
  completed?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// Auth Context Type
// ─────────────────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null;
  token: string | null;
  authMethod: AuthMethod | null;
  isLoading: boolean;
  registerCustom: (email: string, password: string) => Promise<void>;
  loginCustom: (email: string, password: string) => Promise<void>;
  loginWithSupabase: (provider: 'google' | 'github') => Promise<void>;
  loginWithSupabaseEmail: (email: string, password: string) => Promise<void>;
  registerWithSupabaseEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
