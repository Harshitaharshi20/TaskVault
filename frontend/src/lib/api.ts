import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Todo, CreateTodoPayload, UpdateTodoPayload, AuthResponse, User } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ─────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ─────────────────────────────────────────────────────────────────
// Request interceptor — inject Bearer token automatically
// ─────────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─────────────────────────────────────────────────────────────────
// Response interceptor — surface clean error messages & handle 401
// ─────────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized globally
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');
        // Only redirect if we're not already on the login/register pages
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login?error=session_expired';
        }
      }
    }

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(Array.isArray(message) ? message.join(', ') : message));
  },
);

// ─────────────────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', { email, password });
    return data;
  },

  login: async (email: string, password: string): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return data;
  },

  /**
   * Called after a successful Supabase sign-in.
   * Sends the Supabase JWT to the backend so it can provision
   * (or find) the user in our PostgreSQL database.
   */
  supabaseSignIn: async (supabaseToken: string): Promise<{ user: User }> => {
    const { data } = await apiClient.post<{ user: User }>('/auth/supabase', { supabaseToken });
    return data;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/profile');
    return data;
  },
};

// ─────────────────────────────────────────────────────────────────
// Todos API
// ─────────────────────────────────────────────────────────────────
export const todosApi = {
  getAll: async (): Promise<Todo[]> => {
    const { data } = await apiClient.get<Todo[]>('/todos');
    return data;
  },

  getOne: async (id: string): Promise<Todo> => {
    const { data } = await apiClient.get<Todo>(`/todos/${id}`);
    return data;
  },

  create: async (payload: CreateTodoPayload): Promise<Todo> => {
    const { data } = await apiClient.post<Todo>('/todos', payload);
    return data;
  },

  update: async (id: string, payload: UpdateTodoPayload): Promise<Todo> => {
    const { data } = await apiClient.patch<Todo>(`/todos/${id}`, payload);
    return data;
  },

  toggle: async (id: string): Promise<Todo> => {
    const { data } = await apiClient.patch<Todo>(`/todos/${id}/toggle`);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/todos/${id}`);
  },
};

export default apiClient;
