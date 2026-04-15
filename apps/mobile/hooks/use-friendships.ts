import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';
import type { FriendshipDto } from '@meeple/shared';

export function useFriends() {
  return useQuery({
    queryKey: ['friendships'],
    queryFn: () => authedApi.get<FriendshipDto[]>('/friendships'),
  });
}

export function useFriendRequests() {
  return useQuery({
    queryKey: ['friendship-requests'],
    queryFn: () => authedApi.get<FriendshipDto[]>('/friendships/requests'),
  });
}

export function useSendFriendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (toUserId: string) =>
      authedApi.post<any>('/friendships', { toUserId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friendships'] });
      qc.invalidateQueries({ queryKey: ['friendship-requests'] });
    },
  });
}

export function useAcceptFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      authedApi.patch<any>(`/friendships/${friendshipId}/accept`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friendships'] });
      qc.invalidateQueries({ queryKey: ['friendship-requests'] });
    },
  });
}

export function useDeclineFriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (friendshipId: string) =>
      authedApi.delete<void>(`/friendships/${friendshipId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friendship-requests'] });
    },
  });
}

export function useUnfriend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) =>
      authedApi.delete<void>(`/friendships/friend/${otherUserId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['friendships'] }),
  });
}
