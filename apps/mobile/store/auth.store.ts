import { create } from 'zustand';
import type { AuthTokensDto, UserDto } from '@meeple/shared';
import { secureStorage } from '@/lib/secure-storage';

interface AuthState {
  user: UserDto | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  setTokens: (tokens: AuthTokensDto) => Promise<void>;
  setUser: (user: UserDto) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,

  setTokens: async ({ accessToken, refreshToken }) => {
    await secureStorage.set('accessToken', accessToken);
    await secureStorage.set('refreshToken', refreshToken);
    set({ accessToken, refreshToken });
  },

  setUser: (user) => set({ user }),

  logout: async () => {
    await secureStorage.remove('accessToken');
    await secureStorage.remove('refreshToken');
    set({ user: null, accessToken: null, refreshToken: null });
  },

  hydrate: async () => {
    const accessToken = await secureStorage.get('accessToken');
    const refreshToken = await secureStorage.get('refreshToken');
    set({ accessToken, refreshToken, isLoading: false });
  },
}));
