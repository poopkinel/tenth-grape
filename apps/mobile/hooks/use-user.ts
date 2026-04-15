import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';
import type { GameSearchResultDto } from '@meeple/shared';

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => authedApi.get<any>('/users/me'),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => authedApi.patch<any>('/users/me', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useMyGames() {
  return useQuery({
    queryKey: ['my-games'],
    queryFn: () => authedApi.get<any[]>('/users/me/games'),
  });
}

export function useAddGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { bggId: number; ownership: string }) =>
      authedApi.post<any>('/users/me/games', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-games'] }),
  });
}

export function useRemoveGame() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bggId: number) => authedApi.delete<void>(`/users/me/games/${bggId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-games'] }),
  });
}

export function useSearchGames(query: string) {
  return useQuery({
    queryKey: ['bgg-search', query],
    queryFn: () => authedApi.get<GameSearchResultDto[]>(`/games/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 1,
  });
}
