import { api } from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResult {
  user: AuthUser;
  token: string;
}

export const authApi = {
  register: (data: { email: string; password: string; name?: string }) =>
    api.post<AuthResult>('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post<AuthResult>('/auth/login', data),
  me: () => api.get<AuthUser>('/auth/me'),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.patch<void>('/auth/password', data)
};
