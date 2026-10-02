import { api } from './apiClient';
import { LoginCredentials, LoginResponse, User } from '@/types/auth';

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const res = await api.post('/auth/login', credentials);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to login. Please check your credentials.');
    }
    const data: LoginResponse = await res.json();
    
    // Save tokens and user session in local storage and as a cookie for middleware
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      document.cookie = `accessToken=${data.accessToken}; path=/; max-age=86400; SameSite=Strict`;
    }
    return data;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const res = await api.post('/auth/change-password', { oldPassword, newPassword });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to change password.');
    }
  },

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Strict';
        window.location.href = '/login';
      }
    }
  },

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('accessToken');
    }
    return false;
  }
};
