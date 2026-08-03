import { api } from './client';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
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
    api.patch<void>('/auth/password', data),
  verifyEmail: (token: string) => api.post<AuthUser>('/auth/verify-email', { token }),
  resendVerification: () => api.post<void>('/auth/resend-verification'),
  googleSignIn: (credential: string) => api.post<AuthResult>('/auth/google', { credential })
};
