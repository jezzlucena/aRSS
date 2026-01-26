import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '@arss/types';

export function useLogin() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<AuthResponse>('/auth/login', data);
      return response.data.data!;
    },
    onSuccess: (data) => {
      login(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      navigate('/');
    },
  });
}

export function useRegister() {
  const { login } = useAuthStore();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post<AuthResponse>('/auth/register', data);
      return response.data.data!;
    },
    onSuccess: (data) => {
      login(data.user, data.tokens.accessToken, data.tokens.refreshToken);
      navigate('/');
    },
  });
}

export function useLogout() {
  const { logout, refreshToken } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout', { refreshToken });
    },
    onSuccess: () => {
      logout();
      queryClient.clear();
      navigate('/auth/login');
    },
    onError: () => {
      // Even if the API fails, clear local state
      logout();
      queryClient.clear();
      navigate('/auth/login');
    },
  });
}

export function useCurrentUser() {
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: User }>('/auth/me');
      return response.data.data;
    },
    enabled: isAuthenticated,
  });
}
