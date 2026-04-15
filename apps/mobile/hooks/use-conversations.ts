import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authedApi } from '@/lib/api';
import type { ConversationDto } from '@meeple/shared';

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => authedApi.get<ConversationDto[]>('/conversations'),
  });
}

/** Get-or-create a 1:1 conversation with another user. Used to start a DM. */
export function useOpenConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (otherUserId: string) =>
      authedApi.post<{ id: string }>('/conversations/open', { otherUserId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}
