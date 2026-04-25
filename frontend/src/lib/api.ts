import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Todo, CreateTodoPayload, UpdateTodoPayload, AuthResponse, User } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// ─────────────────────────────────────────────────────────────────
// Axios instance
// ─────────────────────────────────────────────────────────────────
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120_000, // Increased for Render cold starts
});

// ─────────────────────────────────────────────────────────────────
// Request interceptor — inject Bearer token automatically
// ─────────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      
      // Only inject token if it exists and we are not calling the Supabase sync endpoint
      // (which handles its own token in the manual headers)
      if (token && !config.url?.includes('/auth/supabase')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
      
      // Debug logging for troubleshooting
      if (config.url?.includes('/auth/supabase')) {
        console.log('API - Handshake request:', config.url);
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
    if (error.response?.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/supabase');

      // ❌ DO NOT clear session for initial Supabase sync
      if (!isAuthEndpoint) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('authUser');

        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')
        ) {
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
  supabaseSignIn: async (supabaseToken: string) => {
    console.log('API CALL - supabaseSignIn with token:', supabaseToken.substring(0, 15) + '...');
    const { data } = await apiClient.post(
      '/auth/supabase',
      {}, // ✅ EMPTY BODY
      {
        headers: {
          Authorization: `Bearer ${supabaseToken}`, // ✅ ONLY HERE
        },
      }
    );
    console.log('API CALL - Response from /auth/supabase:', data);

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
